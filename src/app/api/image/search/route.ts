import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchPexelsImage, buildImageQuery } from "@/lib/pexelsService";
import { updateGeneratedPost, getPost } from "@/lib/db/generated-posts";

/**
 * POST /api/image/search
 * Searches Pexels for a royalty-free image matching the post's topic.
 * Available on both Free and Pro plans.
 *
 * Body: { postId: string, query?: string }
 * Returns: { success: true, imageUrl, photographer, photographerUrl, pexelsUrl }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId, query } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    // Fetch post to build query from its metadata
    const post = await getPost(postId, userId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Build search query from post or use provided query
    const searchQuery =
      query ||
      buildImageQuery(
        post.title || "",
        post.topic || post.hook || "",
        null // industry not stored on post; caller can pass query instead
      );

    const result = await searchPexelsImage(searchQuery);

    if (!result) {
      return NextResponse.json(
        { error: "No images found for this topic. Try a different search term." },
        { status: 404 }
      );
    }

    // Save the image URL to the post record
    await updateGeneratedPost(postId, userId, {
      cover_image_url: result.imageUrl,
      image_model: "pexels",
      image_prompt: searchQuery,
      image_created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      photographer: result.photographer,
      photographerUrl: result.photographerUrl,
      pexelsUrl: result.pexelsUrl,
      alt: result.alt,
    });
  } catch (error: any) {
    console.error("Image search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search for images." },
      { status: 500 }
    );
  }
}
