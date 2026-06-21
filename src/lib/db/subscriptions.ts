import { db } from "@/lib/firebase/server";
import type { Subscription } from "@/lib/types";

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const doc = await db.collection("subscriptions").doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as Subscription;
}

export async function upsertSubscription(subscription: Subscription): Promise<Subscription> {
  const docRef = db.collection("subscriptions").doc(subscription.user_id);
  const updatedData = {
    ...subscription,
    updated_at: new Date().toISOString(),
  };
  await docRef.set(updatedData, { merge: true });

  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error("Subscription not found after upsert");
  }
  return doc.data() as Subscription;
}
