import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getUserPosts,
  deleteGeneratedPost,
  updateGeneratedPost,
  duplicateGeneratedPost,
} from "@/lib/db/generated-posts";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await getUserPosts(userId);
    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const updated = await updateGeneratedPost(id, userId, updates);
    return NextResponse.json({ success: true, post: updated });
  } catch (error: any) {
    console.error("Error updating history post:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    await deleteGeneratedPost(id, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting history post:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    if (action === "duplicate") {
      const duplicated = await duplicateGeneratedPost(id, userId);
      return NextResponse.json({ success: true, post: duplicated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error duplicating history post:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
