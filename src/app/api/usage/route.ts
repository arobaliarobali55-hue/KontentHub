import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUsage, updateUsagePlan } from "@/lib/db/usage";
import { upsertSubscription } from "@/lib/db/subscriptions";
import { DodoPayments } from "dodopayments";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current usage/plan from Firestore
    let usage = await ensureUsage(userId);

    // Get subscription ID from query parameters to run a direct sync
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscription_id");

    if (subscriptionId && usage.plan !== "pro") {
      const apiKey = process.env.DODO_API_KEY;
      const environment = process.env.DODO_ENVIRONMENT || process.env.NEXT_PUBLIC_DODO_ENVIRONMENT || "test_mode";

      if (apiKey) {
        const dodo = new DodoPayments({
          bearerToken: apiKey,
          environment: environment === "live_mode" ? "live_mode" : "test_mode",
        });

        try {
          console.log(`Directly syncing subscription ${subscriptionId} for user ${userId} from Dodo Payments...`);
          const subscription = await dodo.subscriptions.retrieve(subscriptionId);

          if (
            subscription &&
            subscription.status === "active" &&
            subscription.metadata?.user_id === userId
          ) {
            // Update Firestore subscription record
            await upsertSubscription({
              user_id: userId,
              dodo_customer_id: subscription.customer.customer_id,
              subscription_id: subscriptionId,
              status: "active",
              current_period_end: subscription.next_billing_date || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            // Atomically upgrade the user's usage plan to Pro in Firestore
            usage = await updateUsagePlan(userId, "pro", 999999);
            console.log(`Direct sync successful. Upgraded user ${userId} to Pro plan.`);
          } else {
            console.warn(
              `Direct sync aborted: Subscription validation failed. Status: ${subscription?.status}, Metadata User: ${subscription?.metadata?.user_id}`
            );
          }
        } catch (sdkError: any) {
          console.error("Error retrieving subscription in direct sync:", sdkError.message || sdkError);
        }
      } else {
        console.error("Cannot perform direct sync: DODO_API_KEY is not defined.");
      }
    }

    return NextResponse.json({ usage });
  } catch (error: any) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

