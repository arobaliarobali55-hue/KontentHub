import { db } from "@/lib/firebase/server";
import type { Usage } from "@/lib/types";
import { FREE_WEEKLY_LIMIT } from "@/lib/constants";

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
    remaining_posts: FREE_WEEKLY_LIMIT,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.collection("usage").doc(userId).set(defaultUsage);
  return defaultUsage;
}

export async function incrementUsage(userId: string): Promise<Usage> {
  const usageRef = db.collection("usage").doc(userId);
  const prefRef = db.collection("user_preferences").doc(userId);
  
  const newUsage = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(usageRef);
    let currentUsage: Usage;
    if (!doc.exists) {
      currentUsage = {
        user_id: userId,
        plan: "free",
        week_start: new Date().toISOString(),
        posts_generated: 0,
        remaining_posts: FREE_WEEKLY_LIMIT,
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
      remaining_posts: currentUsage.plan === "pro" ? 999999 : Math.max(0, currentUsage.remaining_posts - 1),
      updated_at: new Date().toISOString(),
    };

    transaction.update(usageRef, updated);
    transaction.set(prefRef, {
      weekly_usage: updated.posts_generated,
      updated_at: new Date().toISOString(),
    }, { merge: true });

    return updated;
  });

  return newUsage;
}

export async function resetUsageIfNewWeek(userId: string): Promise<Usage> {
  const usageRef = db.collection("usage").doc(userId);
  const prefRef = db.collection("user_preferences").doc(userId);

  const updatedUsage = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(usageRef);
    let currentUsage: Usage;
    if (!doc.exists) {
      currentUsage = {
        user_id: userId,
        plan: "free",
        week_start: new Date().toISOString(),
        posts_generated: 0,
        remaining_posts: FREE_WEEKLY_LIMIT,
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
        posts_generated: 0,
        remaining_posts: currentUsage.plan === "pro" ? 999999 : FREE_WEEKLY_LIMIT,
        updated_at: now.toISOString(),
      };
      transaction.update(usageRef, updated);
      transaction.set(prefRef, {
        weekly_usage: 0,
        updated_at: now.toISOString(),
      }, { merge: true });
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
  const prefRef = db.collection("user_preferences").doc(userId);

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
    transaction.set(prefRef, {
      current_plan: plan,
      updated_at: new Date().toISOString(),
    }, { merge: true });

    return updated;
  });

  return newUsage;
}
