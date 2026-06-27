import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    console.log("\n=====================================");
    console.log("[LinkedIn Auth] Starting OAuth flow");
    console.log("[LinkedIn Auth] Request URL:", req.url);
    
    const authResult = await auth();
    console.log("[LinkedIn Auth] Auth Result:", authResult);
    const userId = authResult.userId;
    console.log("[LinkedIn Auth] User ID:", userId);
    if (!userId) {
      console.error("[LinkedIn Auth] No user ID found - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let redirectUrlParam = searchParams.get("redirect") || "/app/settings";
    console.log("[LinkedIn Auth] Redirect param:", redirectUrlParam);
    // Validate redirectUrlParam: only accept relative paths starting with /
    if (!redirectUrlParam.startsWith("/")) {
      redirectUrlParam = "/app/settings";
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    console.log("[LinkedIn Auth] Client ID:", clientId ? "Present" : "Missing");
    console.log("[LinkedIn Auth] Redirect URI:", redirectUri);

    // Check if variables are missing or placeholders
    const isMock = !clientId || clientId.trim() === "" || !redirectUri || redirectUri.trim() === "";
    console.log("[LinkedIn Auth] Is mock mode:", isMock);

    if (isMock) {
      console.log(`[LinkedIn Auth] Credentials missing. Falling back to Mock OAuth Mode for user: ${userId}`);
      // Simulate OAuth flow by redirecting immediately to callback with mock details
      const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/linkedin/callback`);
      callbackUrl.searchParams.set("code", "mock_code_12345");
      callbackUrl.searchParams.set("state", userId);
      callbackUrl.searchParams.set("redirect", redirectUrlParam);
      console.log("[LinkedIn Auth] Mock callback URL:", callbackUrl.toString());
      return NextResponse.redirect(callbackUrl.toString());
    }

    // Direct to real LinkedIn Auth
    // Use valid LinkedIn scopes: r_liteprofile (basic profile), r_emailaddress (email), w_member_social (publishing posts)
    const scope = encodeURIComponent("r_liteprofile r_emailaddress w_member_social");
    const state = encodeURIComponent(`${userId}:${redirectUrlParam}`);
    
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
    console.log("[LinkedIn Auth] LinkedIn auth URL:", linkedinAuthUrl);

    return NextResponse.redirect(linkedinAuthUrl);
  } catch (error: any) {
    console.error("[LinkedIn Auth] Error:", error);
    console.error("[LinkedIn Auth] Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to start LinkedIn authentication." },
      { status: 500 }
    );
  }
}
