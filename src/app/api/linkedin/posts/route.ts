import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getUserPreferences } from "@/lib/db/preferences";
import { incrementUsage, resetUsageIfNewWeek, getUsage } from "@/lib/db/usage";
import { createGeneratedPost } from "@/lib/db/generated-posts";
import { searchPexelsImage, buildImageQuery } from "@/lib/pexelsService";
import { updateGeneratedPost } from "@/lib/db/generated-posts";
import type { BrandProfile } from "@/lib/types";

const nvidia = createOpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

const postSchema = z.object({
  title: z.string().describe("A short internal title for this post"),
  hook: z.string().describe("A catchy first line to stop the scroll"),
  content: z
    .string()
    .describe(
      "The main body of the LinkedIn post. Break into short paragraphs with line breaks."
    ),
  cta: z.string().describe("Call to action at the end to drive engagement"),
  hashtags: z.array(z.string()).describe("3-5 relevant hashtags"),
  engagement_score: z
    .number()
    .min(1)
    .max(100)
    .describe("Estimated engagement potential score out of 100"),
  best_time_to_post: z
    .string()
    .describe("Recommended day and time to post for maximum reach"),
  estimated_reading_time: z.string().describe("E.g. '2 mins'"),
  image_search_query: z
    .string()
    .describe(
      "A 2-4 word Pexels image search query that would find a great visual for this post (no people names)"
    ),
  tone: z
    .enum([
      "professional",
      "founder",
      "storytelling",
      "educational",
      "corporate",
      "thought_leadership",
    ])
    .describe("The tone used for this post"),
  topic_tag: z
    .string()
    .describe(
      "Short topic tag for this post (e.g. Leadership, AI, Career Growth)"
    ),
});

/**
 * POST /api/linkedin/posts
 *
 * Generates 3 distinct, personalized LinkedIn posts from the user's Brand Profile.
 * Each post uses a different tone and angle.
 * After saving, a Pexels image search is triggered for each post.
 *
 * Body: { brandProfile?: BrandProfile }  — if omitted, loads from user_preferences
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check usage — bulk generation counts as 3 posts
    let usage = await resetUsageIfNewWeek(userId);
    const plan = usage.plan;

    // Free plan: need at least 3 credits to generate 3 posts
    if (plan === "free" && usage.remaining_posts < 3) {
      return NextResponse.json(
        {
          error: `You need at least 3 weekly credits to generate your starter posts. You have ${usage.remaining_posts} remaining. Your credits reset on Monday.`,
        },
        { status: 403 }
      );
    }

    // Load brand profile from request or user_preferences
    const body = await req.json().catch(() => ({}));
    const brandProfileFromBody: Partial<BrandProfile> | null =
      body.brandProfile || null;

    const prefs = await getUserPreferences(userId);

    const headline =
      brandProfileFromBody?.headline ?? prefs?.headline ?? "Professional";
    const about =
      brandProfileFromBody?.about ??
      prefs?.about ??
      "A driven professional looking to grow their LinkedIn presence.";
    const industry =
      brandProfileFromBody?.industry ?? prefs?.industry ?? "Business";
    const skills =
      brandProfileFromBody?.skills ?? prefs?.skills ?? [];
    const experience =
      brandProfileFromBody?.experience ?? prefs?.experience ?? [];
    const targetAudience =
      brandProfileFromBody?.target_audience ?? prefs?.target_audience ?? "Professionals";
    const brandVoice =
      brandProfileFromBody?.brand_voice ?? prefs?.brand_voice ?? null;
    const interests =
      brandProfileFromBody?.interests ?? [];
    const toneSuggestion =
      brandProfileFromBody?.tone_suggestion ?? prefs?.writing_tone ?? "professional";

    const experienceSummary =
      experience
        .slice(0, 3)
        .map((e) => `${e.title} at ${e.company}`)
        .join(", ") || "N/A";

    const prompt = `You are an expert LinkedIn ghostwriter specializing in personal brand content.

USER BRAND PROFILE:
- Name/Headline: ${headline}
- About: ${about}
- Industry: ${industry}
- Skills: ${skills?.join(", ") || "N/A"}
- Experience: ${experienceSummary}
- Target Audience: ${targetAudience}
- Brand Voice: ${brandVoice || "Not specified"}
- Interests: ${interests?.join(", ") || "N/A"}
- Preferred Tone: ${toneSuggestion}

TASK:
Generate exactly 3 distinct LinkedIn posts for this user. Each post MUST:
1. Use a DIFFERENT angle and tone (mix from: professional, storytelling, educational, thought_leadership, founder)
2. Be specifically about a topic that matches their expertise and audience
3. Sound like a real human — avoid generic AI buzzwords and corporate speak
4. Have a unique, scroll-stopping hook
5. Include a genuine call-to-action
6. Be formatted for LinkedIn readability (short paragraphs, strategic line breaks)

${plan === "pro" ? "PREMIUM MODE: Use advanced AIDA or PAS copywriting frameworks. Make each post exceptionally magnetic." : ""}

Return an array of exactly 3 post objects.`;

    const { object } = await generateObject({
      model: nvidia.chat("meta/llama-3.1-70b-instruct"),
      schema: z.object({
        posts: z
          .array(postSchema)
          .length(3)
          .describe("Exactly 3 distinct LinkedIn posts"),
      }),
      prompt,
    });

    // Save all 3 posts to Firestore
    const savedPosts = await Promise.all(
      object.posts.map((p) =>
        createGeneratedPost({
          user_id: userId,
          title: p.title,
          hook: p.hook,
          content: p.content,
          cta: p.cta,
          hashtags: p.hashtags,
          tone: p.tone,
          length: "medium",
          topic: p.topic_tag,
          source_url: null,
          engagement_score: p.engagement_score,
          best_time_to_post: p.best_time_to_post,
          estimated_reading_time: p.estimated_reading_time,
          cover_image_url: null,
          is_favorite: false,
          is_pinned: false,
          is_archived: false,
        })
      )
    );

    // Decrement usage by 3
    await incrementUsage(userId);
    await incrementUsage(userId);
    await incrementUsage(userId);

    // Async Pexels image search for each post (non-blocking)
    // We do this after returning to not slow down the response
    const postsWithImages = await Promise.all(
      savedPosts.map(async (post, index) => {
        const query = buildImageQuery(
          post.title,
          object.posts[index].image_search_query || post.topic || "",
          industry
        );
        try {
          const imgResult = await searchPexelsImage(query);
          if (imgResult) {
            await updateGeneratedPost(post.id, userId, {
              cover_image_url: imgResult.imageUrl,
              image_model: "pexels",
              image_prompt: query,
              image_created_at: new Date().toISOString(),
            });
            return {
              ...post,
              cover_image_url: imgResult.imageUrl,
              pexels_photographer: imgResult.photographer,
              pexels_photographer_url: imgResult.photographerUrl,
              pexels_url: imgResult.pexelsUrl,
            };
          }
        } catch (e) {
          console.warn(`Pexels search failed for post ${post.id}:`, e);
        }
        return post;
      })
    );

    return NextResponse.json({
      success: true,
      posts: postsWithImages,
    });
  } catch (error: any) {
    console.error("LinkedIn posts generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate posts." },
      { status: 500 }
    );
  }
}
