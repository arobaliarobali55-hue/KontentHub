import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUsage } from "@/lib/db/usage";
import { 
  getUserPosts, 
  getUserPostsCountThisWeek, 
  getUserAveragePostLength 
} from "@/lib/db/generated-posts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { PenTool, History, Star, Zap, Layers, Award, BookOpen, Clock } from "lucide-react";
import { TrendingTopicsClient } from "./trending-topics-client";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const usage = await getUsage(userId);
  const posts = await getUserPosts(userId);
  const postsThisWeek = await getUserPostsCountThisWeek(userId);
  const averageLength = await getUserAveragePostLength(userId);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here is your content overview.
        </p>
      </div>

      {/* 2. Overview Section: Current Plan, Weekly Usage, Remaining Credits */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Plan */}
        <Card className="border border-border/80 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            <Star className="h-4 w-4 text-primary fill-primary animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold capitalize text-foreground">
              {usage?.plan === "pro" ? "⭐ Pro Member" : "Free"}
            </div>
            {usage?.plan === "pro" ? (
              <div className="text-xs text-muted-foreground space-y-1.5 pt-1.5 border-t border-border/40 font-medium">
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <span className="text-sm">✓</span> Unlimited Posts
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <span className="text-sm">✓</span> AI Cover Images Enabled
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <span className="text-sm">✓</span> Priority Generation Enabled
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Standard LinkedIn writer
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Usage */}
        <Card className="border border-border/80 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posts This Week</CardTitle>
            <PenTool className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{postsThisWeek} posts</div>
            <p className="text-xs text-muted-foreground mt-1">Generated since Monday</p>
          </CardContent>
        </Card>

        {/* Remaining Credits */}
        <Card className="border border-border/80 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Credits</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {usage?.plan === "pro" ? "Unlimited" : (usage?.remaining_posts ?? 4)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Resets weekly</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Quick Generate */}
      <Card className="border border-border/80 bg-background/50">
        <CardHeader>
          <CardTitle>Quick Generate</CardTitle>
          <CardDescription>Start creating your next viral LinkedIn post right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/app/generate" className={buttonVariants({ size: "lg", className: "w-full md:w-auto" })}>
            <PenTool className="mr-2 h-4 w-4" />
            Create New Post
          </Link>
        </CardContent>
      </Card>

      {/* 4. Recent Posts */}
      <Card className="border border-border/80 bg-background/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>Your latest generated LinkedIn posts.</CardDescription>
          </div>
          <Link href="/app/history" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <History className="mr-2 h-4 w-4" />
            View All History
          </Link>
        </CardHeader>
        <CardContent>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.slice(0, 3).map((post) => {
                const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });
                return (
                  <div key={post.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {post.cover_image_url ? (
                        <div className="relative aspect-[16/9] w-16 overflow-hidden rounded border bg-muted flex-shrink-0">
                          <img
                            src={post.cover_image_url}
                            alt="Cover thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-9 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/20 flex-shrink-0">
                          <span className="text-[10px] text-muted-foreground">No Cover</span>
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">
                            {post.title || "Untitled Post"}
                          </p>
                          <div className="flex gap-1">
                            {post.cover_image_url && (
                              <span className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-medium">
                                AI Cover
                              </span>
                            )}
                            {usage?.plan === "pro" && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                                PRO
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-muted-foreground">
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span className="line-clamp-1">{post.hook}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs font-bold text-primary whitespace-nowrap bg-primary/5 px-2.5 py-1 rounded">
                      Score: {post.engagement_score || 0}/100
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No posts generated yet.</p>
          )}
        </CardContent>
      </Card>

      {/* 5. Trending Topics & AI Suggestions */}
      <TrendingTopicsClient />

      {/* 6. Real Analytics */}
      <Card className="border border-border/80 bg-background/50">
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
          <CardDescription>Real performance metrics of your generated content library.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              <Layers className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Posts</div>
                <div className="text-lg font-bold text-foreground">{posts.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Avg Length</div>
                <div className="text-lg font-bold text-foreground">{averageLength} chars</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Avg Engagement</div>
                <div className="text-lg font-bold text-foreground">
                  {posts.length > 0 
                    ? Math.round(posts.reduce((sum, p) => sum + (p.engagement_score || 0), 0) / posts.length) 
                    : 0}/100
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Active Days</div>
                <div className="text-lg font-bold text-foreground">
                  {new Set(posts.map(p => new Date(p.created_at).toDateString())).size}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
