"use client";

import { useState } from "react";
import { X, Link2, ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  currentUrl?: string | null;
}

type PreviewState = "idle" | "loading" | "success" | "error";

export function ImageUrlModal({
  isOpen,
  onClose,
  onSave,
  currentUrl,
}: ImageUrlModalProps) {
  const [url, setUrl] = useState(currentUrl || "");
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreview = () => {
    if (!url.trim()) return;
    setPreviewState("loading");
    setPreviewSrc(null);

    const img = new Image();
    img.onload = () => {
      setPreviewState("success");
      setPreviewSrc(url.trim());
    };
    img.onerror = () => {
      setPreviewState("error");
    };
    img.src = url.trim();
  };

  const handleSave = () => {
    if (!url.trim()) return;
    onSave(url.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePreview();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-background border border-border/80 rounded-2xl shadow-premium animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Replace Image
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste any public image URL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="image-url" className="text-sm font-medium">
              Image URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPreviewState("idle");
                  setPreviewSrc(null);
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!url.trim()}
                className="shrink-0"
              >
                Preview
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use any publicly accessible image URL (JPEG, PNG, WebP)
            </p>
          </div>

          {/* Preview Area */}
          <div className="min-h-[160px] rounded-xl border-2 border-dashed border-border bg-muted/20 overflow-hidden flex items-center justify-center transition-all duration-200">
            {previewState === "idle" && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-6 text-center">
                <ImageIcon className="h-8 w-8 opacity-30" />
                <p className="text-xs">Paste a URL and click Preview</p>
              </div>
            )}
            {previewState === "loading" && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-6">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-xs">Loading preview...</p>
              </div>
            )}
            {previewState === "success" && previewSrc && (
              <div className="relative w-full">
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="w-full max-h-[220px] object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-500/90 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                  <CheckCircle2 className="h-3 w-3" />
                  Looks good!
                </div>
              </div>
            )}
            {previewState === "error" && (
              <div className="flex flex-col items-center gap-2 text-destructive p-6 text-center">
                <AlertCircle className="h-6 w-6" />
                <p className="text-xs font-medium">
                  Could not load image from this URL
                </p>
                <p className="text-xs text-muted-foreground">
                  Make sure the URL points directly to an image file
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!url.trim() || previewState === "error"}
          >
            Use This Image
          </Button>
        </div>
      </div>
    </div>
  );
}
