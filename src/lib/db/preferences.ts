import { db } from "@/lib/firebase/server";
import type { UserPreferences } from "@/lib/types";

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const doc = await db.collection("user_preferences").doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as UserPreferences;
}

export async function ensureUserPreferences(userId: string): Promise<UserPreferences> {
  const existing = await getUserPreferences(userId);
  if (existing) return existing;

  const defaultPreferences: UserPreferences = {
    user_id: userId,
    headline: null,
    about: null,
    industry: null,
    skills: [],
    experience: [],
    target_audience: null,
    writing_goal: null,
    writing_tone: "professional",
    preferred_post_length: "medium",
    brand_voice: null,
    use_emojis: true,
    cta_style: "subtle",
    hashtag_style: "few",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.collection("user_preferences").doc(userId).set(defaultPreferences);
  return defaultPreferences;
}

export type UserPreferencesUpdate = Partial<Omit<UserPreferences, "user_id" | "created_at" | "updated_at">>;

export async function updateUserPreferences(userId: string, patch: UserPreferencesUpdate): Promise<UserPreferences> {
  const docRef = db.collection("user_preferences").doc(userId);
  const updatedData = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  await docRef.update(updatedData);

  const updatedDoc = await docRef.get();
  if (!updatedDoc.exists) {
    throw new Error("User preferences not found after update");
  }
  return updatedDoc.data() as UserPreferences;
}
