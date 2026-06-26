"use client";

import { useState, useRef } from "react";
import {
  Copy,
  Check,
  Edit2,
  X,
  Download,
  Search,
  Link2,
  ImagePlus,
  Trash2,
  Loader2,
  Sparkles,
  Award,
  Clock,
  BookOpen,
  ArrowUpRight,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ImageUrlModal } from "@/components/app/image-url-modal";
import { UpgradeModal } from "@/components/layout/upgrade-modal";
import { LinkedInReminderModal } from "@/components/layout/linkedin-reminder-modal";
import type { GeneratedPost } from "@/lib/types";
import { IMAGE_STYLE_PRESETS, type ImageStylePresetId } from "@/lib/constants";

interface PostCardProps {
  post: GeneratedPost;
  plan: "free" | "pro";
  isLinkedInConnected?: boolean;
  onUpdate?: (updated: Partial<GeneratedPost>) => void;
  showSchedule?: boolean;
  showPublish?: boolean;
  index?: number;
}

function readabilityScore(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  return Math.max(10, Math.min(100, Math.round(120 - 1.8 * (words / sentences))));
}

type ActionState = "idle" | "searching" | "generating" | "uploading" | "saving";

export function PostCard({
  post: initialPost,
  plan,
  isLinkedInConnected = false,
  onUpdate,
  showSchedule = false,
  showPublish = false,
  index = 0,
}: PostCardProps) {
  const [post, setPost] = useState<GeneratedPost>(initialPost);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<GeneratedPost>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<
    "ai_images" | "scheduling" | "publishing" | "general" | "blog_url"
  >("ai_images");

  // Pro feature states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRewritePanel, setShowRewritePanel] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [rewritePreset, setRewritePreset] = useState("");

  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showLinkedInReminder, setShowLinkedInReminder] = useState(false);

  // Styling panel states
  const [showImageStylingPanel, setShowImageStylingPanel] = useState(false);
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStylePresetId>("three_d_render");
  const [customImageStylePrompt, setCustomImageStylePrompt] = useState("");

  const [pexelsAttribution, setPexelsAttribution] = useState<{
    photographer: string;
    url: string;
  } | null>(
    (initialPost as any).pexels_photographer
      ? {
          photographer: (initialPost as any).pexels_photographer,
          url: (initialPost as any).pexels_photographer_url || "https://www.pexels.com",
        }
      : null
  );

  const isBusy = actionState !== "idle";
  const fullPostText = `${post.hook}\n\n${post.content}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`;

  const updatePost = (updates: Partial<GeneratedPost>) => {
    setPost((prev) => ({ ...prev, ...updates }));
    onUpdate?.(updates);
  };

  // ── Copy ──────────────────────────────────────────────────────────────
  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Edit ──────────────────────────────────────────────────────────────
  const startEdit = () => {
    setIsEditing(true);
    setEditForm({
      title: post.title,
      hook: post.hook,
      content: post.content,
      cta: post.cta,
      hashtags: post.hashtags,
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const res = await fetch("/api/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, ...editForm }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updatePost(editForm);
        setIsEditing(false);
        toast.success("Post saved!");
      } else {
        toast.error(data.error || "Failed to save.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  // ── Pexels Image Search ───────────────────────────────────────────────
  const handleSearchImage = async () => {
    setActionState("searching");
    try {
      const res = await fetch("/api/image/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updatePost({ cover_image_url: data.imageUrl });
        setPexelsAttribution({
          photographer: data.photographer,
          url: data.photographerUrl,
        });
        toast.success("Image found!");
      } else {
        toast.error(data.error || "No images found.");
      }
    } catch {
      toast.error("Image search failed.");
    } finally {
      setActionState("idle");
    }
  };

  // ── AI Image Generation (Pro) ─────────────────────────────────────────
  const submitAiImageGeneration = async (style: string, customPrompt: string) => {
    setActionState("generating");
    const t1 = setTimeout(() => setActionState("uploading"), 4500);
    const t2 = setTimeout(() => setActionState("saving"), 7500);
    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          postId: post.id,
          style,
          customStylePrompt: customPrompt
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updatePost({ cover_image_url: data.cover_image_url });
        setPexelsAttribution(null);
        setShowImageStylingPanel(false);
        toast.success("AI image generated with style!");
      } else {
        toast.error(data.error || "Failed to generate image.");
      }
    } catch {
      toast.error("Image generation failed.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setActionState("idle");
    }
  };

  const handleGenerateAiImage = async () => {
    if (plan !== "pro") {
      setUpgradeFeature("ai_images");
      setShowUpgradeModal(true);
      return;
    }
    setShowImageStylingPanel(!showImageStylingPanel);
  };

  // ── Custom Image Upload (Pro) ─────────────────────────────────────────
  const handleUploadImageClick = () => {
    if (plan !== "pro") {
      setUpgradeFeature("ai_images");
      setShowUpgradeModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionState("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("postId", post.id);

      const res = await fetch("/api/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updatePost({ cover_image_url: data.imageUrl });
        setPexelsAttribution(null);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload image.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during upload.");
    } finally {
      setActionState("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Custom Image URL (Free plan replacement) ──────────────────────────
  const handleSaveImageUrl = async (url: string) => {
    try {
      const res = await fetch("/api/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, cover_image_url: url }),
      });
      if (res.ok) {
        updatePost({ cover_image_url: url });
        setPexelsAttribution(null);
        toast.success("Image updated!");
      } else {
        toast.error("Failed to update image.");
      }
    } catch {
      toast.error("Failed to update image.");
    }
  };

  // ── Delete Image ──────────────────────────────────────────────────────
  const handleDeleteImage = async () => {
    try {
      const res = await fetch("/api/image/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) {
        updatePost({ cover_image_url: null });
        setPexelsAttribution(null);
        toast.success("Image removed.");
      } else {
        toast.error("Failed to remove image.");
      }
    } catch {
      toast.error("Failed to remove image.");
    }
  };

  // ── Export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    const element = document.createElement("a");
    const file = new Blob([fullPostText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${post.title.replace(/\s+/g, "_") || "linkedin_post"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Exported as .txt");
  };

  // ── AI Rewrite (Pro) ──────────────────────────────────────────────────
  const handleRewrite = async () => {
    if (plan !== "pro") {
      setUpgradeFeature("general");
      setShowUpgradeModal(true);
      return;
    }

    const instruction = rewriteInstruction || rewritePreset;
    if (!instruction) {
      toast.error("Please select a preset or type custom instructions.");
      return;
    }

    setActionState("generating");
    try {
      const res = await fetch("/api/linkedin/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          instruction,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.post) {
        updatePost({
          title: data.post.title || post.title,
          hook: data.post.hook,
          content: data.post.content,
          cta: data.post.cta,
          hashtags: data.post.hashtags,
        });
        setShowRewritePanel(false);
        setRewritePreset("");
        setRewriteInstruction("");
        toast.success("Post rewritten successfully by AI!");
      } else {
        toast.error(data.error || "Failed to rewrite post.");
      }
    } catch (error) {
      console.error("Rewrite error:", error);
      toast.error("An error occurred during rewrite.");
    } finally {
      setActionState("idle");
    }
  };

  // ── Schedule (Pro) ────────────────────────────────────────────────────
  const handleSchedule = () => {
    if (plan !== "pro") {
      setUpgradeFeature("scheduling");
      setShowUpgradeModal(true);
      return;
    }
    setShowSchedulePanel(!showSchedulePanel);
    setShowRewritePanel(false);
    setShowPublishConfirm(false);
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleDate) {
      toast.error("Please select a date and time.");
      return;
    }

    setActionState("saving");
    try {
      const res = await fetch("/api/linkedin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          scheduledAt: new Date(scheduleDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updatePost({
          scheduled_at: data.scheduledAt,
          is_scheduled: true,
        });
        setShowSchedulePanel(false);
        setScheduleDate("");
        toast.success(`Post scheduled for ${new Date(data.scheduledAt).toLocaleString()}`);
      } else {
        toast.error(data.error || "Failed to schedule post.");
      }
    } catch (error) {
      console.error("Scheduling error:", error);
      toast.error("An error occurred during scheduling.");
    } finally {
      setActionState("idle");
    }
  };

  // ── Publish (Free if connected, Pro if connected) ────────────────────
  const handlePublish = () => {
    if (!isLinkedInConnected) {
      // Show LinkedIn reminder — both Free and Pro need to connect first
      setShowLinkedInReminder(true);
      return;
    }
    setShowPublishConfirm(!showPublishConfirm);
    setShowRewritePanel(false);
    setShowSchedulePanel(false);
  };

  const handlePublishConfirm = async () => {
    setActionState("saving");
    try {
      const res = await fetch("/api/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updatePost({
          is_published: true,
          published_at: new Date().toISOString(),
          linkedin_share_urn: data.shareUrn || data.urn,
        });
        setShowPublishConfirm(false);
        toast.success("Post successfully published to LinkedIn!");
      } else {
        toast.error(data.error || "Failed to publish post.");
      }
    } catch (error) {
      console.error("Publishing error:", error);
      toast.error("An error occurred during publishing.");
    } finally {
      setActionState("idle");
    }
  };

  const readability = readabilityScore(post.content);

  const actionLabel =
    actionState === "searching"
      ? "Searching..."
      : actionState === "generating"
      ? "Generating..."
      : actionState === "uploading"
      ? "Uploading..."
      : actionState === "saving"
      ? "Saving..."
      : null;

  return (
    <>
      <Card className="overflow-hidden border border-primary/15 bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Post index badge */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Post #{index + 1}
          </span>
          <div className="flex items-center gap-2">
            {post.tone && (
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                {post.tone.replace("_", " ")}
              </span>
            )}
            {post.topic && (
              <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {post.topic}
              </span>
            )}
          </div>
        </div>

        {/* Cover Image */}
        {post.cover_image_url ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted border-b border-border group">
            <img
              src={post.cover_image_url}
              alt="Post cover"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Pexels attribution */}
            {pexelsAttribution && (
              <a
                href={pexelsAttribution.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md hover:bg-black/80 transition-colors"
              >
                Photo by {pexelsAttribution.photographer} · Pexels
              </a>
            )}
            {/* Image model badge */}
            {post.image_model === "pexels" && !pexelsAttribution && (
              <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md">
                Pexels
              </span>
            )}
            {post.image_model && post.image_model !== "pexels" && (
              <span className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md font-medium">
                AI Generated
              </span>
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center border-b border-border">
            <div className="text-center text-muted-foreground/40">
              <ImagePlus className="h-8 w-8 mx-auto mb-1" />
              <p className="text-xs">No image</p>
            </div>
          </div>
        )}

        {/* Status badges */}
        {(post.is_published || post.is_scheduled) && (
          <div className="px-5 pt-3.5 flex flex-wrap gap-2">
            {post.is_published && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0077B5]/10 text-[#0077B5] px-2.5 py-1 rounded-md border border-[#0077B5]/20 animate-in fade-in duration-300">
                <Check className="h-3.5 w-3.5 text-[#0077B5]" />
                Published on LinkedIn
              </span>
            )}
            {post.is_scheduled && post.scheduled_at && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-md border border-green-500/20 animate-in fade-in duration-300">
                <Clock className="h-3.5 w-3.5" />
                Scheduled for {new Date(post.scheduled_at).toLocaleString()}
              </span>
            )}
          </div>
        )}

        <CardContent className="p-5 space-y-4">
          {/* Title + Edit controls */}
          <div className="flex items-start justify-between gap-3">
            {isEditing ? (
              <Input
                value={editForm.title || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="font-semibold h-8 flex-1 animate-in fade-in duration-100"
                placeholder="Post title"
              />
            ) : (
              <h3 className="text-sm font-semibold text-foreground leading-tight flex-1">
                {post.title || "Untitled Post"}
              </h3>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-700 h-7 w-7"
                    title="Save changes"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={cancelEdit}
                    className="text-red-500 hover:text-red-600 h-7 w-7"
                    title="Cancel editing"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (plan !== "pro") {
                        setUpgradeFeature("general");
                        setShowUpgradeModal(true);
                        return;
                      }
                      setShowRewritePanel(!showRewritePanel);
                      setShowSchedulePanel(false);
                      setShowPublishConfirm(false);
                    }}
                    className={`h-7 w-7 text-primary hover:bg-primary/10 ${
                      showRewritePanel ? "bg-primary/10" : ""
                    }`}
                    title="AI Rewrite Assistant"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={startEdit}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Edit Post"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* AI Rewrite Panel (Pro) */}
          {showRewritePanel && (
            <div className="p-4 bg-muted/40 rounded-xl border border-primary/15 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">AI Rewrite Assistant</h4>
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-auto">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Choose a preset quick enhancement, or specify custom instructions to transform this post.
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "💥 Punchier Hook", value: "Make the hook punchier, bolder, and more attention-grabbing" },
                  { label: "✨ Add Emojis", value: "Keep the exact same text, but add engaging relevant emojis throughout" },
                  { label: "📋 Listicle Format", value: "Reformat the body into an easy-to-read, spaced bulleted listicle" },
                  { label: "👔 Professional", value: "Rewrite this with a highly professional, expert tone" },
                  { label: "🤝 Action-Oriented", value: "Focus on a powerful call-to-action and direct user benefit" },
                  { label: "📖 Storyteller", value: "Add a touch of vulnerability or personal story style to the body" },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    variant={rewritePreset === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setRewritePreset(preset.value);
                      setRewriteInstruction("");
                    }}
                    className="h-7 text-[10px] justify-start px-2 py-1 truncate"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Or Custom Instruction
                </Label>
                <Input
                  placeholder="e.g. Write in the style of Steve Jobs, make it shorter..."
                  value={rewriteInstruction}
                  onChange={(e) => {
                    setRewriteInstruction(e.target.value);
                    setRewritePreset("");
                  }}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRewritePanel(false);
                    setRewritePreset("");
                    setRewriteInstruction("");
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleRewrite}
                  disabled={isBusy || (!rewritePreset && !rewriteInstruction)}
                  className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {actionState === "generating" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Rewrite Post
                </Button>
              </div>
            </div>
          )}

          {/* Schedule Panel (Pro) */}
          {showSchedulePanel && (
            <div className="p-4 bg-muted/40 rounded-xl border border-primary/15 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">Schedule LinkedIn Post</h4>
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-auto">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Plan ahead. Pick the date and time you want this post to automatically publish on your LinkedIn feed.
              </p>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Date & Time
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="h-9 text-xs"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSchedulePanel(false);
                    setScheduleDate("");
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleScheduleSubmit}
                  disabled={isBusy || !scheduleDate}
                  className="h-7 text-xs gap-1"
                >
                  {actionState === "saving" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  Confirm Schedule
                </Button>
              </div>
            </div>
          )}

          {/* Publish Confirm Panel (Pro) */}
          {showPublishConfirm && (
            <div className="p-4 bg-[#0077B5]/5 rounded-xl border border-[#0077B5]/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-[#0077B5]" />
                <h4 className="text-xs font-bold text-foreground">Direct Publish to LinkedIn</h4>
                <span className="text-[9px] bg-[#0077B5]/15 text-[#0077B5] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-auto">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This will share this post, including its cover image (if present), instantly to your connected LinkedIn profile.
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPublishConfirm(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handlePublishConfirm}
                  disabled={isBusy}
                  className="h-7 text-xs gap-1 bg-[#0077B5] hover:bg-[#005e8f] text-white"
                >
                  {actionState === "saving" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                  Publish Now
                </Button>
              </div>
            </div>
          )}

          {/* Post Content */}
          <div className="space-y-3">
            {/* Hook */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hook
              </Label>
              {isEditing ? (
                <Textarea
                  value={editForm.hook || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, hook: e.target.value })
                  }
                  className="min-h-[48px] text-sm whitespace-pre-wrap"
                />
              ) : (
                <p className="text-sm font-medium text-primary leading-snug whitespace-pre-wrap">
                  {post.hook}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Post Body
              </Label>
              {isEditing ? (
                <Textarea
                  value={editForm.content || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, content: e.target.value })
                  }
                  className="min-h-[100px] text-sm whitespace-pre-wrap"
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">
                  {post.content}
                </p>
              )}
            </div>

            {/* CTA + Hashtags */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CTA
                </Label>
                {isEditing ? (
                  <Input
                    value={editForm.cta || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, cta: e.target.value })
                    }
                    className="text-sm h-8"
                  />
                ) : (
                  <p className="text-xs font-medium text-foreground line-clamp-2">
                    {post.cta}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Hashtags
                </Label>
                {isEditing ? (
                  <Input
                    value={editForm.hashtags?.join(" ") || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        hashtags: e.target.value.split(" ").filter(Boolean),
                      })
                    }
                    className="text-sm h-8 text-primary"
                    placeholder="#tag1 #tag2"
                  />
                ) : (
                  <p className="text-xs text-primary font-medium line-clamp-2">
                    {post.hashtags.join(" ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg border border-border/40 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Award className="h-3 w-3 text-amber-500" />
              </div>
              <div className="text-xs font-bold">{post.engagement_score ?? 0}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Score</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <BookOpen className="h-3 w-3 text-blue-500" />
              </div>
              <div className="text-xs font-bold">{readability}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Read</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Clock className="h-3 w-3 text-orange-500" />
              </div>
              <div className="text-xs font-bold truncate">{post.estimated_reading_time || "1m"}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Time</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <ArrowUpRight className="h-3 w-3 text-purple-500" />
              </div>
              <div className="text-xs font-bold">{fullPostText.length}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Chars</div>
            </div>
          </div>

          {/* Image actions */}
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Image
            </Label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* Search Pexels — always available */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchImage}
                disabled={isBusy}
                className="h-7 text-xs gap-1"
              >
                {actionState === "searching" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
                {actionState === "searching" ? actionLabel : "Find Image"}
              </Button>

              {/* Replace with URL — Free plan */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImageUrlModal(true)}
                disabled={isBusy}
                className="h-7 text-xs gap-1"
              >
                <Link2 className="h-3 w-3" />
                Paste URL
              </Button>

              {/* Upload Image — Pro feature */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadImageClick}
                disabled={isBusy}
                className={`h-7 text-xs gap-1 relative ${
                  plan !== "pro"
                    ? "border-primary/30 text-primary hover:bg-primary/5"
                    : ""
                }`}
                title={plan !== "pro" ? "Upgrade to Pro to unlock this feature." : "Upload custom cover image"}
              >
                {actionState === "uploading" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ImagePlus className="h-3 w-3" />
                )}
                {plan !== "pro" ? "Upload (Pro)" : "Upload Image"}
              </Button>

              {/* AI Generate */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAiImage}
                disabled={isBusy}
                className={`h-7 text-xs gap-1 relative ${
                  plan !== "pro"
                    ? "border-primary/30 text-primary hover:bg-primary/5"
                    : ""
                } ${showImageStylingPanel ? "bg-muted" : ""}`}
                title={plan !== "pro" ? "Upgrade to Pro to unlock this feature." : "Advanced AI image generation & styling"}
              >
                <Sparkles className="h-3 w-3" />
                {plan !== "pro" ? "AI Image (Pro)" : "AI Image Styling"}
              </Button>

              {/* Delete image */}
              {post.cover_image_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteImage}
                  disabled={isBusy}
                  className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/5 ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* AI Image Generation Styling Panel (Pro Only) */}
            {showImageStylingPanel && plan === "pro" && (
              <div className="bg-muted/40 p-4 rounded-xl border border-border/80 space-y-3 mt-3 animate-in slide-in-from-top-2 duration-200 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Advanced AI Image Styling
                  </span>
                  <button
                    onClick={() => setShowImageStylingPanel(false)}
                    className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Select Style Preset
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {IMAGE_STYLE_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        type="button"
                        variant={selectedImageStyle === preset.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedImageStyle(preset.id)}
                        className="h-7 text-[10px] justify-center px-2 py-0.5 rounded-lg border-muted-foreground/20"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="style-instructions" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Additional Style Instructions
                  </Label>
                  <Input
                    id="style-instructions"
                    placeholder="e.g. Blue background with modern office lighting, cinematic shadows"
                    value={customImageStylePrompt}
                    onChange={(e) => setCustomImageStylePrompt(e.target.value)}
                    className="text-xs h-8 bg-background border-border/80 rounded-lg"
                  />
                </div>

                <Button
                  onClick={() => submitAiImageGeneration(selectedImageStyle, customImageStylePrompt)}
                  disabled={isBusy}
                  className="w-full h-8 text-xs gap-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg"
                >
                  {isBusy && actionState === "generating" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {isBusy && actionState === "generating" ? "Generating Image..." : "Generate AI Image Now"}
                </Button>
              </div>
            )}
          </div>

          {/* Primary actions */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            <Button
              variant="default"
              size="sm"
              onClick={() => copyText(fullPostText, "Post")}
              className="h-8 text-xs gap-1.5 flex-1"
            >
              {copiedField === "Post" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedField === "Post" ? "Copied!" : "Copy Post"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>

            {showSchedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSchedule}
                className={`h-8 text-xs gap-1.5 ${
                  plan !== "pro" ? "text-muted-foreground" : ""
                } ${showSchedulePanel ? "bg-muted text-foreground" : ""}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Schedule
                {plan !== "pro" && (
                  <span className="text-[9px] bg-primary/10 text-primary px-1 rounded font-bold">
                    PRO
                  </span>
                )}
              </Button>
            )}

            {showPublish && (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={post.is_published === true}
                className={`h-8 text-xs gap-1.5 ${
                  post.is_published
                    ? "bg-emerald-600/10 text-emerald-600 cursor-default"
                    : isLinkedInConnected
                    ? "bg-[#0077B5] hover:bg-[#005e8f] text-white"
                    : "border border-[#0077B5]/40 text-[#0077B5] hover:bg-[#0077B5]/5 bg-transparent"
                } ${showPublishConfirm ? "opacity-80" : ""}`}
              >
                {post.is_published ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                {post.is_published ? "Published" : isLinkedInConnected ? "Publish" : "Publish (Connect LinkedIn)"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ImageUrlModal
        isOpen={showImageUrlModal}
        onClose={() => setShowImageUrlModal(false)}
        onSave={handleSaveImageUrl}
        currentUrl={post.cover_image_url}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />
      <LinkedInReminderModal
        isOpen={showLinkedInReminder}
        onClose={() => setShowLinkedInReminder(false)}
        mode="publishing"
        postContent={fullPostText}
      />
    </>
  );
}
