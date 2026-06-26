"use client";

import { useState } from "react";
import { X, Loader2, Link2, Copy, Check, Zap, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ReminderMode = "generation" | "publishing";

interface LinkedInReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ReminderMode;
  onContinueManual?: () => void; // Used in generation mode
  postContent?: string; // Used in publishing mode
}

export function LinkedInReminderModal({
  isOpen,
  onClose,
  mode,
  onContinueManual,
  postContent,
}: LinkedInReminderModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleConnect = () => {
    setIsConnecting(true);
    // Redirect to LinkedIn OAuth
    window.location.href = `/api/linkedin/auth?redirect=${window.location.pathname}`;
  };

  const handleCopy = () => {
    if (!postContent) return;
    navigator.clipboard.writeText(postContent);
    setIsCopied(true);
    toast.success("Post copied to clipboard!");
    setTimeout(() => {
      setIsCopied(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background border border-border/80 rounded-2xl shadow-premium animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0077B5]/20 via-[#0077B5]/5 to-transparent px-6 pt-8 pb-6 text-center border-b border-border">
          <div className="inline-flex items-center justify-center p-3 bg-[#0077B5]/10 rounded-2xl text-[#0077B5] mb-4 ring-1 ring-[#0077B5]/20">
            <Link2 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            {mode === "generation" ? "Connect Your LinkedIn Profile" : "LinkedIn Connection Required"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
            {mode === "generation"
              ? "Connecting your LinkedIn profile lets us analyze your experience and writing style to generate highly tailored content in your exact voice."
              : "To publish posts directly from KontentHub with a single click, you need to connect your LinkedIn account first."}
          </p>
        </div>

        {/* Action Description */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-muted/40 p-4 border border-border/60 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Why connect LinkedIn?</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Automatic Brand Brain personalization</li>
              <li>One-click direct publishing to LinkedIn</li>
              <li>Scheduling and automated queues (Pro)</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 px-6 pb-6">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-[#0077B5] hover:bg-[#005e8f] text-white py-5 rounded-xl gap-2 shadow-sm"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 fill-white text-white" />
            )}
            Connect LinkedIn Account
            <ArrowRight className="h-4 w-4" />
          </Button>

          {mode === "generation" ? (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onContinueManual?.();
              }}
              disabled={isConnecting}
              className="w-full py-5 border-border/80 rounded-xl gap-1.5"
            >
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              Continue with Manual Profile (Limited features)
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={isConnecting}
              className="w-full py-5 border-border/80 rounded-xl gap-1.5"
            >
              {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {isCopied ? "Copied!" : "Copy Post Content Manually"}
            </Button>
          )}

          <button
            onClick={onClose}
            disabled={isConnecting}
            className="text-2xs text-muted-foreground/80 hover:text-foreground transition-colors text-center mt-1"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
