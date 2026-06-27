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
  Zap, 
  Sparkles, 
  Loader2, 
  Globe, 
  Video, 
  FileText, 
  ImagePlus,
  ArrowRight,
  Link2,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import type { GeneratedPost } from "@/lib/types";
import { UpgradeModal } from "@/components/layout/upgrade-modal";
import { PostCard } from "@/components/app/post-card";
import { LinkedInReminderModal } from "@/components/layout/linkedin-reminder-modal";

function GenerateContent() {
  const searchParams = useSearchParams();
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<"topic" | "import">("topic");
  
  // Topic generation states
  const [topic, setTopic] = useState("");
  
  // Import generation states
  const [importType, setImportType] = useState<"blog" | "youtube" | "pdf">("blog");
  const [importUrl, setImportUrl] = useState("");
  const [importText, setImportText] = useState("");
  
  // Preferences states
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  
  // Loading & Outputs
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  
  // Plan/Paywall states
  const [plan, setPlan] = useState<string>("free");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<"ai_images" | "general" | "scheduling" | "publishing" | "blog_url">("general");

  // Workflow states
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [generationMode, setGenerationMode] = useState<"linkedin" | "manual" | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [manualProfile, setManualProfile] = useState({
    full_name: "",
    role: "",
    industry: "",
    interests: "",
    tone: "professional",
    target_audience: "",
    cta_style: "subtle",
  });

  // Fetch current subscription plan and settings
  useEffect(() => {
    setIsLoadingSettings(true);
    Promise.all([
      fetch("/api/usage").then((res) => res.json()),
      fetch("/api/settings").then((res) => res.json()),
    ])
      .then(([usageData, settingsData]) => {
        if (usageData.usage) {
          setPlan(usageData.usage.plan);
        }
        if (settingsData.brandBrain) {
          const isConnected = settingsData.brandBrain.connection_status === "connected";
          setIsLinkedInConnected(isConnected);
          if (isConnected) {
            setGenerationMode("linkedin");
          } else {
            // Load saved manual profile if it exists
            if (settingsData.preferences?.manual_profile) {
              setManualProfile(settingsData.preferences.manual_profile);
              setGenerationMode("manual");
            }
          }
        }
      })
      .catch((err) => console.error("Error loading usage & settings:", err))
      .finally(() => setIsLoadingSettings(false));
  }, []);

  // Check if topic query param is passed on load
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setTopic(topicParam);
      setActiveTab("topic");
    }
  }, [searchParams]);

  // Handle PDF text / text file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's a txt or md file
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      toast.success(`Loaded "${file.name}" successfully!`);
    };
    reader.readAsText(file);
  };

  // ── Topic Write Generation ─────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic or idea.");
      return;
    }

    // If no mode chosen and not connected, show reminder so user can choose
    if (!isLinkedInConnected && generationMode === null) {
      setShowReminderModal(true);
      return;
    }

    setIsLoading(true);
    setPosts([]);

    try {
      // If manual mode, validate and save the profile parameters first
      if (generationMode === "manual") {
        if (!manualProfile.full_name.trim() || !manualProfile.industry.trim() || !manualProfile.role.trim()) {
          toast.error("Please fill in your Name, Industry, and Role first.");
          setIsLoading(false);
          return;
        }

        // Save manual profile to preferences
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manual_profile: manualProfile }),
        });
      }

      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic, 
          tone: generationMode === "manual" ? manualProfile.tone : tone,
          length, 
          manualProfile: generationMode === "manual" ? manualProfile : undefined
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.post) {
        setPosts([data.post]);
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

  // ── Import Article / PDF Generation ─────────────────────────────────
  const handleImportGenerate = async () => {
    // If not pro, prevent importing and trigger upgrade paywall
    if (plan !== "pro") {
      setUpgradeFeature("blog_url");
      setShowUpgradeModal(true);
      return;
    }

    if (importType !== "pdf" && !importUrl) {
      toast.error(`Please enter a ${importType === "blog" ? "blog/article" : "YouTube video"} URL.`);
      return;
    }

    if (importType === "pdf" && !importText) {
      toast.error("Please upload a text file or paste document text.");
      return;
    }

    setIsLoading(true);
    setPosts([]);

    try {
      const res = await fetch("/api/content/import-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: importType !== "pdf" ? importUrl : undefined,
          text: importType === "pdf" ? importText : undefined,
          importType,
          tone,
          length,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.posts) {
        setPosts(data.posts);
        toast.success("3 LinkedIn posts generated successfully from your content!");
      } else {
        toast.error(data.error || "Failed to import and generate content.");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("An error occurred during import.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="max-w-6xl py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-amber-600 bg-clip-text text-transparent">
            Content Hub Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Create high-converting, personalized LinkedIn content using Topic Write or Import channels.
          </p>
        </div>
        
        {plan !== "pro" && (
          <Button 
            onClick={() => {
              setUpgradeFeature("general");
              setShowUpgradeModal(true);
            }}
            className="bg-gradient-to-r from-amber-500 to-primary text-white shadow-md hover:shadow-lg transition-all duration-200 border-0"
            size="sm"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Upgrade to Pro
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Form Controls Section (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-6">
              
              {/* Tab Switcher */}
              <div className="flex bg-muted p-1 rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => setActiveTab("topic")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === "topic"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Topic Write
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Show tab, paywall is triggered on submit for free users
                    setActiveTab("import");
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 relative ${
                    activeTab === "import"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Import Content
                  {plan !== "pro" && (
                    <span className="absolute top-1.5 right-2 bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-primary/20 scale-90">
                      PRO
                    </span>
                  )}
                </button>
              </div>

              {/* Form Tab Content */}
              {/* Topic Write Fields */}
              {activeTab === "topic" ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Topic / Idea Prompt
                    </Label>
                    <Textarea
                      id="topic"
                      placeholder="What do you want to write about? Describe your core insight, message, or target theme..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="min-h-[140px] rounded-xl text-sm leading-relaxed border-border/85"
                    />
                  </div>

                  {/* ── Generation Mode Selector ───────────────────────── */}
                  {!isLoadingSettings && (
                    <div className="space-y-2">
                      <Label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Content Personalization
                      </Label>

                      {isLinkedInConnected ? (
                        // Connected badge
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground">LinkedIn Brand Brain Active</p>
                            <p className="text-[10px] text-muted-foreground">Posts will be personalized using your LinkedIn profile</p>
                          </div>
                        </div>
                      ) : (
                        // Mode selector for non-connected users
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              // Redirect to LinkedIn OAuth
                              window.location.href = "/api/linkedin/auth?redirect=/app/generate";
                            }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-[#0077B5]/40 bg-[#0077B5]/5 hover:bg-[#0077B5]/10 transition-all text-center"
                          >
                            <Link2 className="h-4 w-4 text-[#0077B5]" />
                            <span className="text-[10px] font-bold text-[#0077B5]">Connect LinkedIn</span>
                            <span className="text-[9px] text-muted-foreground">Personalized AI</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenerationMode("manual")}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                              generationMode === "manual"
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <UserCheck className="h-4 w-4" />
                            <span className="text-[10px] font-bold">Manual Profile</span>
                            <span className="text-[9px] text-muted-foreground">Fill in your info</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Manual Profile Fields (shown when manual mode) ── */}
                  {!isLinkedInConnected && generationMode === "manual" && (
                    <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border/60 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-bold text-foreground">Your Profile</p>
                        <p className="text-[10px] text-muted-foreground ml-1">AI will use this to personalize your posts</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label htmlFor="mp-name" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                          <Input
                            id="mp-name"
                            placeholder="John Smith"
                            value={manualProfile.full_name}
                            onChange={(e) => setManualProfile(p => ({ ...p, full_name: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="mp-role" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Profession / Role *</Label>
                          <Input
                            id="mp-role"
                            placeholder="CEO / Engineer"
                            value={manualProfile.role}
                            onChange={(e) => setManualProfile(p => ({ ...p, role: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label htmlFor="mp-industry" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Industry *</Label>
                          <Input
                            id="mp-industry"
                            placeholder="SaaS / Marketing / Finance"
                            value={manualProfile.industry}
                            onChange={(e) => setManualProfile(p => ({ ...p, industry: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="mp-audience" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target Audience</Label>
                          <Input
                            id="mp-audience"
                            placeholder="Founders / Recruiters"
                            value={manualProfile.target_audience}
                            onChange={(e) => setManualProfile(p => ({ ...p, target_audience: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="mp-interests" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Interests / Skills</Label>
                        <Input
                          id="mp-interests"
                          placeholder="AI, product growth, leadership"
                          value={manualProfile.interests}
                          onChange={(e) => setManualProfile(p => ({ ...p, interests: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label htmlFor="mp-tone" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Writing Tone</Label>
                          <select
                            id="mp-tone"
                            value={manualProfile.tone}
                            onChange={(e) => setManualProfile(p => ({ ...p, tone: e.target.value }))}
                            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="professional">Professional</option>
                            <option value="founder">Founder Voice</option>
                            <option value="storytelling">Storytelling</option>
                            <option value="educational">Educational</option>
                            <option value="corporate">Corporate</option>
                            <option value="thought_leadership">Thought Leadership</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="mp-cta" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CTA Style</Label>
                          <select
                            id="mp-cta"
                            value={manualProfile.cta_style}
                            onChange={(e) => setManualProfile(p => ({ ...p, cta_style: e.target.value }))}
                            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="subtle">Subtle</option>
                            <option value="direct">Direct / Link</option>
                            <option value="question">Question / Discuss</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Import Content Fields
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Import Type button-cards */}
                  <div className="space-y-2">
                    <Label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Import Source Type
                    </Label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: "blog", label: "Blog / Web", icon: <Globe className="h-4 w-4" /> },
                        { id: "youtube", label: "YouTube", icon: <Video className="h-4 w-4" /> },
                        { id: "pdf", label: "PDF / Doc", icon: <FileText className="h-4 w-4" /> },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setImportType(t.id as any);
                            setImportUrl("");
                            setImportText("");
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 text-center gap-1.5 ${
                            importType === t.id
                              ? "border-primary bg-primary/5 text-foreground shadow-sm"
                              : "border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground bg-background"
                          }`}
                        >
                          {t.icon}
                          <span className="text-[10px] font-bold">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contextual input field */}
                  {importType !== "pdf" ? (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <Label htmlFor="import-url" className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {importType === "blog" ? "Article or Blog post URL" : "YouTube Video URL"}
                      </Label>
                      <Input
                        id="import-url"
                        type="url"
                        placeholder={importType === "blog" ? "https://example.com/blog-post" : "https://youtube.com/watch?v=..."}
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        className="rounded-xl border-border/85"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        AI will read the article content and extract key takeaways.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="space-y-1.5">
                        <Label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Upload Document Text
                        </Label>
                        <div className="border-2 border-dashed border-border/80 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/10 relative cursor-pointer">
                          <input
                            type="file"
                            accept=".txt,.md,.rtf"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-xs font-semibold">Upload text file (.txt, .md)</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Or paste details below</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="import-text" className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Or Paste Text Content
                        </Label>
                        <Textarea
                          id="import-text"
                          placeholder="Paste document body, report details, or text paragraphs here..."
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          className="min-h-[100px] rounded-xl text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <hr className="border-border/60" />

              {/* Common Tone and Length Customizers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Tone</Label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="professional">Professional</option>
                    <option value="founder">Founder Voice</option>
                    <option value="storytelling">Storytelling</option>
                    <option value="educational">Educational</option>
                    <option value="corporate">Corporate</option>
                    <option value="thought_leadership">Thought Leadership</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length" className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Length</Label>
                  <select
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="short">Short (Quick, punchy)</option>
                    <option value="medium">Medium (Sweet spot)</option>
                    <option value="long">Long (Deep threads)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Button */}
              {activeTab === "topic" ? (
                <Button 
                  onClick={handleGenerate} 
                  disabled={isLoading} 
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-5 rounded-xl shadow-md"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Crafting Post...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> 
                      Generate Post
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleImportGenerate} 
                  disabled={isLoading} 
                  className={`w-full py-5 rounded-xl shadow-md ${
                    plan !== "pro"
                      ? "bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/95 text-white border-0"
                      : "bg-primary hover:bg-primary/95 text-primary-foreground"
                  }`}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing & Writing...
                    </>
                  ) : plan !== "pro" ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 text-amber-300 fill-amber-300" />
                      Unlock Import (Pro)
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Import & Generate 3 Posts
                    </>
                  )}
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Output Section (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {isLoading ? (
            <div className="min-h-[420px] border border-border/80 bg-card rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="font-bold text-foreground text-lg">Crafting Your Masterpiece</h3>
              <div className="w-full max-w-md mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs text-primary font-bold">1</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: "100%" }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">Analyzing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs text-primary font-bold">2</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: "100%" }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">Writing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: "50%" }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">Finalizing</span>
                </div>
              </div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
                  Generated LinkedIn Content ({posts.length} {posts.length === 1 ? "post" : "posts"})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPosts([])}
                  className="text-xs text-muted-foreground hover:text-foreground h-8"
                >
                  Clear Results
                </Button>
              </div>
              
              <div className="space-y-6">
                {posts.map((p, idx) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    plan={plan as "free" | "pro"}
                    isLinkedInConnected={isLinkedInConnected}
                    showSchedule={true}
                    showPublish={true}
                    index={idx}
                    onUpdate={(updated) => {
                      setPosts(prev => prev.map(item => item.id === p.id ? { ...item, ...updated } : item));
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="min-h-[420px] border-2 border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card/30 backdrop-blur-sm shadow-inner">
              <Sparkles className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="font-bold text-foreground text-sm">Your Personal Ghostwriting Workspace</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                Choose Topic Write for quick ideas, or choose Import to transform blogs, YouTube videos, and documents into high-converting posts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrades Paywall Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        feature={upgradeFeature} 
      />

      {/* LinkedIn Connection Reminder */}
      <LinkedInReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        mode="generation"
        onContinueManual={() => {
          setGenerationMode("manual");
          setShowReminderModal(false);
        }}
      />
    </Container>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl py-16 mx-auto text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
        Loading Content Hub Generator...
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
