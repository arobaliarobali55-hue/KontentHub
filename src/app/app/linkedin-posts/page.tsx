"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PostCard } from "@/components/app/post-card";
import {
  Sparkles,
  RefreshCw,
  ArrowRight,
  Loader2,
  PenTool,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import type { GeneratedPost } from "@/lib/types";

export default function LinkedInPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load usage/plan and settings in parallel
      const [usageRes, settingsRes, historyRes] = await Promise.all([
        fetch("/api/usage"),
        fetch("/api/settings"),
        fetch("/api/history"),
      ]);
      const usageData = await usageRes.json();
      const settingsData = await settingsRes.json();
      const historyData = await historyRes.json();

      if (usageData.usage?.plan) {
        setPlan(usageData.usage.plan);
      }
      if (settingsData.brandBrain) {
        setIsLinkedInConnected(settingsData.brandBrain.connection_status === "connected");
      }
      if (historyData.posts && historyData.posts.length > 0) {
        setPosts(historyData.posts.slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast.error("Failed to load your posts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/linkedin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(data.posts);
        toast.success("3 new posts generated!");
      } else {
        toast.error(data.error || "Failed to regenerate posts.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePostUpdate = (index: number, updates: Partial<GeneratedPost>) => {
    setPosts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  if (isLoading) {
    return (
      <Container className="max-w-5xl py-12">
        <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading your posts...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-5xl py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Generated just for you
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Your LinkedIn Posts
            </h1>
            <p className="text-muted-foreground mt-2 max-w-lg">
              3 personalized posts generated from your Brand Profile, each with a
              unique tone and a matching image from Pexels.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Regenerate All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Plan banner for Free users */}
        {plan === "free" && (
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-violet-500/5 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  You're on the Free plan
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Upgrade to Pro for AI-generated images, post scheduling, and
                  unlimited content generation.
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() =>
                  fetch("/api/payments/create-checkout", { method: "POST" })
                    .then((r) => r.json())
                    .then((d) => d.checkoutUrl && (window.location.href = d.checkoutUrl))
                    .catch(() => toast.error("Failed to start checkout."))
                }
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Upgrade to Pro — $1.99/mo
              </Button>
            </div>
          </div>
        )}

        {/* Posts grid */}
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                plan={plan}
                isLinkedInConnected={isLinkedInConnected}
                index={i}
                showSchedule={true}
                showPublish={true}
                onUpdate={(updates) => handlePostUpdate(i, updates)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <Sparkles className="h-10 w-10 opacity-20" />
            <div>
              <p className="font-medium">No posts yet</p>
              <p className="text-sm mt-1">
                Click "Regenerate All" to generate your personalized posts.
              </p>
            </div>
            <Button onClick={handleRegenerate} disabled={isRegenerating}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Posts
            </Button>
          </div>
        )}

        {/* Bottom nav */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => router.push("/app")}
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Button>
          <Button onClick={() => router.push("/app/generate")} className="gap-2">
            <PenTool className="h-4 w-4" />
            Create More Posts
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Container>
  );
}
