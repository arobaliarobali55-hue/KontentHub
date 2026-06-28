"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TONES, PRO_PRICE_USD } from "@/lib/constants";
import { Save, User, CreditCard, Loader2, Brain, Link2, Plus, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/container";
import type { ExperienceEntry } from "@/lib/types";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"brain" | "integrations" | "billing">("brain");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Core Prefs & Brand Brain States
  const [prefs, setPrefs] = useState({
    headline: "",
    bio: "",
    industry: "",
    skills: "",
    target_audience: "",
    writing_goal: "",
    writing_tone: "professional",
    preferred_post_length: "medium",
    brand_voice: "",
    use_emojis: true,
    cta_style: "subtle",
    hashtag_style: "few",
  });

  const [brainFields, setBrainFields] = useState({
    expertise: "",
    content_pillars: "",
    favorite_topics: "",
    keywords: "",
    featured: "",
    recent_posts: "",
    recent_activity: "",
  });

  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  
  // LinkedIn OAuth Status State
  const [linkedInDetails, setLinkedInDetails] = useState<{
    connected: boolean;
    name: string | null;
    email: string | null;
    picture: string | null;
    urn: string | null;
  }>({
    connected: false,
    name: null,
    email: null,
    picture: null,
    urn: null,
  });

  // New Experience Form State
  const [newExp, setNewExp] = useState({
    title: "",
    company: "",
    duration: "",
    description: "",
  });

  // Billing States
  const [plan, setPlan] = useState<string>("free");
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    // Handle LinkedIn success or error from URL params
    const linkedinSuccess = searchParams.get("linkedin_success");
    const linkedinError = searchParams.get("linkedin_error");
    const linkedinErrorDescription = searchParams.get("linkedin_error_description");

    if (linkedinSuccess) {
      toast.success("LinkedIn connected successfully!");
      // Clear the param from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("linkedin_success");
      router.replace(`${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`);
    }

    if (linkedinError) {
      const errorMsg = linkedinErrorDescription || `LinkedIn error: ${linkedinError}`;
      toast.error(errorMsg);
      // Clear the params from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("linkedin_error");
      newSearchParams.delete("linkedin_error_description");
      router.replace(`${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`);
    }

    loadSettings();
  }, [searchParams, router]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();

      if (res.ok) {
        if (data.preferences) {
          setPrefs({
            headline: data.preferences.headline || "",
            bio: data.preferences.about || "",
            industry: data.preferences.industry || "",
            skills: data.preferences.skills?.join(", ") || "",
            target_audience: data.preferences.target_audience || "",
            writing_goal: data.preferences.writing_goal || "",
            writing_tone: data.preferences.writing_tone || "professional",
            preferred_post_length: data.preferences.preferred_post_length || "medium",
            brand_voice: data.preferences.brand_voice || "",
            use_emojis: data.preferences.use_emojis ?? true,
            cta_style: data.preferences.cta_style || "subtle",
            hashtag_style: data.preferences.hashtag_style || "few",
          });
          setPlan(data.preferences.plan || "free");
        }

        if (data.brandBrain) {
          setBrainFields({
            expertise: data.brandBrain.expertise?.join(", ") || "",
            content_pillars: data.brandBrain.content_pillars?.join(", ") || "",
            favorite_topics: data.brandBrain.favorite_topics?.join(", ") || "",
            keywords: data.brandBrain.keywords?.join(", ") || "",
            featured: data.brandBrain.featured || "",
            recent_posts: data.brandBrain.recent_posts || "",
            recent_activity: data.brandBrain.recent_activity || "",
          });
          setExperience(data.brandBrain.experience || []);
          
          setLinkedInDetails({
            connected: data.brandBrain.connection_status === "connected",
            name: data.brandBrain.name,
            email: data.brandBrain.email,
            picture: data.brandBrain.profile_picture,
            urn: data.brandBrain.linkedin_urn,
          });
        }
      }

      // Load usage
      const usageRes = await fetch("/api/usage");
      const usageData = await usageRes.json();
      if (usageData.usage?.plan) {
        setPlan(usageData.usage.plan);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast.error("Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const skillsArray = prefs.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const expertiseArray = brainFields.expertise.split(",").map((s) => s.trim()).filter(Boolean);
      const pillarsArray = brainFields.content_pillars.split(",").map((s) => s.trim()).filter(Boolean);
      const topicsArray = brainFields.favorite_topics.split(",").map((s) => s.trim()).filter(Boolean);
      const keywordsArray = brainFields.keywords.split(",").map((s) => s.trim()).filter(Boolean);

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...prefs,
          ...brainFields,
          skills: skillsArray,
          expertise: expertiseArray,
          content_pillars: pillarsArray,
          favorite_topics: topicsArray,
          keywords: keywordsArray,
          experience,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Brand Brain and settings saved!");
      } else {
        toast.error(data.error || "Failed to save settings.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!confirm("Are you sure you want to disconnect your LinkedIn account?")) return;
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disconnectLinkedIn: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkedInDetails({
          connected: false,
          name: null,
          email: null,
          picture: null,
          urn: null,
        });
        toast.success("LinkedIn account disconnected.");
      } else {
        toast.error(data.error || "Failed to disconnect.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleAddExperience = () => {
    if (!newExp.title || !newExp.company) {
      toast.error("Title and Company are required.");
      return;
    }
    setExperience((prev) => [...prev, newExp]);
    setNewExp({ title: "", company: "", duration: "", description: "" });
    toast.success("Experience added!");
  };

  const handleRemoveExperience = (index: number) => {
    setExperience((prev) => prev.filter((_, i) => i !== index));
    toast.success("Experience removed.");
  };

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

  if (isLoading) {
    return (
      <Container className="max-w-4xl py-12">
        <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading Settings...</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage integrations, view your customized Brand Brain, and update billing.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab("brain")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 px-1 ${
            activeTab === "brain"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Brain className="h-4 w-4" />
          Brand Brain
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 px-1 ${
            activeTab === "integrations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="h-4 w-4" />
          LinkedIn Connection
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 px-1 ${
            activeTab === "billing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Billing & Subscription
        </button>
      </div>

      {/* Active Tab Component */}
      <div className="space-y-6">
        
        {/* ── 1. Tab: Brand Brain ────────────────────────────────────────── */}
        {activeTab === "brain" && (
          <div className="space-y-6">
            
            {/* Basic Identity Card */}
            <Card className="border border-border/80 bg-background/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Core Identity</CardTitle>
                </div>
                <CardDescription>
                  Your professional background that grounds your brand.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="headline">Professional Headline</Label>
                    <Input
                      id="headline"
                      placeholder="e.g. Founder at TechHub | Scaling AI Tools"
                      value={prefs.headline}
                      onChange={(e) => setPrefs({ ...prefs, headline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g. Artificial Intelligence, SaaS"
                      value={prefs.industry}
                      onChange={(e) => setPrefs({ ...prefs, industry: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Summary (Bio)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Short overview of your professional career..."
                    value={prefs.bio}
                    onChange={(e) => setPrefs({ ...prefs, bio: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    placeholder="TypeScript, Marketing Strategy, Growth Hacking"
                    value={prefs.skills}
                    onChange={(e) => setPrefs({ ...prefs, skills: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="featured">Featured Section / Key Links</Label>
                    <Input
                      id="featured"
                      placeholder="e.g. Portfolio links, popular articles"
                      value={brainFields.featured}
                      onChange={(e) => setBrainFields({ ...brainFields, featured: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recent_posts">Recent Posts Summary</Label>
                    <Input
                      id="recent_posts"
                      placeholder="E.g. writes about engineering culture, business pivots"
                      value={brainFields.recent_posts}
                      onChange={(e) => setBrainFields({ ...brainFields, recent_posts: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience List Editor Card */}
            <Card className="border border-border/80 bg-background/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Professional Experience History
                </CardTitle>
                <CardDescription>
                  Detailed history used to pull personal stories and expertise.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Add Experience Inline Form */}
                <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Experience Record</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="exp-title" className="text-2xs">Job Title</Label>
                      <Input
                        id="exp-title"
                        placeholder="e.g. Technical Founder"
                        value={newExp.title}
                        onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exp-company" className="text-2xs">Company</Label>
                      <Input
                        id="exp-company"
                        placeholder="e.g. Stripe"
                        value={newExp.company}
                        onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exp-duration" className="text-2xs">Duration</Label>
                      <Input
                        id="exp-duration"
                        placeholder="e.g. 2022 - Present"
                        value={newExp.duration}
                        onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="exp-desc" className="text-2xs">Key Achievements (Optional)</Label>
                    <Textarea
                      id="exp-desc"
                      placeholder="Summarize your impact..."
                      value={newExp.description}
                      onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                      className="min-h-[50px] text-xs"
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddExperience} className="h-8 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add Record
                  </Button>
                </div>

                {/* Experience List */}
                <div className="space-y-2 pt-2">
                  {experience.length > 0 ? (
                    experience.map((exp, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 rounded-lg border border-border bg-card text-xs gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{exp.title} <span className="font-normal text-muted-foreground">at</span> {exp.company}</p>
                          {exp.duration && <p className="text-3xs text-muted-foreground">{exp.duration}</p>}
                          {exp.description && <p className="text-muted-foreground text-2xs leading-relaxed mt-1">{exp.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveExperience(idx)} className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 border border-dashed rounded-lg">No experience history records added yet.</p>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* Synthesized Brand Brain Card */}
            <Card className="border border-border/80 bg-background/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary animate-pulse" />
                  <CardTitle>AI Brain Insights</CardTitle>
                </div>
                <CardDescription>
                  Synthesized brand indicators that anchor and guide the Llama content creator.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tone">Writing Tone</Label>
                    <select
                      id="tone"
                      value={prefs.writing_tone}
                      onChange={(e) => setPrefs({ ...prefs, writing_tone: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {TONES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      placeholder="e.g. Engineering leaders, Venture Capitalists"
                      value={prefs.target_audience}
                      onChange={(e) => setPrefs({ ...prefs, target_audience: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cta-style">CTA Preference</Label>
                    <select
                      id="cta-style"
                      value={prefs.cta_style}
                      onChange={(e) => setPrefs({ ...prefs, cta_style: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    >
                      <option value="subtle">Subtle</option>
                      <option value="direct">Direct</option>
                      <option value="question">Question-based</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="use-emojis"
                      checked={prefs.use_emojis}
                      onChange={(e) => setPrefs({ ...prefs, use_emojis: e.target.checked })}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor="use-emojis" className="cursor-pointer">Enable Emojis in Content</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expertise">Expertise Sub-topics (comma-separated)</Label>
                  <Input
                    id="expertise"
                    placeholder="e.g. Developer tools, serverless computing, technical writing"
                    value={brainFields.expertise}
                    onChange={(e) => setBrainFields({ ...brainFields, expertise: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pillars">Content Pillars (comma-separated)</Label>
                  <Input
                    id="pillars"
                    placeholder="e.g. Tech insights, Building in public, Productivity tips"
                    value={brainFields.content_pillars}
                    onChange={(e) => setBrainFields({ ...brainFields, content_pillars: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fav-topics">Favorite Topics (comma-separated)</Label>
                  <Input
                    id="fav-topics"
                    placeholder="e.g. Next.js performance, founder journeys, developer relations"
                    value={brainFields.favorite_topics}
                    onChange={(e) => setBrainFields({ ...brainFields, favorite_topics: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    placeholder="SaaS, Developer, Coding, Entrepreneurship"
                    value={brainFields.keywords}
                    onChange={(e) => setBrainFields({ ...brainFields, keywords: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="story">Brand Personal Story Summary</Label>
                  <Textarea
                    id="story"
                    placeholder="Your unique brand voice and founder narrative that AI should remember..."
                    value={prefs.brand_voice}
                    onChange={(e) => setPrefs({ ...prefs, brand_voice: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full sm:w-auto gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Brand Brain
              </Button>
            </div>
          </div>
        )}

        {/* ── 2. Tab: LinkedIn Connection ───────────────────────────────── */}
        {activeTab === "integrations" && (
          <Card className="border border-border/80 bg-background/50">
            <CardHeader>
              <CardTitle>LinkedIn Integration</CardTitle>
              <CardDescription>
                Connect your account to allow direct publication of social posts from KontentHub.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {linkedInDetails.connected ? (
                /* Connected State UI */
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    {linkedInDetails.picture ? (
                      <img
                        src={linkedInDetails.picture}
                        alt={linkedInDetails.name || "LinkedIn profile"}
                        className="h-14 w-14 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {linkedInDetails.name?.charAt(0) || "L"}
                      </div>
                    )}
                    
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {linkedInDetails.name}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-3xs font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                        {linkedInDetails.urn?.includes("mock") && (
                          <span className="inline-flex items-center gap-1 text-3xs font-bold bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3" />
                            Mock Mode
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{linkedInDetails.email}</p>
                      <p className="text-3xs text-muted-foreground/60 font-mono select-all truncate">{linkedInDetails.urn}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleDisconnectLinkedIn} className="text-destructive hover:text-destructive hover:bg-destructive/5">
                      Disconnect Account
                    </Button>
                  </div>
                </div>
              ) : (
                /* Disconnected State UI */
                <div className="text-center py-8 space-y-4 max-w-sm mx-auto">
                  <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full text-muted-foreground/60 mb-2">
                    <Link2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Connect LinkedIn Account</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Integrate your account via OAuth. This authorizes KontentHub to format and publish your selected social drafts directly onto your feed.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      window.location.href = `/api/linkedin/auth?redirect=/app/settings`;
                    }}
                    className="w-full"
                  >
                    Connect LinkedIn
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── 3. Tab: Billing & Subscription ────────────────────────────── */}
        {activeTab === "billing" && (
          <Card className="border border-border/80 bg-background/50">
            <CardHeader>
              <CardTitle>Billing & Plan Status</CardTitle>
              <CardDescription>Manage subscriptions, check generation caps, and upgrade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Current Level: <span className="capitalize text-primary font-bold">{plan === "pro" ? "⭐ Pro Plan" : "Free"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan === "pro"
                      ? "Full creator suite unlocked. Enjoy unlimited post generations, AI images, scheduling, and direct publishing."
                      : "Standard writer tier. Limited to 4 generated posts per week. Upgrade to remove limits."}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Active
                </span>
              </div>

              {plan !== "pro" ? (
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why Upgrade to Pro?</p>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Unlimited Content Generation
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> NVIDIA FLUX AI Cover Images
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> One-Click Publishing to LinkedIn
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Advanced URL/File Import (YouTube, PDFs, Blogs)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Post Scheduling Calendar
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Inline Custom AI Rewriting
                    </div>
                  </div>
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
                      `Upgrade to Pro ($${PRO_PRICE_USD}/mo)`
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Subscription management, receipts, and cancellation options are handled via Dodo Payments.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Contact help.kontenthub@gmail.com to cancel.")}>
                    Manage Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl py-12 mx-auto text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
