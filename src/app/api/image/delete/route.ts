import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPost } from "@/lib/db/generated-posts";
import { updatePostImageMetadata } from "@/lib/imageService";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // 2. Secure ownership check: Verify user owns the post
    const post = await getPost(postId, userId);
    if (!post) {
      return NextResponse.json({ error: "Post not found or access denied." }, { status: 404 });
    }

    // 3. Delete from Cloudinary if public_id exists
    if (post.cloudinary_public_id) {
      await deleteFromCloudinary(post.cloudinary_public_id);
    }

    // 4. Update Firestore post document: set image fields to null
    await updatePostImageMetadata(postId, userId, {
      cover_image_url: null,
      cloudinary_public_id: null,
      image_model: null,
      image_prompt: null,
      image_created_at: null,
      image_width: null,
      image_height: null,
      image_generation_time_ms: null,
      image_version: null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in delete-image API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
