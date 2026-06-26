import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getPost, updateGeneratedPost } from "@/lib/db/generated-posts";
import { getBrandBrain } from "@/lib/db/brand-brain";
import { getUsage } from "@/lib/db/usage";

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

    // 1. Verify Pro Plan
    const usage = await getUsage(userId);
    if (!usage || usage.plan !== "pro") {
      return NextResponse.json(
        { error: "Post rewriting is a Pro feature." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { postId, instructions } = body;

    if (!postId || !instructions) {
      return NextResponse.json(
        { error: "postId and instructions are required" },
        { status: 400 }
      );
    }

    // 2. Fetch original post
    const post = await getPost(postId, userId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 3. Load Brand Brain
    const brain = await getBrandBrain(userId);
    const brandContext = brain
      ? `
        WRITER BRAND BRAIN:
        - Headline: ${brain.headline || "N/A"}
        - Bio: ${brain.bio || "N/A"}
        - Expertise: ${brain.expertise?.join(", ") || "N/A"}
        - Writing Tone: ${brain.writing_tone}
        - Content Pillars: ${brain.content_pillars?.join(", ") || "N/A"}
        - CTA Style: ${brain.cta_style}
        - Emoji Preference: ${brain.emoji_style}
        - Brand Voice Summary: ${brain.personal_story || "N/A"}`
      : "";

    // 4. Generate rewritten post
    const prompt = `You are an expert LinkedIn copywriter.
    
    You need to rewrite a LinkedIn post according to the user's instructions.
    
    ${brandContext}
    
    ORIGINAL POST DETAILS:
    - Title: ${post.title || "Untitled"}
    - Hook: ${post.hook}
    - Content: ${post.content}
    - CTA: ${post.cta}
    - Hashtags: ${post.hashtags?.join(" ") || "None"}
    
    REWRITE INSTRUCTIONS:
    "${instructions}"
    
    TASK:
    Rewrite the post based on the instructions. Maintain the core message but adjust tone, layout, length, or CTAs as instructed. Ensure it is aligned with the Brand Brain voice (if provided).
    
    Return the rewritten post object.`;

    console.log(`[Rewrite Post] Rewriting post ${postId} for user ${userId}`);
    const { object: rewritten } = await generateObject({
      model: nvidia.chat("meta/llama-3.1-70b-instruct"),
      schema: z.object({
        title: z.string().describe("A short title for this post"),
        hook: z.string().describe("Sleek scroll-stopping hook"),
        content: z.string().describe("Main body content. strategic spacing and line breaks"),
        cta: z.string().describe("Call to Action line"),
        hashtags: z.array(z.string()).describe("3-5 hashtags"),
      }),
      prompt,
    });

    // 5. Update Firestore
    const updatedPost = await updateGeneratedPost(postId, userId, {
      title: rewritten.title,
      hook: rewritten.hook,
      content: rewritten.content,
      cta: rewritten.cta,
      hashtags: rewritten.hashtags,
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error: any) {
    console.error("Post rewrite error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rewrite post." },
      { status: 500 }
    );
  }
}
