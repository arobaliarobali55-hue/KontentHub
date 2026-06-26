import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { getUserPreferences } from '@/lib/db/preferences';
import { incrementUsage, resetUsageIfNewWeek } from '@/lib/db/usage';
import { createGeneratedPost } from '@/lib/db/generated-posts';

const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topic, sourceUrl, tone, length, refineOption, previousPost, manualProfile } = body;

    if (!topic && !refineOption) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Check usage and get user preferences in parallel
    const [usage, prefs] = await Promise.all([
      resetUsageIfNewWeek(userId),
      getUserPreferences(userId)
    ]);
    if (usage.remaining_posts <= 0) {
      return NextResponse.json({ error: 'You have reached your weekly limit. Please upgrade to Pro.' }, { status: 403 });
    }

    // If sourceUrl is provided, fetch it
    let sourceContent = '';
    if (sourceUrl) {
      try {
        const jinaResponse = await fetch(`https://r.jina.ai/${sourceUrl}`);
        if (jinaResponse.ok) {
          sourceContent = await jinaResponse.text();
        }
      } catch (e) {
        console.error("Failed to fetch source URL", e);
      }
    }

    let promptContext = `
You are an expert LinkedIn ghostwriter. Your job is to create a viral, authentic, and engaging LinkedIn content package for the user.
Do not use generic AI buzzwords. Sound like a real human professional.
`;

    if (refineOption && previousPost) {
      promptContext += `
REFINEMENT REQUEST:
The user wants to refine a previously generated LinkedIn post.
Refinement Action: ${
        refineOption === 'shorter' 
          ? 'Make the post shorter and more punchy. Keep only the most impactful words.' 
          : refineOption === 'more_professional' 
          ? 'Rewrite the post to be more professional, credible, and polished. Ideal for corporate audiences.' 
          : 'Make the post more engaging. Enhance the hook, use stronger storytelling or rhetorical questions, and create a highly active tone.'
      }

PREVIOUS POST CONTENT:
- Title: ${previousPost.title || 'N/A'}
- Hook: ${previousPost.hook || 'N/A'}
- Content: ${previousPost.content || 'N/A'}
- CTA: ${previousPost.cta || 'N/A'}
- Hashtags: ${previousPost.hashtags?.join(', ') || 'N/A'}

Take the previous post, apply the refinement action, and return the modified version. Keep the tone close to "${tone || prefs?.writing_tone || 'professional'}" except as adjusted by the refinement request.
`;
    } else if (manualProfile) {
      promptContext += `
USER CONTEXT (MANUAL PROFILE):
- Full Name: ${manualProfile.full_name || 'N/A'}
- Profession/Role: ${manualProfile.role || 'N/A'}
- Industry: ${manualProfile.industry || 'N/A'}
- Target Audience: ${manualProfile.target_audience || 'N/A'}
- Interests/Skills: ${manualProfile.interests || 'N/A'}
- Target Tone: ${manualProfile.tone || 'professional'}
- CTA Style: ${manualProfile.cta_style || 'subtle'}
- Use Emojis: Yes, use them tastefully

POST REQUIREMENTS:
- Topic: ${topic}
- Tone: ${tone || manualProfile.tone || 'professional'}
- Length: ${length || 'medium'}
- Source Material: ${sourceContent ? sourceContent.substring(0, 3000) : 'None'}
`;
    } else {
      promptContext += `
USER CONTEXT:
- Headline: ${prefs?.headline || 'N/A'}
- About: ${prefs?.about || 'N/A'}
- Industry: ${prefs?.industry || 'N/A'}
- Skills: ${prefs?.skills?.join(', ') || 'N/A'}
- Target Audience: ${prefs?.target_audience || 'N/A'}
- Brand Voice: ${prefs?.brand_voice || 'N/A'}
- Use Emojis: ${prefs?.use_emojis ? 'Yes, use them tastefully' : 'No emojis'}

POST REQUIREMENTS:
- Topic: ${topic}
- Tone: ${tone || prefs?.writing_tone || 'professional'}
- Length: ${length || prefs?.preferred_post_length || 'medium'}
- Source Material: ${sourceContent ? sourceContent.substring(0, 3000) : 'None'}
`;
    }

    if (usage.plan === "pro") {
      promptContext += `
PREMIUM WRITING MODE ENABLED:
Write this post utilizing top-tier copywriting frameworks (e.g. AIDA or PAS). Avoid any generic corporate speech or AI filler phrases. Use a highly magnetic hook tailored to professional audiences and ensure smooth, natural-sounding transitions.
`;
    }

    promptContext += `
OUTPUT FORMAT:
Generate a JSON object containing the full content package. 
Ensure the "content" field is formatted with appropriate line breaks for readability on LinkedIn.
`;

    const { object } = await generateObject({
      model: nvidia.chat('meta/llama-3.1-70b-instruct'),
      schema: z.object({
        title: z.string().describe("A short internal title for this post"),
        hook: z.string().describe("A catchy first line to stop the scroll"),
        content: z.string().describe("The main body of the LinkedIn post. Break it into short paragraphs."),
        cta: z.string().describe("Call to action at the end to drive engagement"),
        hashtags: z.array(z.string()).describe("3-5 relevant hashtags"),
        engagement_score: z.number().min(1).max(100).describe("Estimated engagement potential score out of 100"),
        best_time_to_post: z.string().describe("Recommended day and time to post this for maximum reach"),
        estimated_reading_time: z.string().describe("E.g., '2 mins'")
      }),
      prompt: promptContext,
    });

    // Save generated post to DB
    const savedPost = await createGeneratedPost({
      user_id: userId,
      title: object.title,
      hook: object.hook,
      content: object.content,
      cta: object.cta,
      hashtags: object.hashtags,
      tone: tone || prefs?.writing_tone || 'professional',
      length: length || prefs?.preferred_post_length || 'medium',
      topic: topic,
      source_url: sourceUrl || null,
      engagement_score: object.engagement_score,
      best_time_to_post: object.best_time_to_post,
      estimated_reading_time: object.estimated_reading_time,
      cover_image_url: null,
      is_favorite: false,
      is_pinned: false,
      is_archived: false,
    });

    // Increment usage
    await incrementUsage(userId);

    return NextResponse.json({ success: true, post: savedPost });
  } catch (error: any) {
    console.error('Error generating content:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
