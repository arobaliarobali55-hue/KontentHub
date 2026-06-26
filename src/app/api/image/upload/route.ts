import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPost } from "@/lib/db/generated-posts";
import { getUsage } from "@/lib/db/usage";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { updatePostImageMetadata } from "@/lib/imageService";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Verify Pro Plan
    const usage = await getUsage(userId);
    if (!usage || usage.plan !== "pro") {
      return NextResponse.json(
        { error: "Custom image uploads are available only for Pro members." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { postId, fileData } = body; // fileData is base64 data URI

    if (!postId || !fileData) {
      return NextResponse.json(
        { error: "postId and fileData are required" },
        { status: 400 }
      );
    }

    // 2. Ownership check
    const post = await getPost(postId, userId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.log(`[Upload Image API] Uploading image for post ${postId} (user ${userId}) to Cloudinary`);

    // 3. Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(userId, postId, fileData);

    console.log(`[Upload Image API] Cloudinary upload successful. URL: ${uploadResult.secure_url}`);

    // 4. Save metadata in Firestore
    await updatePostImageMetadata(postId, userId, {
      cover_image_url: uploadResult.secure_url,
      cloudinary_public_id: uploadResult.public_id,
      image_model: "custom_upload",
      image_prompt: "Uploaded by user",
      image_width: uploadResult.width,
      image_height: uploadResult.height,
      image_created_at: new Date().toISOString(),
      image_version: uploadResult.version,
    });

    return NextResponse.json({
      success: true,
      cover_image_url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error("Custom image upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}
