import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPreferences, ensureUserPreferences, updateUserPreferences } from "@/lib/db/preferences";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await ensureUserPreferences(userId);
    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    await ensureUserPreferences(userId);
    const updated = await updateUserPreferences(userId, {
      headline: body.headline || null,
      about: body.about || null,
      industry: body.industry || null,
      skills: body.skills || [],
      target_audience: body.target_audience || null,
      writing_goal: body.writing_goal || null,
      writing_tone: body.writing_tone || "professional",
      preferred_post_length: body.preferred_post_length || "medium",
      brand_voice: body.brand_voice || null,
      use_emojis: body.use_emojis ?? true,
      cta_style: body.cta_style || "subtle",
      hashtag_style: body.hashtag_style || "few",
    });

    return NextResponse.json({ preferences: updated });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
