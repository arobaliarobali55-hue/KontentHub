import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const nvidia = createOpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "Technology";

    const promptContext = `
You are a LinkedIn content strategist. Generate 3 trending, highly-engaging post topic suggestions for the industry category: "${category}".
Each suggestion should have a short catchy title and a detailed description/angle that the user can use as a writing prompt.
Focus on topics that would perform well on LinkedIn right now (professional insights, lessons learned, startup growth, tech trends).
Do not use corporate cliches. Make them authentic.
`;

    const { object } = await generateObject({
      model: nvidia.chat("meta/llama-3.1-70b-instruct"),
      schema: z.object({
        suggestions: z.array(
          z.object({
            title: z.string().describe("Catchy title of the trending post idea"),
            description: z.string().describe("A specific prompt or angle for the user to expand on")
          })
        ).min(3).max(4)
      }),
      prompt: promptContext,
    });

    return NextResponse.json({ success: true, suggestions: object.suggestions });
  } catch (error: any) {
    console.error("Error generating trending topics:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
