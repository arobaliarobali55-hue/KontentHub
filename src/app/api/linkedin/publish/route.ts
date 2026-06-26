import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPost, updateGeneratedPost } from "@/lib/db/generated-posts";
import { getUserPreferences } from "@/lib/db/preferences";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    // 1. Fetch user LinkedIn credentials — required for Free & Pro
    const prefs = await getUserPreferences(userId);
    const accessToken = prefs?.linkedin_access_token;
    const personUrn = prefs?.linkedin_person_urn;

    if (!accessToken || !personUrn) {
      return NextResponse.json(
        { error: "Please connect your LinkedIn account first to publish posts." },
        { status: 400 }
      );
    }

    // 2. Fetch post
    const post = await getPost(postId, userId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isMock = accessToken.startsWith("mock_access_token");
    const now = new Date().toISOString();

    // ─── Case A: Mock Publishing Mode ─────────────────────────────────
    if (isMock) {
      console.log(`[Publish API] Simulating publish to LinkedIn for post ${postId}`);
      // Wait 1.2s to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const mockUrn = "urn:li:share:mock_share_" + Math.random().toString(36).substring(2, 10);

      await updateGeneratedPost(postId, userId, {
        is_published: true,
        is_scheduled: false,
        published_at: now,
        linkedin_share_urn: mockUrn,
      });

      return NextResponse.json({
        success: true,
        urn: mockUrn,
        simulated: true,
      });
    }

    // ─── Case B: Live Publishing Mode ──────────────────────────────────
    console.log(`[Publish API] Publishing post ${postId} to LinkedIn for user ${userId}`);

    const shareCommentary = `${post.hook}\n\n${post.content}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`;
    let shareMediaCategory = "NONE";
    let mediaAttachments: any[] = [];

    // Check if cover image exists and upload it to LinkedIn
    if (post.cover_image_url) {
      console.log(`[Publish API] Post has cover image. Registering upload: ${post.cover_image_url}`);
      
      // Step 1: Register upload
      const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: personUrn,
            supportedUploadMechanisms: ["SYNCHRONOUS_UPLOAD"],
          },
        }),
      });

      if (!registerRes.ok) {
        const errorText = await registerRes.text();
        console.error(`[Publish API] Register upload failed: ${errorText}`);
        throw new Error(`LinkedIn upload registration failed: ${errorText}`);
      }

      const registerData = await registerRes.json();
      const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadMechanism"].uploadUrl;
      const assetUrn = registerData.value.asset;

      console.log(`[Publish API] Upload registered. Asset URN: ${assetUrn}. Fetching image binary...`);

      // Step 2: Download image binary
      const imageFetchRes = await fetch(post.cover_image_url);
      if (!imageFetchRes.ok) {
        throw new Error(`Failed to fetch cover image binary from Cloudinary URL: ${post.cover_image_url}`);
      }
      const imageBuffer = await imageFetchRes.arrayBuffer();

      console.log(`[Publish API] Image binary fetched (${imageBuffer.byteLength} bytes). PUTing to uploadUrl...`);

      // Step 3: Upload binary to LinkedIn
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "image/png",
        },
        body: imageBuffer,
      });

      if (!putRes.ok) {
        const errorText = await putRes.text();
        console.error(`[Publish API] Binary upload failed: ${errorText}`);
        throw new Error(`LinkedIn image upload failed: ${errorText}`);
      }

      console.log(`[Publish API] Image uploaded successfully. Preparing UGC Share.`);
      shareMediaCategory = "IMAGE";
      mediaAttachments = [
        {
          status: "READY",
          description: {
            text: "Post Image",
          },
          media: assetUrn,
          title: {
            text: post.title || "Image",
          },
        },
      ];
    }

    // Step 4: Create UGC Post
    const ugcBody: any = {
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: shareCommentary,
          },
          shareMediaCategory,
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    if (shareMediaCategory === "IMAGE") {
      ugcBody.specificContent["com.linkedin.ugc.ShareContent"].media = mediaAttachments;
    }

    const ugcRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(ugcBody),
    });

    if (!ugcRes.ok) {
      const errorText = await ugcRes.text();
      console.error(`[Publish API] UGC creation failed: ${errorText}`);
      return NextResponse.json(
        { error: `LinkedIn post creation failed: ${errorText}` },
        { status: ugcRes.status }
      );
    }

    const ugcData = await ugcRes.json();
    const shareUrn = ugcData.id;

    console.log(`[Publish API] UGC post created successfully. Share URN: ${shareUrn}`);

    // Step 5: Update Firestore post record
    await updateGeneratedPost(postId, userId, {
      is_published: true,
      is_scheduled: false,
      published_at: now,
      linkedin_share_urn: shareUrn,
    });

    return NextResponse.json({
      success: true,
      urn: shareUrn,
    });
  } catch (error: any) {
    console.error("Direct publish endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish post to LinkedIn." },
      { status: 500 }
    );
  }
}
