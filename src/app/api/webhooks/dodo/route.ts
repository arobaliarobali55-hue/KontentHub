import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { upsertSubscription, getSubscription } from "@/lib/db/subscriptions";
import { updateUsagePlan } from "@/lib/db/usage";

export async function POST(req: Request) {
  try {
    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (!secret) {
      console.error("Dodo webhook config error: Missing DODO_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Webhook configuration error." }, { status: 500 });
    }

    const payload = await req.text();
    const id = req.headers.get("webhook-id");
    const timestamp = req.headers.get("webhook-timestamp");
    const signature = req.headers.get("webhook-signature");

    if (!id || !timestamp || !signature) {
      console.error("Missing Dodo webhook signature headers");
      return NextResponse.json({ error: "Missing required webhook headers." }, { status: 400 });
    }

    try {
      const wh = new Webhook(secret);
      wh.verify(payload, {
        "svix-id": id,
        "svix-timestamp": timestamp,
        "svix-signature": signature,
      });
    } catch (err: any) {
      console.error("Dodo webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const event = JSON.parse(payload);
    const eventType = event.type || event.event_type;
    console.log(`Dodo webhook received event: ${eventType}`);

    if (eventType === "subscription.active" || eventType === "subscription.created") {
      const customerId = event.data?.customer?.customer_id || event.data?.customer_id;
      const subscriptionId = event.data?.subscription_id;
      const userId = event.data?.metadata?.user_id;

      if (!customerId) {
        return NextResponse.json({ error: "No customer ID in payload" }, { status: 400 });
      }

      if (!userId) {
        console.error("No user_id in webhook metadata");
        return NextResponse.json({ error: "No user_id in metadata" }, { status: 400 });
      }

      // Upsert subscription record
      await upsertSubscription({
        user_id: userId,
        dodo_customer_id: customerId,
        subscription_id: subscriptionId || null,
        status: "active",
        current_period_end: event.data?.next_billing_date || event.data?.current_period_end || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Upgrade the user's plan to Pro
      await updateUsagePlan(userId, "pro", 999999);

      console.log(`Upgraded user ${userId} to Pro plan in Firestore`);
    }

    if (eventType === "subscription.cancelled" || eventType === "subscription.expired") {
      const userId = event.data?.metadata?.user_id;

      if (userId) {
        const existing = await getSubscription(userId);
        await upsertSubscription({
          user_id: userId,
          dodo_customer_id: existing?.dodo_customer_id ?? null,
          subscription_id: existing?.subscription_id ?? null,
          status: "cancelled",
          current_period_end: existing?.current_period_end ?? null,
          created_at: existing?.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Downgrade the user's plan to Free, reset credits to standard limit
        await updateUsagePlan(userId, "free", 4);
        console.log(`Downgraded user ${userId} to Free plan in Firestore`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Dodo webhook handler error:", error);
    return NextResponse.json({ error: error.message || "Internal Webhook Error" }, { status: 500 });
  }
}
