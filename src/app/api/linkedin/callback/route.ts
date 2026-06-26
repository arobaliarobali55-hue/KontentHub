import { NextResponse } from "next/server";
import { updateUserPreferences } from "@/lib/db/preferences";
import { saveBrandBrain } from "@/lib/db/brand-brain";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const mockRedirect = searchParams.get("redirect");

    if (!code || !state) {
      console.error("[LinkedIn Callback] Missing code or state parameters");
      return NextResponse.json({ error: "Missing required auth parameters." }, { status: 400 });
    }

    // Parse state: contains "userId:redirectPath" in real OAuth, or just "userId" in some cases
    let userId = state;
    let redirectPath = mockRedirect || "/app/settings";

    if (state.includes(":")) {
      const parts = state.split(":");
      userId = parts[0];
      redirectPath = parts[1] || redirectPath;
    }
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
    const userinfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      const errorText = await userinfoResponse.text();
      console.error(`[LinkedIn Callback] UserInfo fetch failed: ${errorText}`);
      throw new Error(`UserInfo fetch failed: ${errorText}`);
    }

    const profileData = await userinfoResponse.json();
    const sub = profileData.sub; // URN ID string
    const urn = `urn:li:person:${sub}`;
    
    // Extract name
    const givenName = profileData.given_name || "";
    const familyName = profileData.family_name || "";
    const fullName = `${givenName} ${familyName}`.trim() || profileData.name || "LinkedIn User";
    
    const email = profileData.email || null;
    const picture = profileData.picture || null;

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
