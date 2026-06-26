import { db } from "@/lib/firebase/server";
import type { BrandBrain } from "@/lib/types";

export async function getBrandBrain(userId: string): Promise<BrandBrain | null> {
  const doc = await db.collection("brand_brains").doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as BrandBrain;
}

export async function saveBrandBrain(
  userId: string,
  brain: Partial<Omit<BrandBrain, "user_id" | "created_at" | "updated_at">> & {
    name?: string | null;
    email?: string | null;
    profile_picture?: string | null;
    linkedin_urn?: string | null;
    connection_status?: "connected" | "disconnected";
  }
): Promise<BrandBrain> {
  const docRef = db.collection("brand_brains").doc(userId);
  const doc = await docRef.get();
  const now = new Date().toISOString();

  let finalBrain: BrandBrain;

  if (!doc.exists) {
    const defaultBrain: BrandBrain = {
      user_id: userId,
      name: brain.name ?? null,
      email: brain.email ?? null,
      profile_picture: brain.profile_picture ?? null,
      linkedin_urn: brain.linkedin_urn ?? null,
      connection_status: brain.connection_status ?? "disconnected",
      linkedin_url: brain.linkedin_url ?? null,
      headline: brain.headline ?? null,
      bio: brain.bio ?? null,
      industry: brain.industry ?? null,
      skills: brain.skills ?? [],
      experience: brain.experience ?? [],
      featured: brain.featured ?? null,
      recent_posts: brain.recent_posts ?? null,
      expertise: brain.expertise ?? [],
      writing_tone: brain.writing_tone ?? "professional",
      audience: brain.audience ?? null,
      cta_style: brain.cta_style ?? "subtle",
      emoji_style: brain.emoji_style ?? "few",
      content_pillars: brain.content_pillars ?? [],
      favorite_topics: brain.favorite_topics ?? [],
      personal_story: brain.personal_story ?? null,
      recent_activity: brain.recent_activity ?? null,
      keywords: brain.keywords ?? [],
      created_at: now,
      updated_at: now,
    };
    await docRef.set(defaultBrain);
    finalBrain = defaultBrain;
  } else {
    const current = doc.data() as BrandBrain;
    const updated = {
      ...current,
      ...brain,
      updated_at: now,
    };
    await docRef.update(updated);
    finalBrain = updated;
  }

  return finalBrain;
}

export async function ensureBrandBrain(userId: string): Promise<BrandBrain> {
  const existing = await getBrandBrain(userId);
  if (existing) return existing;

  return await saveBrandBrain(userId, {
    connection_status: "disconnected",
  });
}
