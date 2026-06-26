import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPost, updateGeneratedPost } from "@/lib/db/generated-posts";
import { getUsage } from "@/lib/db/usage";

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
        { error: "Post scheduling is a Pro feature." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { postId, scheduledAt } = body; // scheduledAt is ISO string or null

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    // 2. Fetch post and verify ownership
    const post = await getPost(postId, userId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const now = new Date();

    // 3. Update scheduling metadata
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: "Invalid schedule date/time format." }, { status: 400 });
      }

      if (scheduledDate <= now) {
        return NextResponse.json({ error: "Schedule time must be in the future." }, { status: 400 });
      }

      await updateGeneratedPost(postId, userId, {
        is_scheduled: true,
        scheduled_at: scheduledAt,
      });

      console.log(`[Schedule API] Scheduled post ${postId} for user ${userId} at ${scheduledAt}`);
    } else {
      // Cancel scheduling
      await updateGeneratedPost(postId, userId, {
        is_scheduled: false,
        scheduled_at: null,
      });

      console.log(`[Schedule API] Cancelled scheduling for post ${postId} for user ${userId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Scheduling endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule post." },
      { status: 500 }
    );
  }
}
