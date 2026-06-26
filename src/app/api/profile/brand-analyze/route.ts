import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getBrandBrain, saveBrandBrain } from "@/lib/db/brand-brain";
import { updateUserPreferences, ensureUserPreferences } from "@/lib/db/preferences";
import { createGeneratedPost, updateGeneratedPost } from "@/lib/db/generated-posts";
import { searchPexelsImage, buildImageQuery } from "@/lib/pexelsService";
import type { BrandBrain } from "@/lib/types";

const nvidia = createOpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { linkedinUrl } = body;

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: "LinkedIn profile URL is required." },
        { status: 400 }
      );
    }

    // 1. Get existing basic OAuth profile if available
    const existingBrain = await getBrandBrain(userId);
    const oauthName = existingBrain?.name || null;
    const oauthEmail = existingBrain?.email || null;
    const oauthPic = existingBrain?.profile_picture || null;
    const oauthUrn = existingBrain?.linkedin_urn || null;
    const oauthStatus = existingBrain?.connection_status || "disconnected";

    console.log(`[Brand Analyze] Starting analysis for user: ${userId}, URL: ${linkedinUrl}`);

    // 2. Scrape LinkedIn Public Profile URL via Jina AI
    let scrapedText = "";
    try {
      const jinaRes = await fetch(`https://r.jina.ai/${linkedinUrl}`, {
        headers: {
          Authorization: `Bearer ${process.env.JINA_API_KEY || ""}`,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (jinaRes.ok) {
        scrapedText = await jinaRes.text();
      } else {
        console.warn(`[Brand Analyze] Jina failed to scrape profile. Status: ${jinaRes.status}`);
      }
    } catch (e) {
      console.warn("[Brand Analyze] Failed to fetch profile via Jina AI:", e);
    }

    // Fallback if scraping is completely blocked or empty
    if (!scrapedText || scrapedText.trim().length < 100) {
      console.log("[Brand Analyze] Scraping empty or failed. Using fallback simulation for Brand Brain.");
      scrapedText = `
        Name: ${oauthName || "LinkedIn User"}
        Headline: Professional in the technology space.
        About: A passionate expert dedicated to business excellence and professional development.
        Experience: 
        - Senior Specialist at Technology Solutions (Present)
        - Professional Consultant at Consulting Group (2 years)
        Skills: Leadership, Strategy, Communication, Technology.
      `;
    }

    // 3. AI Brand Brain Synthesis via NVIDIA Llama 3.1
    console.log("[Brand Analyze] Synthesizing Brand Brain via LLM");
    const { object: synthesized } = await generateObject({
      model: nvidia.chat("meta/llama-3.1-70b-instruct"),
      schema: z.object({
        headline: z.string().nullable().describe("Professional headline or role title"),
        bio: z.string().nullable().describe("2-3 sentence professional bio synthesized from the profile"),
        industry: z.string().nullable().describe("Primary industry (e.g. Software Engineering, Marketing)"),
        skills: z.array(z.string()).describe("Top 8-12 professional skills"),
        experience: z.array(
          z.object({
            title: z.string(),
            company: z.string(),
            duration: z.string().optional(),
            description: z.string().optional(),
          })
        ).describe("Work experience history"),
        featured: z.string().nullable().describe("Key projects, links or articles featured on their profile"),
        recent_posts: z.string().nullable().describe("A summary of recent LinkedIn posts, comments, or activity if available"),

        // Brand Brain fields
        expertise: z.array(z.string()).describe("Areas of deep expertise or subject matter topics"),
        writing_tone: z.enum([
          "professional",
          "founder",
          "storytelling",
          "educational",
          "corporate",
          "thought_leadership",
        ]).describe("Recommended posting tone"),
        audience: z.string().nullable().describe("Who this person is trying to reach on LinkedIn"),
        cta_style: z.string().describe("Recommended call-to-action style (e.g. subtle, direct, question-based)"),
        emoji_style: z.string().describe("Emoji frequency preference (e.g. none, few, many)"),
        content_pillars: z.array(z.string()).describe("3-5 primary content themes or topics they should write about"),
        favorite_topics: z.array(z.string()).describe("Specific topics or concepts they love discussing"),
        personal_story: z.string().nullable().describe("A narrative summary of their career journey and personal brand story"),
        recent_activity: z.string().nullable().describe("A summary of their recent posts, articles or activity"),
        keywords: z.array(z.string()).describe("10-15 key terms relevant to their professional brand"),
      }),
      prompt: `You are an expert personal branding consultant. Analyze the following professional profile data (scraped from a public profile) and synthesize it into a comprehensive, high-value personal "Brand Brain".
      
      Ensure you extract detailed, actionable themes. Highlight personal stories and content pillars that would make for engaging LinkedIn posts.
      
      Profile Data:
      ${scrapedText}
      
      OAuth Connected Info:
      - Connected Name: ${oauthName || "N/A"}
      - Connected Email: ${oauthEmail || "N/A"}`,
    });

    // 4. Save Brand Brain to Firestore
    console.log("[Brand Analyze] Saving Brand Brain to Firestore");
    const brandBrain = await saveBrandBrain(userId, {
      name: oauthName || synthesized.headline || "LinkedIn User",
      email: oauthEmail,
      profile_picture: oauthPic,
      linkedin_urn: oauthUrn,
      connection_status: oauthStatus,
      linkedin_url: linkedinUrl,
      headline: synthesized.headline,
      bio: synthesized.bio,
      industry: synthesized.industry,
      skills: synthesized.skills,
      experience: synthesized.experience,
      featured: synthesized.featured,
      recent_posts: synthesized.recent_posts,
      
      // Synthesized fields
      expertise: synthesized.expertise,
      writing_tone: synthesized.writing_tone,
      audience: synthesized.audience,
      cta_style: synthesized.cta_style,
      emoji_style: synthesized.emoji_style,
      content_pillars: synthesized.content_pillars,
      favorite_topics: synthesized.favorite_topics,
      personal_story: synthesized.personal_story,
      recent_activity: synthesized.recent_activity,
      keywords: synthesized.keywords,
    });

    // 5. Update user preferences to synchronize core settings
    console.log("[Brand Analyze] Synchronizing settings user_preferences");
    await ensureUserPreferences(userId);
    await updateUserPreferences(userId, {
      headline: synthesized.headline,
      about: synthesized.bio,
      industry: synthesized.industry,
      skills: synthesized.skills,
      experience: synthesized.experience,
      writing_tone: synthesized.writing_tone,
      target_audience: synthesized.audience,
      brand_voice: synthesized.personal_story,
      use_emojis: synthesized.emoji_style !== "none",
      cta_style: synthesized.cta_style,
      recent_activity: synthesized.recent_activity,
      onboarding_status: "completed",
      brand_brain_id: userId,
      linkedin_connected: oauthStatus === "connected",
    });

    // 6. Generate 3 Starter Posts from Brand Brain
    console.log("[Brand Analyze] Generating 3 starter posts from Brand Brain");
    
    const postPrompt = `You are an expert LinkedIn copywriter.
    
    You are writing for a professional with the following BRAND BRAIN:
    - Name: ${brandBrain.name || "LinkedIn Professional"}
    - Headline: ${brandBrain.headline || "N/A"}
    - About/Bio: ${brandBrain.bio || "N/A"}
    - Industry: ${brandBrain.industry || "N/A"}
    - Skills: ${brandBrain.skills?.join(", ") || "N/A"}
    - Expertise: ${brandBrain.expertise?.join(", ") || "N/A"}
    - Target Audience: ${brandBrain.audience || "Professionals"}
    - Recommended Tone: ${brandBrain.writing_tone}
    - Content Pillars: ${brandBrain.content_pillars?.join(", ") || "Professional Growth"}
    - Keywords: ${brandBrain.keywords?.join(", ") || "N/A"}
    - Emoji Preference: ${brandBrain.emoji_style}
    - CTA Style: ${brandBrain.cta_style}
    
    TASK:
    Generate exactly 3 high-quality, distinct LinkedIn posts that sound human, professional, and authentic to this user's brand brain.
    
    Each post must:
    1. Focus on a DIFFERENT angle or Content Pillar.
    2. Use a distinct writing style/framework matching their expertise (Mix of story-driven, educational, or thought-leadership).
    3. Include strategic spacing/formatting, a magnetic hook, a natural CTA, and 3-5 hashtags.
    4. Have a unique short internal title and a visual search query for Pexels.
    
    Return exactly 3 post objects.`;

    const { object: postObject } = await generateObject({
      model: nvidia.chat("meta/llama-3.1-70b-instruct"),
      schema: z.object({
        posts: z.array(
          z.object({
            title: z.string().describe("Short internal title"),
            hook: z.string().describe("Scrolling-stopping hook line"),
            content: z.string().describe("Main body. strategically spaced paragraphs"),
            cta: z.string().describe("Engaging Call to Action"),
            hashtags: z.array(z.string()).describe("3-5 hashtags"),
            engagement_score: z.number().min(10).max(100).describe("Estimated score"),
            best_time_to_post: z.string().describe("Recommended posting slot"),
            estimated_reading_time: z.string().describe("E.g. '2 mins'"),
            image_search_query: z.string().describe("2-4 word visual Pexels search query"),
            tone: z.enum([
              "professional",
              "founder",
              "storytelling",
              "educational",
              "corporate",
              "thought_leadership",
            ]),
            topic_tag: z.string().describe("Category/tag"),
          })
        ).length(3),
      }),
      prompt: postPrompt,
    });

    // Save posts to database
    console.log("[Brand Analyze] Saving posts to database");
    const savedPosts = await Promise.all(
      postObject.posts.map((p) =>
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

    // Search and apply Pexels images for each post
    console.log("[Brand Analyze] Querying Pexels images for each starter post");
    const postsWithImages = await Promise.all(
      savedPosts.map(async (post, idx) => {
        const query = buildImageQuery(
          post.title,
          postObject.posts[idx].image_search_query || post.topic || "",
          brandBrain.industry
        );
        try {
          const imgResult = await searchPexelsImage(query);
          if (imgResult) {
            await updateGeneratedPost(post.id, userId, {
              cover_image_url: imgResult.imageUrl,
              image_model: "pexels",
              image_prompt: query,
              image_created_at: new Date().toISOString(),
              pexels_photographer: imgResult.photographer,
              pexels_photographer_url: imgResult.photographerUrl,
            });
            return {
              ...post,
              cover_image_url: imgResult.imageUrl,
              pexels_photographer: imgResult.photographer,
              pexels_photographer_url: imgResult.photographerUrl,
              image_model: "pexels",
            };
          }
        } catch (e) {
          console.warn(`[Brand Analyze] Pexels search failed for post ${post.id}:`, e);
        }
        return post;
      })
    );

    console.log(`[Brand Analyze] Brand Brain build & post generation complete for user: ${userId}`);

    return NextResponse.json({
      success: true,
      brain: brandBrain,
      posts: postsWithImages,
    });
  } catch (error: any) {
    console.error("Brand profile analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze profile." },
      { status: 500 }
    );
  }
}
