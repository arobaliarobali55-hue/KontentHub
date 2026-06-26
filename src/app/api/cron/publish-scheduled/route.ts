import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/server";
import { updateGeneratedPost } from "@/lib/db/generated-posts";
import { getUserPreferences } from "@/lib/db/preferences";
import type { GeneratedPost } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    
    // Optional secret check
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron Publisher] Scanning for scheduled posts...");

    // Query all scheduled posts
    const snapshot = await db
      .collection("generated_posts")
      .where("is_scheduled", "==", true)
      .get();

    if (snapshot.empty) {
      console.log("[Cron Publisher] No scheduled posts found.");
      return NextResponse.json({ success: true, count: 0 });
    }

    const now = new Date();
    const duePosts: GeneratedPost[] = [];

    snapshot.forEach((doc) => {
      const post = doc.data() as GeneratedPost;
      if (post.scheduled_at) {
        const scheduledTime = new Date(post.scheduled_at);
        if (scheduledTime <= now) {
          duePosts.push(post);
        }
      }
    });

    console.log(`[Cron Publisher] Found ${duePosts.length} due posts out of ${snapshot.size} scheduled posts.`);

    const results = [];

    for (const post of duePosts) {
      const postId = post.id;
      const userId = post.user_id;
      
      try {
        console.log(`[Cron Publisher] Processing due post ${postId} for user ${userId}`);
        
        // Fetch user preferences for LinkedIn tokens
        const prefs = await getUserPreferences(userId);
        const accessToken = prefs?.linkedin_access_token;
        const personUrn = prefs?.linkedin_person_urn;

        if (!accessToken || !personUrn) {
          console.warn(`[Cron Publisher] Skipping post ${postId} - user has no connected LinkedIn account`);
          
          // Clear scheduling to prevent infinite loops of failing
          await updateGeneratedPost(postId, userId, {
            is_scheduled: false,
            scheduled_at: null,
          });
          
          results.push({ postId, status: "failed", reason: "LinkedIn not connected" });
          continue;
        }

        const isMock = accessToken.startsWith("mock_access_token");
        const publishTime = new Date().toISOString();

        if (isMock) {
          // Mock publish
          const mockUrn = "urn:li:share:mock_cron_" + Math.random().toString(36).substring(2, 10);
          await updateGeneratedPost(postId, userId, {
            is_published: true,
            is_scheduled: false,
            published_at: publishTime,
            linkedin_share_urn: mockUrn,
          });
          console.log(`[Cron Publisher] Published post ${postId} successfully (Simulated)`);
          results.push({ postId, status: "success", simulated: true, urn: mockUrn });
          continue;
        }

        // Live publish
        console.log(`[Cron Publisher] Publishing live UGC post ${postId}`);
        const shareCommentary = `${post.hook}\n\n${post.content}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`;
        let shareMediaCategory = "NONE";
        let mediaAttachments: any[] = [];

        // Fetch and upload cover image
        if (post.cover_image_url) {
          console.log(`[Cron Publisher] Uploading image: ${post.cover_image_url}`);
          
          // Register upload
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

          if (registerRes.ok) {
            const registerData = await registerRes.json();
            const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadMechanism"].uploadUrl;
            const assetUrn = registerData.value.asset;

            // Fetch image binary
            const imageFetchRes = await fetch(post.cover_image_url);
            if (imageFetchRes.ok) {
              const imageBuffer = await imageFetchRes.arrayBuffer();
              
              // Upload to LinkedIn
              const putRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "image/png",
                },
                body: imageBuffer,
              });

              if (putRes.ok) {
                shareMediaCategory = "IMAGE";
                mediaAttachments = [
                  {
                    status: "READY",
                    description: { text: "Post Image" },
                    media: assetUrn,
                    title: { text: post.title || "Image" },
                  },
                ];
              } else {
                console.error(`[Cron Publisher] Failed to upload image buffer to LinkedIn: ${await putRes.text()}`);
              }
            }
          }
        }

        // Create UGC Post
        const ugcBody: any = {
          author: personUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: shareCommentary },
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
          const errText = await ugcRes.text();
          console.error(`[Cron Publisher] UGC post failed for post ${postId}: ${errText}`);
          results.push({ postId, status: "failed", reason: "UGC post failed: " + errText });
          continue;
        }

        const ugcData = await ugcRes.json();
        const shareUrn = ugcData.id;

        await updateGeneratedPost(postId, userId, {
          is_published: true,
          is_scheduled: false,
          published_at: publishTime,
          linkedin_share_urn: shareUrn,
        });

        console.log(`[Cron Publisher] Published post ${postId} successfully. Share URN: ${shareUrn}`);
        results.push({ postId, status: "success", urn: shareUrn });
      } catch (postError: any) {
        console.error(`[Cron Publisher] Error publishing post ${postId}:`, postError);
        results.push({ postId, status: "error", reason: postError.message || "Unknown error" });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Cron publisher error:", error);
    return NextResponse.json({ error: error.message || "Internal Cron Error" }, { status: 500 });
  }
}
