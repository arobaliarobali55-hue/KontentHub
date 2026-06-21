import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserPosts } from "@/lib/db/generated-posts";
import { HistoryClient } from "./history-client";

export default async function HistoryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const posts = await getUserPosts(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">History</h1>
        <p className="mt-2 text-muted-foreground">
          All your previously generated LinkedIn posts.
        </p>
      </div>

      <HistoryClient posts={posts} />
    </div>
  );
}
