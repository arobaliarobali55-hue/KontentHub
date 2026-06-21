"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TONES, LENGTHS, PRO_PRICE_USD } from "@/lib/constants";
import { Save, User, Palette, CreditCard, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [prefs, setPrefs] = useState({
    headline: "",
    about: "",
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
  const [isSaving, setIsSaving] = useState(false);
  const [plan, setPlan] = useState<string>("free");
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);

  useEffect(() => {
    // Load current plan usage status
    fetch("/api/usage")
      .then((res) => res.json())
      .then((data) => {
        if (data.usage) {
          setPlan(data.usage.plan);
        }
      })
      .catch((err) => console.error("Error loading usage plan:", err))
      .finally(() => setLoadingPlan(false));
  }, []);

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

  useEffect(() => {
    // Load existing preferences
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) {
          setPrefs({
            headline: data.preferences.headline || "",
            about: data.preferences.about || "",
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
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...prefs,
          skills: prefs.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Settings saved!");
      } else {
        toast.error(data.error || "Failed to save settings.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile and AI writing preferences.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Professional Profile</CardTitle>
          </div>
          <CardDescription>This information is used to personalize your content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="e.g. Senior Engineer at Stripe"
                value={prefs.headline}
                onChange={(e) => setPrefs({ ...prefs, headline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g. Technology"
                value={prefs.industry}
                onChange={(e) => setPrefs({ ...prefs, industry: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">About / Bio</Label>
            <Textarea
              id="about"
              placeholder="Describe your professional background..."
              value={prefs.about}
              onChange={(e) => setPrefs({ ...prefs, about: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              placeholder="JavaScript, React, Leadership"
              value={prefs.skills}
              onChange={(e) => setPrefs({ ...prefs, skills: e.target.value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input
                id="target_audience"
                placeholder="e.g. Tech founders, recruiters"
                value={prefs.target_audience}
                onChange={(e) => setPrefs({ ...prefs, target_audience: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="writing_goal">Writing Goal</Label>
              <Input
                id="writing_goal"
                placeholder="e.g. Thought leadership, hiring"
                value={prefs.writing_goal}
                onChange={(e) => setPrefs({ ...prefs, writing_goal: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Writing Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>AI Writing Preferences</CardTitle>
          </div>
          <CardDescription>Customize how the AI writes for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tone">Default Tone</Label>
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
              <Label htmlFor="post-length">Default Post Length</Label>
              <select
                id="post-length"
                value={prefs.preferred_post_length}
                onChange={(e) => setPrefs({ ...prefs, preferred_post_length: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {LENGTHS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label} — {l.description}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand_voice">Brand Voice Description</Label>
            <Textarea
              id="brand_voice"
              placeholder="e.g. Authentic, no corporate speak, uses analogies..."
              value={prefs.brand_voice}
              onChange={(e) => setPrefs({ ...prefs, brand_voice: e.target.value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emojis"
                checked={prefs.use_emojis}
                onChange={(e) => setPrefs({ ...prefs, use_emojis: e.target.checked })}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="emojis" className="cursor-pointer">Use emojis in posts</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta_style">CTA Style</Label>
              <select
                id="cta_style"
                value={prefs.cta_style}
                onChange={(e) => setPrefs({ ...prefs, cta_style: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="subtle">Subtle</option>
                <option value="direct">Direct</option>
                <option value="question">Question-based</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hashtag_style">Hashtag Style</Label>
              <select
                id="hashtag_style"
                value={prefs.hashtag_style}
                onChange={(e) => setPrefs({ ...prefs, hashtag_style: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="none">None</option>
                <option value="few">Few (3-5)</option>
                <option value="many">Many (5-10)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Billing</CardTitle>
          </div>
          <CardDescription>Manage your subscription and plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPlan ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading plan details...
            </div>
          ) : plan === "pro" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Current Plan: Pro</p>
                  <p className="text-xs text-muted-foreground mt-1">Unlimited post generation unlocked.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                  Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Billing management and invoices are handled via Dodo Payments. Contact support if you need to make changes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Current Plan: Free</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You are currently limited to 4 generated posts per week.
                </p>
              </div>
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full sm:w-auto"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  `Upgrade to Pro ($${PRO_PRICE_USD}/mo)`
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
