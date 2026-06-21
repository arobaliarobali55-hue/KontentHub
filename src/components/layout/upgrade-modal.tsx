"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  feature?: "ai_images" | "general";
};

export function UpgradeModal({ isOpen, onClose, feature = "ai_images" }: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

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

  const title = feature === "ai_images" ? "Unlock AI Cover Images" : "Upgrade to Pro";
  const description =
    feature === "ai_images"
      ? "Upgrade to Pro to generate beautiful LinkedIn cover images powered by AI."
      : "Upgrade to Pro to unlock unlimited posts, AI cover images, premium writing styles, and priority generation.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-premium animate-in zoom-in-95 duration-200 bg-background/90 backdrop-blur-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Content */}
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpgrading}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full sm:w-auto"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Upgrade to Pro"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
