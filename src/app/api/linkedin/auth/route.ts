import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let redirectUrlParam = searchParams.get("redirect") || "/app/settings";
    // Validate redirectUrlParam: only accept relative paths starting with /
    if (!redirectUrlParam.startsWith("/")) {
      redirectUrlParam = "/app/settings";
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    // Check if variables are missing or placeholders
    const isMock = !clientId || clientId.trim() === "" || !redirectUri || redirectUri.trim() === "";

    if (isMock) {
      console.log(`[LinkedIn Auth] Credentials missing. Falling back to Mock OAuth Mode for user: ${userId}`);
      // Simulate OAuth flow by redirecting immediately to callback with mock details
      const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/linkedin/callback`);
      callbackUrl.searchParams.set("code", "mock_code_12345");
      callbackUrl.searchParams.set("state", userId);
      callbackUrl.searchParams.set("redirect", redirectUrlParam);
      return NextResponse.redirect(callbackUrl.toString());
    }

    // Direct to real LinkedIn Auth
    // Scopes needed: openid (OpenID), profile (Lite Profile fields like name/picture), email, w_member_social (publishing posts)
    const scope = encodeURIComponent("openid profile email w_member_social");
    const state = encodeURIComponent(`${userId}:${redirectUrlParam}`);
    
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;

    return NextResponse.redirect(linkedinAuthUrl);
  } catch (error: any) {
    console.error("LinkedIn auth redirect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start LinkedIn authentication." },
      { status: 500 }
    );
  }
}
