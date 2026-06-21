import { auth, currentUser } from "@clerk/nextjs/server";
import type { Profile } from "@/lib/types";
import { ensureProfile } from "@/lib/db/profiles";

/**
 * Server-side auth helpers.
 * Centralizes Clerk access so routes stay consistent and returns the
 * KontentHub profile (creating it on first sight) alongside the Clerk user.
 */

export async function getSession() {
  const session = await auth();
  return session;
}

/**
 * Returns the Clerk user id or null if not authenticated.
 * Use in route handlers / server components behind protected routes.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session.userId;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Returns the current user's KontentHub profile, creating a stub row on first
 * sign-in. Also returns whether onboarding is complete (a linkedin_url or
 * full_name set indicates the user finished onboarding).
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  return ensureProfile({
    id: user.id,
    email,
    full_name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null,
  });
}

/** True if the user has completed onboarding (has a full_name or linkedin_url). */
export function isOnboarded(profile: Profile | null): boolean {
  return Boolean(profile && (profile.linkedin_url || profile.full_name));
}
