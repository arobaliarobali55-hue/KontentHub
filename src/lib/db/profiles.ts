import { db } from "@/lib/firebase/server";
import type { Profile } from "@/lib/types";

async function getProfile(id: string): Promise<Profile | null> {
  const doc = await db.collection("profiles").doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Profile;
}

type ProfileUpsertInput = {
  id: string;
  email: string;
  full_name?: string | null;
};

export async function ensureProfile(input: ProfileUpsertInput): Promise<Profile> {
  const existing = await getProfile(input.id);
  if (existing) return existing;

  const newProfile: Profile = {
    id: input.id,
    email: input.email,
    full_name: input.full_name ?? null,
    linkedin_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.collection("profiles").doc(input.id).set(newProfile);
  return newProfile;
}

type ProfileUpdate = Partial<{
  full_name: string | null;
  linkedin_url: string | null;
}>;

async function updateProfile(id: string, patch: ProfileUpdate): Promise<Profile> {
  const docRef = db.collection("profiles").doc(id);
  const updatedData = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  await docRef.update(updatedData);

  const updatedDoc = await docRef.get();
  if (!updatedDoc.exists) {
    throw new Error("Profile not found after update");
  }
  return updatedDoc.data() as Profile;
}
