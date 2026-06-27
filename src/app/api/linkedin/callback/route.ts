import { NextResponse } from "next/server";
import { updateUserPreferences } from "@/lib/db/preferences";
import { saveBrandBrain } from "@/lib/db/brand-brain";

export async function GET(req: Request) {
  try {
    console.log("\n=====================================");
    console.log("[LinkedIn Callback] Callback received");
    console.log("[LinkedIn Callback] Request URL:", req.url);
    console.log("[LinkedIn Callback] Request method:", req.method);
    const { searchParams } = new URL(req.url);
    console.log("[LinkedIn Callback] All searchParams:");
    for (const [key, value] of searchParams.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const mockRedirect = searchParams.get("redirect");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("[LinkedIn Callback] Code present:", !!code);
    console.log("[LinkedIn Callback] Code value:", code);
    console.log("[LinkedIn Callback] State present:", !!state);
    console.log("[LinkedIn Callback] State value:", state);
    console.log("[LinkedIn Callback] Mock redirect present:", !!mockRedirect);
    console.log("[LinkedIn Callback] Mock redirect value:", mockRedirect);
    console.log("[LinkedIn Callback] Error present:", !!error);
    console.log("[LinkedIn Callback] Error value:", error);
    console.log("[LinkedIn Callback] Error description:", errorDescription);

    // Handle LinkedIn errors
    if (error) {
      console.error("[LinkedIn Callback] LinkedIn returned an error:", error, errorDescription);
      // Redirect back to settings or onboarding with error message
      let redirectPath = "/app/settings";
      if (state) {
        if (state.includes(":")) {
          const parts = state.split(":");
          redirectPath = parts[1] || "/app/settings";
        } else {
          redirectPath = mockRedirect || "/app/settings";
        }
      }
      const redirectUrl = new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
      redirectUrl.searchParams.set("linkedin_error", error);
      if (errorDescription) {
        redirectUrl.searchParams.set("linkedin_error_description", errorDescription);
      }
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (!code || !state) {
      console.error("[LinkedIn Callback] Missing code or state parameters");
      console.error("[LinkedIn Callback] Code:", code);
      console.error("[LinkedIn Callback] State:", state);
      console.error("[LinkedIn Callback] Full URL searchParams object:", searchParams.toString());
      let redirectPath = "/app/settings";
      if (state) {
        if (state.includes(":")) {
          const parts = state.split(":");
          redirectPath = parts[1] || "/app/settings";
        } else {
          redirectPath = mockRedirect || "/app/settings";
        }
      }
      const redirectUrl = new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
      redirectUrl.searchParams.set("linkedin_error", "missing_params");
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Parse state: contains "userId:redirectPath" in real OAuth, or just "userId" in some cases
    let userId = state;
    let redirectPath = mockRedirect || "/app/settings";

    if (state.includes(":")) {
      const parts = state.split(":");
      userId = parts[0];
      redirectPath = parts[1] || redirectPath;
    }
    console.log("[LinkedIn Callback] Parsed userId:", userId);
    console.log("[LinkedIn Callback] Parsed redirectPath:", redirectPath);
    // Validate redirectPath: only accept relative paths starting with /
    if (!redirectPath.startsWith("/")) {
      redirectPath = "/app/settings";
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    const isMock = code.startsWith("mock_") || !clientId || clientId.trim() === "" || !clientSecret || clientSecret.trim() === "";

    if (isMock) {
      console.log(`[LinkedIn Callback] Executing Mock Connect for user: ${userId}`);
      
      const mockToken = "mock_access_token_kh_" + Math.random().toString(36).substring(2, 10);
      const mockUrn = "urn:li:person:mock_user_yousuf";
      const mockName = "Jane Doe (Mock)";
      const mockEmail = "jane.doe@example.com";
      const mockPic = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80";

      // Save credentials to preferences and brand_brain in parallel
      await Promise.all([
        updateUserPreferences(userId, {
          linkedin_access_token: mockToken,
          linkedin_person_urn: mockUrn,
          linkedin_name: mockName,
          linkedin_connected: true,
        }),
        saveBrandBrain(userId, {
          name: mockName,
          email: mockEmail,
          profile_picture: mockPic,
          linkedin_urn: mockUrn,
          connection_status: "connected",
        }),
      ]);

      // Redirect back
      const targetUrl = new URL(redirectPath, req.url);
      targetUrl.searchParams.set("linkedin_success", "true");
      return NextResponse.redirect(targetUrl.toString());
    }

    console.log(`[LinkedIn Callback] Exchanging code for user: ${userId}`);

    // Exchange code for token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri!,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`[LinkedIn Callback] Token exchange failed: ${errorText}`);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;

    // Fetch user profile from OIDC UserInfo endpoint
    console.log("[LinkedIn Callback] Fetching UserInfo profile details");
    let sub: string | null = null;
    let fullName = "LinkedIn User";
    let email: string | null = null;
    let picture: string | null = null;
    
    try {
      const userinfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (userinfoResponse.ok) {
        const profileData = await userinfoResponse.json();
        console.log("[LinkedIn Callback] UserInfo data:", profileData);
        sub = profileData.sub; // URN ID string
        
        // Extract name
        const givenName = profileData.given_name || "";
        const familyName = profileData.family_name || "";
        fullName = `${givenName} ${familyName}`.trim() || profileData.name || "LinkedIn User";
        
        email = profileData.email || null;
        picture = profileData.picture || null;
      }
    } catch (profileErr) {
      console.error("[LinkedIn Callback] Failed to fetch UserInfo:", profileErr);
    }
    
    const urn = sub ? `urn:li:person:${sub}` : `urn:li:person:mock-${Date.now()}`;

    // Save to preferences and brand brain in parallel
    await Promise.all([
      updateUserPreferences(userId, {
        linkedin_access_token: accessToken,
        linkedin_refresh_token: refreshToken,
        linkedin_person_urn: urn,
        linkedin_name: fullName,
        linkedin_connected: true,
      }),
      saveBrandBrain(userId, {
        name: fullName,
        email,
        profile_picture: picture,
        linkedin_urn: urn,
        connection_status: "connected",
      }),
    ]);

    console.log(`[LinkedIn Callback] Connection successful for user ${userId}. Profile: ${fullName}`);

    const targetUrl = new URL(redirectPath, req.url);
    targetUrl.searchParams.set("linkedin_success", "true");
    return NextResponse.redirect(targetUrl.toString());
  } catch (error: any) {
    console.error("LinkedIn OAuth callback error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication callback processing failed." },
      { status: 500 }
    );
  }
}
