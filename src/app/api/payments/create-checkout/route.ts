import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DodoPayments } from "dodopayments";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

    if (!email) {
      return NextResponse.json({ error: "User email address not found." }, { status: 400 });
    }

    const apiKey = process.env.DODO_API_KEY;
    const environment = process.env.DODO_ENVIRONMENT || process.env.NEXT_PUBLIC_DODO_ENVIRONMENT || "test_mode";
    const productId = process.env.DODO_PRO_PRODUCT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!apiKey || !productId || !appUrl) {
      const missing = [];
      if (!apiKey) missing.push("DODO_API_KEY");
      if (!productId) missing.push("DODO_PRO_PRODUCT_ID");
      if (!appUrl) missing.push("NEXT_PUBLIC_APP_URL");
      return NextResponse.json(
        { error: `Billing configuration error. Missing variables: ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment: environment === "live_mode" ? "live_mode" : "test_mode",
    });

    const checkoutSession = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email,
        name: name || undefined,
      },
      return_url: `${appUrl}/app?checkout=success`,
      metadata: {
        user_id: userId,
      },
    });

    if (!checkoutSession || !checkoutSession.checkout_url) {
      return NextResponse.json(
        { error: "Dodo Payments did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.checkout_url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
