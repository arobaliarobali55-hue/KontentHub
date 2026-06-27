import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getBrandBrain } from "@/lib/db/brand-brain";
import { getUsage } from "@/lib/db/usage";
import { createGeneratedPost, updateGeneratedPost } from "@/lib/db/generated-posts";
import { searchPexelsImage, buildImageQuery } from "@/lib/pexelsService";

const nvidia = createOpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

const importPrompts: Record<string, string> = {
  blog: "The source material is a blog article.",
  website: "The source material is webpage content.",
  youtube: "The source material is a YouTube video transcript/description.",
  pdf: "The source material is extracted text from an uploaded document/resume.",
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Verify Pro Plan
    const usage = await getUsage(userId);
    if (!usage || usage.plan !== "pro") {
      return NextResponse.json(
        { error: "This feature is only available for Pro members." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { url, text, importType, tone, length } = body;

    if (!importType) {
      return NextResponse.json({ error: "importType is required" }, { status: 400 });
    }

    let sourceContent = "";

    // 2. Fetch/Scrape source content based on importType
    if (importType === "pdf") {
      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: "PDF text content is empty" }, { status: 400 });
      }
      sourceContent = text;
    } else {
      if (!url) {
        return NextResponse.json({ error: "URL is required for this import type" }, { status: 400 });
      }

      console.log(`[Import Blog] Scraping URL (${importType}): ${url}`);
      try {
        const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
          headers: {
            Authorization: `Bearer ${process.env.JINA_API_KEY || ""}`,
          },
          signal: AbortSignal.timeout(15000),
        });

        if (jinaRes.ok) {
          sourceContent = await jinaRes.text();
        } else {
          const errText = await jinaRes.text();
          throw new Error(`Jina AI scrape failed with code ${jinaRes.status}: ${errText}`);
        }
      } catch (e: any) {
        console.error("[Import Blog] Failed to scrape URL:", e);
        return NextResponse.json(
          { error: `Failed to read the content: ${e.message || "Scraper timeout."}` },
          { status: 500 }
        );
      }
    }

    if (!sourceContent || sourceContent.trim().length < 50) {
      return NextResponse.json(
        { error: "The imported content is too short or empty." },
        { status: 400 }
      );
    }

    // 3. Retrieve user's Brand Brain to anchor the posts
    const brain = await getBrandBrain(userId);
    const brandContext = brain
      ? `
        WRITER BRAND BRAIN:
        - Headline: ${brain.headline || "N/A"}
        - Bio: ${brain.bio || "N/A"}
        - Industry: ${brain.industry || "N/A"}
        - Skills: ${brain.skills?.join(", ") || "N/A"}
        - Expertise: ${brain.expertise?.join(", ") || "N/A"}
        - Target Audience: ${brain.audience || "N/A"}
        - Content Pillars: ${brain.content_pillars?.join(", ") || "N/A"}
        - Favorite Topics: ${brain.favorite_topics?.join(", ") || "N/A"}
        - Personal Story Summary: ${brain.personal_story || "N/A"}
        - Writing Tone: ${tone || brain.writing_tone || "professional"}
        - Emoji Preference: ${brain.emoji_style || "few"}
        - CTA Style: ${brain.cta_style || "subtle"}
        - Keywords to include: ${brain.keywords?.join(", ") || "N/A"}`
      : `
        WRITER PROFILE:
        - Default Tone: ${tone || "professional"}`;

    const importInstruction = importPrompts[importType] || "The source material is an imported document.";

    const prompt = `You are a high-end personal branding writer.
    
    ${brandContext}
    
    SOURCE MATERIAL:
    ${importInstruction}
    Here is the content:
    ${sourceContent.substring(0, 10000)}
    
    TASK:
    Generate exactly 3 high-quality LinkedIn posts based on the Source Material, but fully written in the voice, tone, and brand of the writer described in the BRAND BRAIN.
    
    Requirements:
    1. Each post should focus on a DIFFERENT angle or key takeaway from the article.
    2. Write in the exact writing tone, cta style, and emoji frequency specified in the Brand Brain.
    3. Make it sound human, authoritative, and engaging. Strategic spacing and scroll-stopping hooks are required.
    4. Provide a visual Pexels query for each post.
    
    Return exactly 3 post objects.`;

    console.log("[Import Blog] Generating posts from content");
    const { object } = await generateObject({
      model: nvidia.chat("meta/llama-3.1-70b-instruct"),
      schema: z.object({
        posts: z.array(
          z.object({
            title: z.string().describe("Short internal title"),
            hook: z.string().describe("Scroll-stopping hook line"),
            content: z.string().describe("Main body of the LinkedIn post. Break into short paragraphs."),
            cta: z.string().describe("Call to action"),
            hashtags: z.array(z.string()).describe("3-5 hashtags"),
            engagement_score: z.number().min(10).max(100).describe("Engagement potential"),
            best_time_to_post: z.string().describe("E.g. Tuesday 9:00 AM"),
            estimated_reading_time: z.string().describe("E.g. '2 mins'"),
            image_search_query: z.string().describe("2-4 word visual query for image search"),
            tone: z.enum([
              "professional",
              "founder",
              "storytelling",
              "educational",
              "corporate",
              "thought_leadership",
            ]),
            topic_tag: z.string().describe("E.g. Career, Leadership, Technology"),
          })
        ).length(3),
      }),
      prompt,
    });

    // 4. Save posts to database
    console.log("[Import Blog] Saving posts to database");
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
          length: length || "medium",
          topic: p.topic_tag,
          source_url: url || null,
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

    // 5. Try to get og:image from source URL first, then query Pexels if needed
    console.log("[Import Blog] Querying cover images");
    let ogImageUrl: string | null = null;
    if (url) {
      try {
        const response = await fetch(`https://r.jina.ai/${url}`);
        if (response.ok) {
          const html = await response.text();
          const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i) ||
                               html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/i);
          if (ogImageMatch && ogImageMatch[1]) {
            ogImageUrl = ogImageMatch[1];
          }
        }
      } catch (ogError) {
        console.error("[Import Blog] Failed to fetch og:image from source URL:", ogError);
      }
    }

    const postsWithImages = await Promise.all(
      savedPosts.map(async (post, idx) => {
        let coverImageUrl: string | null = ogImageUrl;
        let imageModel: string | null = ogImageUrl ? "og:image" : null;
        let pexelsPhotographer: string | null = null;
        let pexelsPhotographerUrl: string | null = null;

        // If no og:image, use Pexels
        if (!coverImageUrl) {
          const query = buildImageQuery(
            post.title,
            object.posts[idx].image_search_query || post.topic || "",
            brain?.industry
          );
          try {
            const imgResult = await searchPexelsImage(query);
            if (imgResult) {
              coverImageUrl = imgResult.imageUrl;
              imageModel = "pexels";
              pexelsPhotographer = imgResult.photographer;
              pexelsPhotographerUrl = imgResult.photographerUrl;
            }
          } catch (e) {
            console.warn(`[Import Blog] Pexels search failed for post ${post.id}:`, e);
          }
        }

        // Update post with cover image if found
        if (coverImageUrl) {
          await updateGeneratedPost(post.id, userId, {
            cover_image_url: coverImageUrl,
            image_model: imageModel,
            image_prompt: ogImageUrl ? undefined : buildImageQuery(
              post.title,
              object.posts[idx].image_search_query || post.topic || "",
              brain?.industry
            ),
            image_created_at: new Date().toISOString(),
            pexels_photographer: pexelsPhotographer,
            pexels_photographer_url: pexelsPhotographerUrl,
          });
          return {
            ...post,
            cover_image_url: coverImageUrl,
            pexels_photographer: pexelsPhotographer,
            pexels_photographer_url: pexelsPhotographerUrl,
            image_model: imageModel,
          };
        }

        return post;
      })
    );

    return NextResponse.json({
      success: true,
      posts: postsWithImages,
    });
  } catch (error: any) {
    console.error("Content import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import content." },
      { status: 500 }
    );
  }
}
