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
    console.log(`[Settings API] Request body:`, body);
    await Promise.all([
      ensureUserPreferences(userId),
      ensureBrandBrain(userId),
    ]);

    // Update preferences doc - omit undefined values
    const updatePayload: Record<string, any> = {};
    if (body.headline !== undefined) updatePayload.headline = body.headline;
    if (body.bio !== undefined || body.about !== undefined) updatePayload.about = body.bio ?? body.about;
    if (body.industry !== undefined) updatePayload.industry = body.industry;
    if (body.skills !== undefined) updatePayload.skills = body.skills;
    if (body.audience !== undefined || body.target_audience !== undefined) updatePayload.target_audience = body.audience ?? body.target_audience;
    if (body.writing_goal !== undefined) updatePayload.writing_goal = body.writing_goal;
    if (body.writing_tone !== undefined) updatePayload.writing_tone = body.writing_tone;
    if (body.preferred_post_length !== undefined) updatePayload.preferred_post_length = body.preferred_post_length;
    if (body.brand_voice !== undefined || body.personal_story !== undefined) updatePayload.brand_voice = body.brand_voice ?? body.personal_story;
    if (body.use_emojis !== undefined) updatePayload.use_emojis = body.use_emojis;
    if (body.cta_style !== undefined) updatePayload.cta_style = body.cta_style;
    if (body.hashtag_style !== undefined) updatePayload.hashtag_style = body.hashtag_style;
    if (body.onboarding_status !== undefined) updatePayload.onboarding_status = body.onboarding_status;
    if (body.manual_profile !== undefined) updatePayload.manual_profile = body.manual_profile;

    console.log(`[Settings API] Cleaned update payload:`, updatePayload);
    const updatedPrefs = await updateUserPreferences(userId, updatePayload);
    console.log(`[Settings API] Updated preferences:`, updatedPrefs);

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
