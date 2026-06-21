import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { ensureUserPreferences, updateUserPreferences } from '@/lib/db/preferences';

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

    const { linkedinUrl } = await req.json();

    if (!linkedinUrl) {
      return NextResponse.json({ error: 'LinkedIn URL is required' }, { status: 400 });
    }

    // Call Jina AI to scrape the profile
    const jinaResponse = await fetch(`https://r.jina.ai/${linkedinUrl}`, {
      headers: {
        'Authorization': `Bearer ${process.env.JINA_API_KEY || ''}`,
      }
    });

    if (!jinaResponse.ok) {
      console.error("Jina failed to fetch", await jinaResponse.text());
      return NextResponse.json({ error: 'Failed to scrape LinkedIn profile. They might be blocking the request.' }, { status: 400 });
    }

    const scrapedText = await jinaResponse.text();

    // Use NVIDIA LLM to parse the scraped text into our schema
    const { object } = await generateObject({
      model: nvidia.chat('meta/llama-3.1-70b-instruct'),
      schema: z.object({
        headline: z.string().nullable().describe("The person's professional headline or title"),
        about: z.string().nullable().describe("A summary of their professional background"),
        industry: z.string().nullable().describe("The industry they work in"),
        skills: z.array(z.string()).describe("A list of their professional skills"),
        experience: z.array(z.object({
          title: z.string(),
          company: z.string(),
          duration: z.string().optional(),
          description: z.string().optional()
        })).describe("Their work experience history"),
      }),
      prompt: `Analyze the following scraped LinkedIn profile text and extract the professional details. If a field is not found, leave it empty or null.\n\nProfile Text:\n${scrapedText}`,
    });

    // Save to DB
    await ensureUserPreferences(userId);
    const updatedPreferences = await updateUserPreferences(userId, {
      headline: object.headline,
      about: object.about,
      industry: object.industry,
      skills: object.skills,
      experience: object.experience,
    });

    return NextResponse.json({ success: true, profile: updatedPreferences });
  } catch (error: any) {
    console.error('Error analyzing profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
