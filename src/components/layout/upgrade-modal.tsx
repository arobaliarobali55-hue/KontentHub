"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, Check, Calendar, Globe, Zap, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FeatureVariant =
  | "ai_images"
  | "general"
  | "scheduling"
  | "publishing"
  | "blog_url";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  feature?: FeatureVariant;
};

const FEATURE_CONFIG: Record<
  FeatureVariant,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    highlights: string[];
  }
> = {
  ai_images: {
    icon: <ImageIcon className="h-6 w-6" />,
    title: "Unlock AI Cover Images",
    description:
      "Generate stunning LinkedIn cover images powered by NVIDIA FLUX AI — perfectly matched to every post.",
    highlights: [
      "AI-generated images for every post",
      "Pexels internet image search",
      "Upload your own custom images",
      "One-click image regeneration",
    ],
  },
  scheduling: {
    icon: <Calendar className="h-6 w-6" />,
    title: "Unlock Post Scheduling",
    description:
      "Plan your content calendar and publish automatically at the best times for maximum reach.",
    highlights: [
      "Schedule posts to any date & time",
      "Auto-publish to LinkedIn",
      "Content calendar view",
      "Best-time recommendations",
    ],
  },
  publishing: {
    icon: <Zap className="h-6 w-6" />,
    title: "Unlock One-Click Publishing",
    description:
      "Publish directly to LinkedIn from KontentHub with a single click — no copy-pasting required.",
    highlights: [
      "Direct LinkedIn publishing",
      "Attach images automatically",
      "Publish now or schedule later",
      "Published post tracking",
    ],
  },
  blog_url: {
    icon: <Globe className="h-6 w-6" />,
    title: "Unlock Blog → Post Workflow",
    description:
      "Paste any blog URL and KontentHub reads the article, then generates 3 ready-to-publish LinkedIn posts from it.",
    highlights: [
      "Paste any article or blog URL",
      "AI reads & understands the content",
      "3 post variations generated",
      "Matching images auto-selected",
    ],
  },
  general: {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Upgrade to Pro",
    description:
      "Unlock the full KontentHub experience: unlimited posts, AI images, scheduling, and direct LinkedIn publishing.",
    highlights: [
      "Unlimited content generation",
      "AI cover images (NVIDIA FLUX)",
      "Post scheduling & auto-publish",
      "Blog URL → Post workflow",
    ],
  },
};

export function UpgradeModal({
  isOpen,
  onClose,
  feature = "general",
}: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

  const config = FEATURE_CONFIG[feature];

  const handleUpgrade = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);

    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to create checkout session.");
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("An error occurred. Please try again.");
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background border border-border/80 rounded-2xl shadow-premium animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Pro badge header */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-t-2xl px-6 pt-8 pb-6 text-center border-b border-border">
          <div className="inline-flex items-center justify-center p-3 bg-primary/15 rounded-2xl text-primary mb-4 ring-1 ring-primary/20">
            {config.icon}
          </div>
          <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mb-3">
            <Sparkles className="h-3 w-3" />
            PRO FEATURE
          </div>
          <h3 className="text-xl font-bold text-foreground">{config.title}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
            {config.description}
          </p>
        </div>

        {/* Feature highlights */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            What you get with Pro
          </p>
          <ul className="space-y-2.5">
            {config.highlights.map((highlight, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                {highlight}
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="mt-5 flex items-baseline gap-1.5 bg-muted/40 rounded-xl px-4 py-3 border border-border/60">
            <span className="text-2xl font-bold text-foreground">$1.99</span>
            <span className="text-sm text-muted-foreground">/month</span>
            <span className="ml-auto text-xs text-muted-foreground">Cancel anytime</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpgrading}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="flex-1"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
