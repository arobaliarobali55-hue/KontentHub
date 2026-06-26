import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPreferences, ensureUserPreferences, updateUserPreferences } from "@/lib/db/preferences";
import { getBrandBrain, saveBrandBrain, ensureBrandBrain } from "@/lib/db/brand-brain";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [preferences, brandBrain] = await Promise.all([
      ensureUserPreferences(userId),
      getBrandBrain(userId),
    ]);

    return NextResponse.json({ preferences, brandBrain });
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

    // ─── Case A: Disconnect LinkedIn ─────────────────────────────────
    if (body.disconnectLinkedIn) {
      console.log(`[Settings API] Disconnecting LinkedIn for user: ${userId}`);
      
      const [updatedPrefs, updatedBrain] = await Promise.all([
        updateUserPreferences(userId, {
          linkedin_access_token: null,
          linkedin_refresh_token: null,
          linkedin_person_urn: null,
          linkedin_name: null,
          linkedin_connected: false,
          brand_brain_id: null,
        }),
        saveBrandBrain(userId, {
          linkedin_urn: null,
          connection_status: "disconnected",
        }),
      ]);

      return NextResponse.json({ preferences: updatedPrefs, brandBrain: updatedBrain });
    }

    // ─── Case B: Regular settings update ─────────────────────────────
    console.log(`[Settings API] Updating settings & Brand Brain for user: ${userId}`);
    await Promise.all([
      ensureUserPreferences(userId),
      ensureBrandBrain(userId),
    ]);

    // Update preferences doc
    const updatedPrefs = await updateUserPreferences(userId, {
      headline: body.headline !== undefined ? body.headline : undefined,
      about: (body.bio ?? body.about) !== undefined ? (body.bio ?? body.about) : undefined,
      industry: body.industry !== undefined ? body.industry : undefined,
      skills: body.skills !== undefined ? body.skills : undefined,
      target_audience: (body.audience ?? body.target_audience) !== undefined ? (body.audience ?? body.target_audience) : undefined,
      writing_goal: body.writing_goal !== undefined ? body.writing_goal : undefined,
      writing_tone: body.writing_tone || undefined,
      preferred_post_length: body.preferred_post_length || undefined,
      brand_voice: (body.brand_voice ?? body.personal_story) !== undefined ? (body.brand_voice ?? body.personal_story) : undefined,
      use_emojis: body.use_emojis !== undefined ? body.use_emojis : undefined,
      cta_style: body.cta_style || undefined,
      hashtag_style: body.hashtag_style || undefined,
      onboarding_status: body.onboarding_status !== undefined ? body.onboarding_status : undefined,
      manual_profile: body.manual_profile !== undefined ? body.manual_profile : undefined,
    });

    // Update Brand Brain doc
    const updatedBrain = await saveBrandBrain(userId, {
      headline: body.headline ?? null,
      bio: body.bio ?? body.about ?? null,
      industry: body.industry ?? null,
      skills: body.skills ?? [],
      experience: body.experience ?? [],
      featured: body.featured ?? null,
      recent_posts: body.recent_posts ?? null,
      
      // Synthesized fields
      expertise: body.expertise ?? [],
      writing_tone: body.writing_tone || "professional",
      audience: body.audience ?? body.target_audience ?? null,
      cta_style: body.cta_style || "subtle",
      emoji_style: body.use_emojis ? "few" : "none",
      content_pillars: body.content_pillars ?? [],
      favorite_topics: body.favorite_topics ?? [],
      personal_story: body.brand_voice ?? body.personal_story ?? null,
      recent_activity: body.recent_activity ?? null,
      keywords: body.keywords ?? [],
    });

    return NextResponse.json({ preferences: updatedPrefs, brandBrain: updatedBrain });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
