import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUsage } from "@/lib/db/usage";
import { 
  getUserPosts, 
  getUserPostsCountThisWeek, 
  getUserAveragePostLength 
} from "@/lib/db/generated-posts";
import { getBrandBrain } from "@/lib/db/brand-brain";
import { ensureUserPreferences } from "@/lib/db/preferences";
import { FREE_WEEKLY_LIMIT } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { 
  PenTool, 
  History, 
  Star, 
  Zap, 
  Layers, 
  Award, 
  BookOpen, 
  Clock, 
  Link2, 
  ArrowRight, 
  Globe, 
  ShieldCheck, 
  RefreshCw 
} from "lucide-react";
import { TrendingTopicsClient } from "./trending-topics-client";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Onboarding redirection check
  const preferences = await ensureUserPreferences(userId);
  if (preferences.onboarding_status === "pending") {
    redirect("/app/onboarding");
  }

  const usage = await getUsage(userId);
  const posts = await getUserPosts(userId);
  const postsThisWeek = await getUserPostsCountThisWeek(userId);
  const averageLength = await getUserAveragePostLength(userId);
  const brandBrain = await getBrandBrain(userId);

  const isLinkedInConnected = preferences.linkedin_connected || brandBrain?.connection_status === "connected";
  const isBrandBrainInitialized = Boolean(preferences.brand_brain_id || (brandBrain && brandBrain.connection_status === "connected" && brandBrain.headline));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. LinkedIn Connection Reminder Banner */}
      {!isLinkedInConnected && (
        <div className="relative overflow-hidden rounded-2xl border border-[#0077B5]/20 bg-gradient-to-r from-[#0077B5]/5 via-[#0077B5]/8 to-violet-500/5 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-[#0077B5]/10 flex items-center justify-center text-[#0077B5] shrink-0 mt-0.5 border border-[#0077B5]/20">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                Connect LinkedIn to unlock personalized content
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Unlock your AI Brand Brain, auto-personalize posts, and enable direct publishing and automated scheduling!
              </p>
            </div>
          </div>
          <Link
            href="/app/onboarding"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0077B5] px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#005e8f] transition-all shrink-0"
          >
            Connect LinkedIn
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 2. Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here is your content overview.
        </p>
      </div>

      {/* 3. Overview Section: Plan, Weekly Usage, LinkedIn, Brand Brain */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {/* Current Plan */}
        <Card className="border border-border/80 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            <Star className="h-4 w-4 text-primary fill-primary animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl font-bold capitalize text-foreground">
              {usage?.plan === "pro" ? "⭐ Pro Member" : "Free Plan"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {usage?.plan === "pro" ? "Full creator suite unlocked" : "Standard writing limits"}
            </p>
          </CardContent>
        </Card>

        {/* Weekly Usage & Remaining */}
        <Card className="border border-border/80 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Usage</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl font-bold text-foreground">
              {postsThisWeek} / {usage?.plan === "pro" ? "Unlimited" : FREE_WEEKLY_LIMIT}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {usage?.plan === "pro" ? "Unlimited remaining" : `${usage?.remaining_posts ?? FREE_WEEKLY_LIMIT} posts left`}
            </p>
          </CardContent>
        </Card>

        {/* LinkedIn Status */}
        <Card className="border border-border/80 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">LinkedIn</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl font-bold text-foreground flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${isLinkedInConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"}`} />
              {isLinkedInConnected ? "Connected" : "Disconnected"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isLinkedInConnected ? "One-click publishing enabled" : "Manual copy posting only"}
            </p>
          </CardContent>
        </Card>

        {/* Brand Brain Status */}
        <Card className="border border-border/80 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Brand Brain</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl font-bold text-foreground flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${isBrandBrainInitialized ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
              {isBrandBrainInitialized ? "Initialized" : "Not Initialized"}
            </div>
            {isBrandBrainInitialized ? (
              <Link 
                href="/app/onboarding" 
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-semibold mt-0.5"
              >
                <RefreshCw className="h-2.5 w-2.5" />
                Refresh Brand Brain
              </Link>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Using manual profile input
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Quick Generate */}
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
