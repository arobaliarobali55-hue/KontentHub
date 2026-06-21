import { db } from "@/lib/firebase/server";
import type { Usage } from "@/lib/types";

export async function getUsage(userId: string): Promise<Usage | null> {
  const doc = await db.collection("usage").doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as Usage;
}

export async function ensureUsage(userId: string): Promise<Usage> {
  const existing = await getUsage(userId);
  if (existing) return existing;

  const defaultUsage: Usage = {
    user_id: userId,
    plan: "free",
    week_start: new Date().toISOString(),
    posts_generated: 0,
    remaining_posts: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.collection("usage").doc(userId).set(defaultUsage);
  return defaultUsage;
}

export async function incrementUsage(userId: string): Promise<Usage> {
  const usageRef = db.collection("usage").doc(userId);
  
  const newUsage = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(usageRef);
    let currentUsage: Usage;
    if (!doc.exists) {
      currentUsage = {
        user_id: userId,
        plan: "free",
        week_start: new Date().toISOString(),
        posts_generated: 0,
        remaining_posts: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      transaction.set(usageRef, currentUsage);
    } else {
      currentUsage = doc.data() as Usage;
    }

    const updated = {
      ...currentUsage,
      posts_generated: currentUsage.posts_generated + 1,
      remaining_posts: Math.max(0, currentUsage.remaining_posts - 1),
      updated_at: new Date().toISOString(),
    };

    transaction.update(usageRef, updated);
    return updated;
  });

  return newUsage;
}

export async function resetUsageIfNewWeek(userId: string): Promise<Usage> {
  const usageRef = db.collection("usage").doc(userId);

  const updatedUsage = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(usageRef);
    let currentUsage: Usage;
    if (!doc.exists) {
      currentUsage = {
        user_id: userId,
        plan: "free",
        week_start: new Date().toISOString(),
        posts_generated: 0,
        remaining_posts: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      transaction.set(usageRef, currentUsage);
      return currentUsage;
    } else {
      currentUsage = doc.data() as Usage;
    }

    const weekStart = new Date(currentUsage.week_start);
    const now = new Date();
    const msInWeek = 7 * 24 * 60 * 60 * 1000;

    if (now.getTime() - weekStart.getTime() >= msInWeek) {
      const updated = {
        ...currentUsage,
        week_start: now.toISOString(),
        remaining_posts: currentUsage.plan === "pro" ? 999999 : 4,
        updated_at: now.toISOString(),
      };
      transaction.update(usageRef, updated);
      return updated;
    }

    return currentUsage;
  });

  return updatedUsage;
}

export async function updateUsagePlan(
  userId: string,
  plan: "free" | "pro",
  remainingPosts: number
): Promise<Usage> {
  const usageRef = db.collection("usage").doc(userId);

  const newUsage = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(usageRef);
    let currentUsage: Usage;
    if (!doc.exists) {
      currentUsage = {
        user_id: userId,
        plan: plan,
        week_start: new Date().toISOString(),
        posts_generated: 0,
        remaining_posts: remainingPosts,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      transaction.set(usageRef, currentUsage);
      return currentUsage;
    } else {
      currentUsage = doc.data() as Usage;
    }

    const updated = {
      ...currentUsage,
      plan,
      remaining_posts: remainingPosts,
      updated_at: new Date().toISOString(),
    };

    transaction.update(usageRef, updated);
    return updated;
  });

  return newUsage;
}
