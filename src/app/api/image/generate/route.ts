import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPost } from "@/lib/db/generated-posts";
import {
  verifyPlanAndRateLimit,
  generateFluxImage,
  updatePostImageMetadata,
  logImageAnalytic,
} from "@/lib/imageService";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { IMAGE_STYLE_PRESETS } from "@/lib/constants";

// ─── Helpers ───────────────────────────────────────────────────────
function stepError(step: string, error: unknown, status = 500) {
  const message =
    error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`\n❌ [generate-image] FAILED at step: ${step}`);
  console.error(`   Message: ${message}`);
  if (stack) console.error(`   Stack:\n${stack}`);

  return NextResponse.json({ step, error: message }, { status });
}

function log(step: string, detail?: string) {
  const ts = new Date().toISOString();
  console.log(`✅ [generate-image] [${ts}] ${step}${detail ? ` — ${detail}` : ""}`);
}

// ─── Route Handler ─────────────────────────────────────────────────
export async function POST(req: Request) {
  let userId: string | null = null;
  let postId: string | null = null;
  let oldPublicId: string | null = null;

  let generationTimeMs = 0;
  let uploadTimeMs = 0;
  let imageSizeBytes = 0;

  // ── Step 0: Validate environment variables ──────────────────────
  log("env_check", "Validating required environment variables");

  const missing: string[] = [];
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name")
    missing.push("CLOUDINARY_CLOUD_NAME");
  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === "your_api_key")
    missing.push("CLOUDINARY_API_KEY");
  if (!process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET === "your_api_secret")
    missing.push("CLOUDINARY_API_SECRET");
  if (!process.env.NVIDIA_API_KEY) missing.push("NVIDIA_API_KEY");

  if (missing.length > 0) {
    const msg = `Missing or placeholder environment variables: ${missing.join(", ")}. ` +
      `Update .env.local with real credentials and restart the dev server.`;
    console.error(`\n❌ [generate-image] ENV CHECK FAILED: ${msg}`);
    return NextResponse.json({ step: "env_check", error: msg }, { status: 500 });
  }
  log("env_check", "All required env vars present");

  try {
    // ── Step 1: Authenticate user ─────────────────────────────────
    log("auth", "Authenticating user via Clerk");
    const authSession = await auth();
    userId = authSession.userId;
    if (!userId) {
      return stepError("auth", "No userId in session — user is not authenticated", 401);
    }
    log("auth", `Authenticated as userId=${userId}`);

    // ── Step 2: Parse request body ────────────────────────────────
    log("parse_body", "Parsing request JSON");
    const body = await req.json().catch(() => ({}));
    postId = body.postId;
    const style = body.style;
    const customStylePrompt = body.customStylePrompt;

    if (!postId) {
      return stepError("parse_body", "Missing postId in request body", 400);
    }
    log("parse_body", `postId=${postId}, style=${style}, customStylePrompt=${customStylePrompt}`);

    // ── Step 3: Ownership check ───────────────────────────────────
    log("ownership_check", `Fetching post ${postId} for user ${userId}`);
    const post = await getPost(postId, userId);
    if (!post) {
      return stepError("ownership_check", "Post not found or user does not own it", 404);
    }
    oldPublicId = post.cloudinary_public_id || null;
    log("ownership_check", `Post found. Title: "${post.title}". Old cloudinary_public_id: ${oldPublicId || "none"}`);

    // ── Step 4: Pro plan verification & rate limits ────────────────
    log("plan_verification", "Checking Pro plan and rate limits");
    try {
      await verifyPlanAndRateLimit(userId);
    } catch (error: any) {
      console.error("Plan/rate-limit check failed:", error.message);
      if (error.message.includes("Pro users")) {
        return NextResponse.json(
          { step: "plan_verification", error: "AI Cover Images are available only for Pro users." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { step: "plan_verification", error: error.message },
        { status: 429 }
      );
    }
    log("plan_verification", "Pro plan confirmed, rate limits OK");

    // ── Step 5: Cloudinary auth pre-check ─────────────────────────
    log("cloudinary_auth_check", "Testing Cloudinary credentials with a ping upload");
    try {
      // Upload a tiny 1x1 transparent PNG to verify auth works
      const testPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const testResult = await cloudinary.uploader.upload(testPixel, {
        folder: "kontenthub/_healthcheck",
        public_id: "auth_test",
        overwrite: true,
        resource_type: "image",
      });
      log("cloudinary_auth_check", `Auth OK. Test upload returned public_id=${testResult.public_id}`);
      // Clean up test image
      await cloudinary.uploader.destroy(testResult.public_id).catch(() => {});
    } catch (error: any) {
      console.error("\n❌ Cloudinary authentication FAILED. Full error:");
      console.error(error);
      return NextResponse.json(
        {
          step: "cloudinary_auth_check",
          error: `Cloudinary authentication failed: ${error.message}. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local.`,
        },
        { status: 500 }
      );
    }

    // ── Step 6: Generate image via NVIDIA ──────────────────────────
    const stylePreset = IMAGE_STYLE_PRESETS.find((p) => p.id === style);
    let promptSubject = `A professional illustration for a LinkedIn post titled: "${post.title}". Brief details: ${post.hook}`;
    
    if (stylePreset) {
      promptSubject += `. Style preset: ${stylePreset.prompt}`;
    } else if (style) {
      promptSubject += `. Style preset: ${style}`;
    }

    if (customStylePrompt) {
      promptSubject += `. Style details: ${customStylePrompt}`;
    }

    log("nvidia_request", `Calling NVIDIA FLUX API with prompt: "${promptSubject}"`);
    const genStart = Date.now();
    let base64Image: string;
    try {
      base64Image = await generateFluxImage(promptSubject, "1024x576");
      generationTimeMs = Date.now() - genStart;
    } catch (error: any) {
      generationTimeMs = Date.now() - genStart;
      return stepError("nvidia_request", error);
    }
    log("nvidia_response", `NVIDIA returned image in ${generationTimeMs}ms`);

    // ── Step 7: Validate NVIDIA base64 output ─────────────────────
    log("base64_validation", `Validating base64 output (length=${base64Image.length})`);
    if (!base64Image || base64Image.length < 100) {
      return stepError("base64_validation", `NVIDIA returned invalid/empty base64 (length=${base64Image?.length ?? 0})`);
    }
    // Quick check: ensure it looks like base64
    const b64Sample = base64Image.substring(0, 40);
    const isValidSample = /^[A-Za-z0-9+/]/.test(b64Sample);
    if (!isValidSample) {
      return stepError("base64_validation", `NVIDIA output does not look like base64. First 40 chars: ${b64Sample}`);
    }
    log("base64_validation", `Base64 looks valid. Length: ${base64Image.length} chars (~${Math.round((base64Image.length * 3) / 4 / 1024)}KB)`);

    // ── Step 8: Upload to Cloudinary ──────────────────────────────
    log("cloudinary_upload", `Uploading to Cloudinary folder=kontenthub/users/${userId}/covers, public_id=${postId}`);
    const uplStart = Date.now();
    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary(userId, postId, base64Image);
      uploadTimeMs = Date.now() - uplStart;
      imageSizeBytes = uploadResult.bytes;
    } catch (error: any) {
      uploadTimeMs = Date.now() - uplStart;
      return stepError("cloudinary_upload", error);
    }
    log("cloudinary_upload_complete", `Upload OK in ${uploadTimeMs}ms. public_id=${uploadResult.public_id}, url=${uploadResult.secure_url}, ${uploadResult.width}x${uploadResult.height}, ${uploadResult.bytes} bytes`);

    // ── Step 9: Update Firestore ──────────────────────────────────
    log("firestore_update", `Saving image metadata to Firestore for post ${postId}`);
    const imageCreatedAt = new Date().toISOString();
    try {
      await updatePostImageMetadata(postId, userId, {
        cover_image_url: uploadResult.secure_url,
        cloudinary_public_id: uploadResult.public_id,
        image_model: "black-forest-labs/flux.1-schnell",
        image_prompt: promptSubject,
        image_width: uploadResult.width,
        image_height: uploadResult.height,
        image_created_at: imageCreatedAt,
        image_generation_time_ms: generationTimeMs,
        image_version: uploadResult.version,
      });
    } catch (dbError: any) {
      console.error("Firestore update failed — rolling back Cloudinary upload...");
      try {
        await deleteFromCloudinary(uploadResult.public_id);
        log("firestore_rollback", "Cloudinary rollback delete succeeded");
      } catch (cleanupError) {
        console.error("Cloudinary rollback ALSO failed:", cleanupError);
      }
      return stepError("firestore_update", dbError);
    }
    log("firestore_update_complete", "Firestore metadata saved successfully");

    // ── Step 10: Cleanup old image if regenerating ────────────────
    if (oldPublicId && oldPublicId !== uploadResult.public_id) {
      log("cleanup_old_image", `Deleting replaced image ${oldPublicId}`);
      try {
        await deleteFromCloudinary(oldPublicId);
        log("cleanup_old_image", "Old image deleted");
      } catch (cleanupError) {
        console.warn("Non-critical: failed to delete old Cloudinary image:", cleanupError);
      }
    }

    // ── Step 11: Log analytics ────────────────────────────────────
    log("analytics", "Logging success analytics");
    await logImageAnalytic({
      userId,
      postId,
      status: "success",
      generationTimeMs,
      uploadTimeMs,
      imageSizeBytes,
    });

    // ── Step 12: Return success ───────────────────────────────────
    log("response", `Returning success. cover_image_url=${uploadResult.secure_url}`);
    return NextResponse.json({
      success: true,
      cover_image_url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error("\n❌ [generate-image] UNHANDLED ERROR:");
    console.error(error);
    if (error.stack) console.error(error.stack);

    // Log failure analytics
    if (userId && postId) {
      await logImageAnalytic({
        userId,
        postId,
        status: "failed",
        generationTimeMs: generationTimeMs || undefined,
        uploadTimeMs: uploadTimeMs || undefined,
        imageSizeBytes: imageSizeBytes || undefined,
        errorMessage: error.message || "Unknown error",
      }).catch(() => {});
    }

    return NextResponse.json(
      { step: "unknown", error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
