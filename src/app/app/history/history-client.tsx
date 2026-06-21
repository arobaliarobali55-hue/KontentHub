"use client";

import { useState, useMemo, useEffect } from "react";
import type { GeneratedPost } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Search, Star, Pin, Archive, Trash2, Copy, 
  Download, Edit2, Check, X, ArrowUpRight, 
  Clock, Award, BookOpen, Layers, ImagePlus, Loader2, Sparkles
} from "lucide-react";
import { TONES, LENGTHS } from "@/lib/constants";
import { UpgradeModal } from "@/components/layout/upgrade-modal";

type HistoryClientProps = {
  posts: GeneratedPost[];
};

function calculateReadabilityScore(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const avgSentenceLength = words / sentences;
  const score = Math.max(10, Math.min(100, Math.round(120 - 1.8 * avgSentenceLength)));
  return score;
}

export function HistoryClient({ posts: initialPosts }: HistoryClientProps) {
  const [posts, setPosts] = useState<GeneratedPost[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTone, setSelectedTone] = useState<string>("all");
  const [selectedLength, setSelectedLength] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // State for post currently in edit mode
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GeneratedPost>>({});

  const [plan, setPlan] = useState<string>("free");
  const [generatingPostStep, setGeneratingPostStep] = useState<{ id: string; step: "generating" | "uploading" | "saving" } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then((data) => {
        if (data.usage) {
          setPlan(data.usage.plan);
        }
      })
      .catch((err) => console.error("Error loading usage plan:", err));
  }, []);

  const handleGenerateCoverImage = async (postId: string) => {
    if (plan !== "pro") {
      setShowUpgradeModal(true);
      return;
    }
    
    setGeneratingPostStep({ id: postId, step: "generating" });
    const t1 = setTimeout(() => setGeneratingPostStep({ id: postId, step: "uploading" }), 4500);
    const t2 = setTimeout(() => setGeneratingPostStep({ id: postId, step: "saving" }), 7500);

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, cover_image_url: data.cover_image_url } : p));
        toast.success("Cover image created successfully.");
      } else {
        toast.error(data.error || "Failed to generate cover image.");
      }
    } catch (error) {
      toast.error("An error occurred during cover image generation.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setGeneratingPostStep(null);
    }
  };

  const handleDeleteCoverImage = async (postId: string) => {
    try {
      const res = await fetch("/api/image/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, cover_image_url: null } : p));
        toast.success("Cover image deleted.");
      } else {
        toast.error(data.error || "Failed to delete cover image.");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the cover image.");
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      // Get the full resolution URL by removing size transformations
      const downloadUrl = url.replace(/c_fill,w_\d+,h_\d+,?/, "");
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, "_blank");
    }
  };

  // CRUD operation handlers
  const handleToggleFavorite = async (post: GeneratedPost) => {
    try {
      const newStatus = !post.is_favorite;
      const res = await fetch("/api/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, is_favorite: newStatus }),
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_favorite: newStatus } : p));
        toast.success(newStatus ? "Added to Favorites ⭐" : "Removed from Favorites");
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleTogglePin = async (post: GeneratedPost) => {
    try {
      const newStatus = !post.is_pinned;
      const res = await fetch("/api/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, is_pinned: newStatus }),
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_pinned: newStatus } : p));
        toast.success(newStatus ? "Pinned post to top 📌" : "Unpinned post");
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleToggleArchive = async (post: GeneratedPost) => {
    try {
      const newStatus = !post.is_archived;
      const res = await fetch("/api/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, is_archived: newStatus }),
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_archived: newStatus } : p));
        toast.success(newStatus ? "Archived post 📂" : "Restored from Archive");
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      const res = await fetch(`/api/history?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        toast.success("Post deleted permanently.");
      } else {
        toast.error("Failed to delete post.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "duplicate" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(prev => [data.post, ...prev]);
        toast.success("Post duplicated successfully!");
      } else {
        toast.error(data.error || "Failed to duplicate post.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const startEdit = (post: GeneratedPost) => {
    setEditingPostId(post.id);
    setEditForm({
      title: post.title,
      hook: post.hook,
      content: post.content,
      cta: post.cta,
      hashtags: post.hashtags,
    });
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, ...editForm } : p));
        setEditingPostId(null);
        toast.success("Post updated successfully!");
      } else {
        toast.error(data.error || "Failed to save updates.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  // Export as text file
  const handleExportText = (post: GeneratedPost) => {
    const fullText = `${post.title ? `${post.title}\n\n` : ""}${post.hook}\n\n${post.content}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`;
    const element = document.createElement("a");
    const file = new Blob([fullText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${post.title.replace(/\s+/g, "_") || "linkedin_post"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded as .txt file");
  };

  // Granular Copy functions
  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Filter logic
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // Archive state matching
        if (showArchived && !post.is_archived) return false;
        if (!showArchived && post.is_archived) return false;

        // Favorites state matching
        if (showFavoritesOnly && !post.is_favorite) return false;

        // Tone & Length matching
        if (selectedTone !== "all" && post.tone !== selectedTone) return false;
        if (selectedLength !== "all" && post.length !== selectedLength) return false;

        // Search matching
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          return (
            post.title.toLowerCase().includes(query) ||
            post.topic?.toLowerCase().includes(query) ||
            post.hook.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            post.cta.toLowerCase().includes(query) ||
            post.hashtags.some(tag => tag.toLowerCase().includes(query))
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned posts always stay at the top
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        // Then sort by date desc
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [posts, searchQuery, selectedTone, selectedLength, showArchived, showFavoritesOnly]);

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              placeholder="Search posts by keyword, title, topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Tones</option>
              {TONES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <select
              value={selectedLength}
              onChange={(e) => setSelectedLength(e.target.value)}
              className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Lengths</option>
              {LENGTHS.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Show Favorites ⭐
            </label>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              View Archive 📂
            </label>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {filteredPosts.length} of {posts.length} posts
          </div>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center bg-card">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
          <p className="text-muted-foreground font-medium">No posts found matching the filters.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredPosts.map((post) => {
            const isEditing = editingPostId === post.id;
            const fullPostText = `${post.hook}\n\n${post.content}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`;
            const postCharacterCount = fullPostText.length;
            const readability = calculateReadabilityScore(post.content);

             return (
              <Card key={post.id} className={`overflow-hidden border transition-all ${post.is_pinned ? 'border-primary bg-primary/2 shadow-premium' : ''}`}>
                {post.cover_image_url && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border bg-muted">
                    <img
                      src={post.cover_image_url}
                      alt="Cover image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  
                  {/* Top Bar Actions & Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`title-${post.id}`} className="sr-only">Title</Label>
                          <Input
                            id={`title-${post.id}`}
                            value={editForm.title || ""}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="h-8 py-0.5 w-60 font-semibold"
                            placeholder="Post Title"
                          />
                        </div>
                      ) : (
                        <h3 className="text-base font-semibold text-foreground flex items-center gap-1.5">
                          {post.is_pinned && <Pin className="h-3.5 w-3.5 text-primary fill-primary flex-shrink-0" />}
                          {post.title || "Untitled Post"}
                        </h3>
                      )}
                      
                      <div className="flex items-center gap-1.5 ml-2">
                        <Badge variant="outline" className="text-2xs capitalize">{post.tone}</Badge>
                        <Badge variant="outline" className="text-2xs capitalize">{post.length}</Badge>
                        <span className="text-2xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Favorite Button */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleFavorite(post)}
                        className={post.is_favorite ? "text-yellow-500 hover:text-yellow-600 bg-yellow-500/5" : "text-muted-foreground"}
                        title={post.is_favorite ? "Remove Favorite" : "Add Favorite"}
                      >
                        <Star className={`h-4 w-4 ${post.is_favorite ? "fill-current" : ""}`} />
                      </Button>

                      {/* Pin Button */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleTogglePin(post)}
                        className={post.is_pinned ? "text-primary hover:text-primary/90 bg-primary/5" : "text-muted-foreground"}
                        title={post.is_pinned ? "Unpin Post" : "Pin Post"}
                      >
                        <Pin className={`h-4 w-4 ${post.is_pinned ? "fill-current" : ""}`} />
                      </Button>

                      {/* Archive Button */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleArchive(post)}
                        className={post.is_archived ? "text-orange-500 hover:text-orange-600 bg-orange-500/5" : "text-muted-foreground"}
                        title={post.is_archived ? "Restore Post" : "Archive Post"}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>

                      {/* Edit Button Toggle */}
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon-sm" onClick={() => saveEdit(post.id)} className="text-green-600 hover:text-green-700 bg-green-500/5">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={cancelEdit} className="text-red-500 hover:text-red-600 bg-red-500/5">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon-sm" onClick={() => startEdit(post)} className="text-muted-foreground hover:text-foreground">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Duplicate Button */}
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(post.id)} className="text-muted-foreground hover:text-foreground" title="Duplicate">
                        <Layers className="h-4 w-4" />
                      </Button>

                      {/* Delete Button */}
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/5" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ChatGPT-Style Inline Editor / Display */}
                  <div className="space-y-4 pt-1">
                    {/* Hook Section */}
                    <div className="space-y-1">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Hook</span>
                      {isEditing ? (
                        <Textarea
                          value={editForm.hook || ""}
                          onChange={(e) => setEditForm({ ...editForm, hook: e.target.value })}
                          className="min-h-[50px] text-sm"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-primary">{post.hook}</p>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="space-y-1">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Post Body</span>
                      {isEditing ? (
                        <Textarea
                          value={editForm.content || ""}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          className="min-h-[120px] text-sm whitespace-pre-wrap"
                        />
                      ) : (
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
                      )}
                    </div>

                    {/* CTA Section */}
                    <div className="space-y-1">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Call to Action</span>
                      {isEditing ? (
                        <Input
                          value={editForm.cta || ""}
                          onChange={(e) => setEditForm({ ...editForm, cta: e.target.value })}
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-foreground">{post.cta}</p>
                      )}
                    </div>

                    {/* Hashtags Section */}
                    <div className="space-y-1">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</span>
                      {isEditing ? (
                        <Input
                          value={editForm.hashtags?.join(" ") || ""}
                          onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value.split(" ").filter(Boolean) })}
                          className="text-sm text-primary"
                          placeholder="#hashtag1 #hashtag2"
                        />
                      ) : (
                        <p className="text-sm text-primary font-medium">{post.hashtags.join(" ")}</p>
                      )}
                    </div>
                  </div>

                  {/* Multi-Copy and Export Panel */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => copyText(fullPostText, "Full Post")} className="h-8">
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Full Post
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyText(post.hook, "Hook")} className="h-8">
                        Hook
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyText(post.content, "Body")} className="h-8">
                        Body
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyText(post.cta, "CTA")} className="h-8">
                        CTA
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyText(post.hashtags.join(" "), "Hashtags")} className="h-8">
                        # Hashtags
                      </Button>
                    </div>

                    <Button variant="secondary" size="sm" onClick={() => handleExportText(post)} className="h-8">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Export .txt
                    </Button>
                  </div>

                  {/* Cover Image Actions */}
                  <div className="pt-4 border-t space-y-3">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground block">AI Cover Image</span>
                    {post.cover_image_url ? (
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadImage(post.cover_image_url!, `cover-${post.id}.png`)}
                            className="h-8"
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Download Image
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(post.cover_image_url!);
                              toast.success("Image URL copied to clipboard!");
                            }}
                            className="h-8"
                          >
                            Copy Image URL
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateCoverImage(post.id)}
                            disabled={generatingPostStep !== null}
                            className="h-8"
                          >
                            {generatingPostStep?.id === post.id ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                {generatingPostStep.step === "generating" && "Generating image..."}
                                {generatingPostStep.step === "uploading" && "Uploading..."}
                                {generatingPostStep.step === "saving" && "Saving..."}
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Regenerate Image
                              </>
                            )}
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCoverImage(post.id)}
                          className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/5"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Image
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateCoverImage(post.id)}
                        disabled={generatingPostStep !== null}
                        className="h-8 border-dashed hover:border-solid border-primary/40 text-primary hover:bg-primary/5"
                      >
                        {generatingPostStep?.id === post.id ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            {generatingPostStep.step === "generating" && "Generating image..."}
                            {generatingPostStep.step === "uploading" && "Uploading..."}
                            {generatingPostStep.step === "saving" && "Saving..."}
                          </>
                        ) : (
                          <>
                            <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                            Generate Cover Image (Pro)
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Metrics and AI Score Footer */}
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-muted-foreground text-3xs uppercase font-medium">Engagement Score</div>
                        <div className="font-bold text-foreground">{post.engagement_score || 0}/100</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-muted-foreground text-3xs uppercase font-medium">Readability Score</div>
                        <div className="font-bold text-foreground">{readability}/100</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="text-muted-foreground text-3xs uppercase font-medium">Reading Time</div>
                        <div className="font-bold text-foreground">{post.estimated_reading_time || "1 min"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="text-muted-foreground text-3xs uppercase font-medium">Character Count</div>
                        <div className="font-bold text-foreground">{postCharacterCount} chars</div>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} feature="ai_images" />
    </div>
  );
}
