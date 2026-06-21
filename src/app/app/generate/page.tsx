"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, Download, Copy, Edit2, Check, X, 
  Sparkles, Award, Clock, BookOpen, ArrowUpRight, ImagePlus, Loader2, Trash2
} from "lucide-react";
import type { GeneratedPost } from "@/lib/types";
import { UpgradeModal } from "@/components/layout/upgrade-modal";

function calculateReadabilityScore(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const avgSentenceLength = words / sentences;
  const score = Math.max(10, Math.min(100, Math.round(120 - 1.8 * avgSentenceLength)));
  return score;
}

function GenerateContent() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState<string | null>(null);
  
  // The post state, matches GeneratedPost type
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<GeneratedPost>>({});

  const [plan, setPlan] = useState<string>("free");
  const [generationStep, setGenerationStep] = useState<"generating" | "uploading" | "saving" | null>(null);
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

  const handleGenerateCoverImage = async () => {
    if (!post) return;
    if (plan !== "pro") {
      setShowUpgradeModal(true);
      return;
    }
    
    setGenerationStep("generating");
    const t1 = setTimeout(() => setGenerationStep("uploading"), 4500);
    const t2 = setTimeout(() => setGenerationStep("saving"), 7500);

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPost(prev => prev ? { ...prev, cover_image_url: data.cover_image_url } : null);
        toast.success("Cover image created successfully.");
      } else {
        toast.error(data.error || "Failed to generate cover image.");
      }
    } catch (error) {
      toast.error("An error occurred during cover image generation.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setGenerationStep(null);
    }
  };

  const handleDeleteCoverImage = async () => {
    if (!post) return;
    try {
      const res = await fetch("/api/image/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPost(prev => prev ? { ...prev, cover_image_url: null } : null);
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

  // Check if topic query param is passed
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }
    setIsLoading(true);
    setPost(null);
    setIsEditing(false);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, sourceUrl, tone, length }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPost(data.post);
        toast.success("Post generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate post.");
      }
    } catch (error) {
      toast.error("An error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (option: "shorter" | "more_professional" | "more_engaging") => {
    if (!post) return;
    setRefineLoading(option);
    setIsEditing(false);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic, 
          sourceUrl, 
          tone, 
          length, 
          refineOption: option, 
          previousPost: post 
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPost(data.post);
        toast.success(`Refined post (${option.replace("more_", "")})!`);
      } else {
        toast.error(data.error || "Failed to refine post.");
      }
    } catch (error) {
      toast.error("An error occurred during refinement.");
    } finally {
      setRefineLoading(null);
    }
  };

  const startEdit = () => {
    if (!post) return;
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
    if (!post) return;
    try {
      const res = await fetch("/api/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, ...editForm }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPost(prev => prev ? { ...prev, ...editForm } : null);
        setIsEditing(false);
        toast.success("Post updated!");
      } else {
        toast.error(data.error || "Failed to save edits.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleExportText = () => {
    if (!post) return;
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

  const fullPostText = post ? `${post.hook}\n\n${post.content}\n\n${post.cta}\n\n${post.hashtags.join(" ")}` : "";
  const postCharacterCount = fullPostText.length;
  const readability = post ? calculateReadabilityScore(post.content) : 0;

  return (
    <Container className="max-w-5xl py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Post</h1>
          <p className="text-muted-foreground mt-2">Create a new personalized LinkedIn post.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Form Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic / Idea</Label>
            <Textarea
              id="topic"
              placeholder="What do you want to write about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source Article URL (Optional)</Label>
            <Input
              id="source"
              placeholder="https://example.com/news"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="professional">Professional</option>
                <option value="founder">Founder</option>
                <option value="storytelling">Storytelling</option>
                <option value="educational">Educational</option>
                <option value="corporate">Corporate</option>
                <option value="thought_leadership">Thought Leadership</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <select
                id="length"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="short">Short (Quick, punchy)</option>
                <option value="medium">Medium (Sweet spot)</option>
                <option value="long">Long (Deep threads)</option>
              </select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? "Generating..." : <><Zap className="w-4 h-4 mr-2" /> Generate Post</>}
          </Button>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          {post ? (
            <Card className="overflow-hidden border border-primary/20 bg-primary/2 shadow-premium">
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
                
                {/* Header title / Save Actions */}
                <div className="flex justify-between items-center gap-4 pb-3 border-b">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-title" className="sr-only">Title</Label>
                      <Input
                        id="edit-title"
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="h-8 font-semibold w-52"
                        placeholder="Post Title"
                      />
                    </div>
                  ) : (
                    <h3 className="text-lg font-semibold leading-tight text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                      {post.title || "Generated Post"}
                    </h3>
                  )}

                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="icon-sm" onClick={saveEdit} className="text-green-600 hover:text-green-700 bg-green-500/5">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={cancelEdit} className="text-red-500 hover:text-red-600 bg-red-500/5">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon-sm" onClick={startEdit} className="text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* ChatGPT-Style Inline Editor / Display */}
                <div className="space-y-4 pt-1">
                  {/* Hook */}
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

                  {/* Body Content */}
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

                  {/* CTA */}
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

                  {/* Hashtags */}
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

                {/* Granular Copy Actions and Export */}
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

                  <Button variant="secondary" size="sm" onClick={handleExportText} className="h-8">
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
                          onClick={handleGenerateCoverImage}
                          disabled={generationStep !== null}
                          className="h-8"
                        >
                          {generationStep ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              {generationStep === "generating" && "Generating image..."}
                              {generationStep === "uploading" && "Uploading..."}
                              {generationStep === "saving" && "Saving..."}
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
                        onClick={handleDeleteCoverImage}
                        className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/5"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Image
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateCoverImage}
                      disabled={generationStep !== null}
                      className="h-8 border-dashed hover:border-solid border-primary/40 text-primary hover:bg-primary/5"
                    >
                      {generationStep ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          {generationStep === "generating" && "Generating image..."}
                          {generationStep === "uploading" && "Uploading..."}
                          {generationStep === "saving" && "Saving..."}
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

                {/* AI Score / Readability Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/40 rounded-lg border border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-muted-foreground text-3xs uppercase font-medium">Engagement</div>
                      <div className="font-bold text-foreground">{post.engagement_score || 0}/100</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-muted-foreground text-3xs uppercase font-medium">Readability</div>
                      <div className="font-bold text-foreground">{readability}/100</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div>
                      <div className="text-muted-foreground text-3xs uppercase font-medium">Read Time</div>
                      <div className="font-bold text-foreground">{post.estimated_reading_time || "1 min"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-muted-foreground text-3xs uppercase font-medium">Chars</div>
                      <div className="font-bold text-foreground">{postCharacterCount}</div>
                    </div>
                  </div>
                </div>

                {/* Refinement Options */}
                <div className="pt-4 border-t space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Quick Refine Post:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRefine("shorter")} 
                      disabled={refineLoading !== null}
                      className="text-xs h-9"
                    >
                      {refineLoading === "shorter" ? "Processing..." : "Make it Shorter"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRefine("more_professional")} 
                      disabled={refineLoading !== null}
                      className="text-xs h-9"
                    >
                      {refineLoading === "more_professional" ? "Processing..." : "More Professional"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRefine("more_engaging")} 
                      disabled={refineLoading !== null}
                      className="text-xs h-9"
                    >
                      {refineLoading === "more_engaging" ? "Processing..." : "More Engaging"}
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="h-full border-2 border-dashed border-border rounded-xl flex items-center justify-center p-12 text-center text-muted-foreground bg-card">
              {isLoading ? "AI is crafting your post..." : "Your generated post will appear here."}
            </div>
          )}
        </div>
      </div>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} feature="ai_images" />
    </Container>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="max-w-5xl py-8 mx-auto text-center text-muted-foreground">Loading content generator...</div>}>
      <GenerateContent />
    </Suspense>
  );
}
