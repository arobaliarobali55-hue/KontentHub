"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Container } from "@/components/layout/container";
import {
  Link2,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Building,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

type SetupStep = "connect" | "profile" | "analyzing" | "done";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState<SetupStep>("connect");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [connectionDetails, setConnectionDetails] = useState<{
    connected: boolean;
    name: string | null;
    picture: string | null;
    urn: string | null;
  }>({
    connected: false,
    name: null,
    picture: null,
    urn: null,
  });

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSkipping, setIsSkipping] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  useEffect(() => {
    checkConnectionStatus();
  }, [searchParams]);

  const checkConnectionStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      
      if (res.ok && data.brandBrain) {
        const isConnected = data.brandBrain.connection_status === "connected" || searchParams.get("linkedin_success") === "true";
        setConnectionDetails({
          connected: isConnected,
          name: data.brandBrain.name,
          picture: data.brandBrain.profile_picture,
          urn: data.brandBrain.linkedin_urn,
        });

        if (isConnected) {
          setStep("profile");
        }
      }
    } catch (error) {
      console.error("Failed to fetch connection status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleConnectLinkedIn = () => {
    window.location.href = `/api/linkedin/auth?redirect=/app/onboarding`;
  };

  const handleSkipOnboarding = async () => {
    setIsSkipping(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_status: "skipped" }),
      });
      if (res.ok) {
        toast.success("Onboarding skipped. You can connect LinkedIn later.");
        router.push("/app");
      } else {
        toast.error("Failed to skip onboarding.");
      }
    } catch (error) {
      console.error("Skip onboarding error:", error);
      toast.error("Something went wrong.");
    } finally {
      setIsSkipping(false);
    }
  };

  const runAnalysis = async () => {
    if (!linkedinUrl.trim()) {
      toast.error("Please enter your LinkedIn profile URL.");
      return;
    }

    if (!linkedinUrl.includes("linkedin.com/")) {
      toast.error("Please enter a valid LinkedIn URL (e.g. linkedin.com/in/username).");
      return;
    }

    setStep("analyzing");
    setAnalysisProgress(15);
    setProgressMessage("Scraping your LinkedIn profile details via Jina AI...");

    try {
      // 1. Scraping and Brand Brain Synthesis
      const response = await fetch("/api/profile/brand-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl }),
      });

      setAnalysisProgress(55);
      setProgressMessage("Synthesizing Content Pillars and Personal Story into your Brand Brain...");

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze profile.");
      }

      setAnalysisProgress(80);
      setProgressMessage("Generating your first 3 personalized posts and finding matching cover images...");
      
      // Artificial delay to make post generation visible and feel premium
      await new Promise(r => setTimeout(r, 1500));

      setAnalysisProgress(100);
      setProgressMessage("Brand Brain complete!");
      setStep("done");
      toast.success("LinkedIn profile analyzed and 3 starter posts generated!");

      setTimeout(() => {
        router.push("/app/linkedin-posts");
      }, 1000);
    } catch (error: any) {
      console.error("Onboarding analysis error:", error);
      toast.error(error.message || "Something went wrong. Please check the URL and try again.");
      setStep("profile");
      setAnalysisProgress(0);
    }
  };

  if (isLoadingStatus) {
    return (
      <Container className="max-w-md py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Checking LinkedIn authorization status...</p>
      </Container>
    );
  }

  return (
    <Container className="max-w-xl py-12">
      <div className="space-y-8">
        
        {/* Onboarding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome to KontentHub
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Build Your Brand Brain
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Connect LinkedIn and enter your public profile URL. Our AI will analyze your bio, experience, and interests to build your writing persona.
          </p>
        </div>

        {/* Setup Steps Wizard */}
        <div className="flex justify-center items-center gap-2 text-xs font-semibold text-muted-foreground border-b border-border/40 pb-4">
          <div className={cn("px-2.5 py-1 rounded-full flex items-center gap-1", step === "connect" ? "bg-primary/10 text-primary" : "text-muted-foreground/60")}>
            <span className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">1</span>
            Connect
          </div>
          <ArrowRight className="h-3.5 w-3.5 opacity-30" />
          <div className={cn("px-2.5 py-1 rounded-full flex items-center gap-1", (step === "profile" || step === "analyzing" || step === "done") ? "bg-primary/10 text-primary" : "text-muted-foreground/60")}>
            <span className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">2</span>
            Analyze URL
          </div>
        </div>

        {/* ─── State 1: Connect LinkedIn ───────────────────────────────── */}
        {step === "connect" && (
          <Card className="border border-border/80 bg-background/50 p-6 text-center space-y-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Link2 className="h-6 w-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold">Authorize your account</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Connect your LinkedIn profile via OAuth. This fetches your name and URN to initialize your workspace.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="flex-1 relative">
                <span className="absolute -top-2.5 left-4 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm z-10">
                  ★ Recommended
                </span>
                <Button onClick={handleConnectLinkedIn} className="w-full gap-2 bg-[#0077B5] hover:bg-[#005e8f] text-white border border-[#0077B5] py-6 rounded-xl shadow-md transition-all duration-200" size="lg" disabled={isSkipping}>
                  Connect LinkedIn Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleSkipOnboarding} variant="outline" className="flex-1 border-border/80 py-6 rounded-xl" size="lg" disabled={isSkipping}>
                {isSkipping ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Skip for now
              </Button>
            </div>

            <p className="text-3xs text-muted-foreground/60">
              * In development, mock accounts will be created if credentials are not configured.
            </p>
          </Card>
        )}

        {/* ─── State 2: Profile URL entry ─────────────────────────────── */}
        {step === "profile" && (
          <Card className="border border-border/80 bg-background/50 p-6 space-y-6 animate-in fade-in duration-300">
            {/* Connection Success Header */}
            <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              {connectionDetails.picture ? (
                <img src={connectionDetails.picture} alt="LinkedIn user" className="h-10 w-10 rounded-full border border-primary/20" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {connectionDetails.name?.charAt(0) || "L"}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-foreground truncate">Connected as {connectionDetails.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-emerald-600 font-medium">Authorization connected</span>
                  {connectionDetails.urn?.includes("mock") && (
                    <span className="text-[8px] bg-sky-500/10 text-sky-600 px-1 rounded">Mock</span>
                  )}
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            </div>

            {/* Profile URL Input */}
            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="linkedin-url">Paste Public LinkedIn Profile URL</Label>
                <Input
                  id="linkedin-url"
                  placeholder="https://www.linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-start gap-2 text-2xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/50">
                <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  AI will scrape your profile to extract bio, experience, skills, industry, featured sections, and recent posts to build your unified <strong>Brand Brain</strong>.
                </p>
              </div>

              <Button onClick={runAnalysis} className="w-full gap-2" size="lg">
                <Sparkles className="h-4 w-4" />
                Build My Brand Brain
              </Button>
            </div>
          </Card>
        )}

        {/* ─── State 3: Analysis Scraping Progress ────────────────────── */}
        {step === "analyzing" && (
          <Card className="border border-border/80 bg-background/50 p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                style={{ animationDuration: "0.8s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" style={{ animationDuration: "1.2s" }} />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                {progressMessage}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Synthesizing Brand Persona (usually takes 15–20 seconds).
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-primary rounded-full transition-all duration-700 ease-in-out"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>

            {/* Stages info */}
            <div className="grid grid-cols-3 gap-2 text-2xs">
              <div className={cn("p-1.5 rounded-lg font-medium", analysisProgress >= 15 ? "bg-emerald-500/10 text-emerald-600" : "text-muted-foreground")}>
                {analysisProgress >= 55 ? "✓ Scraped URL" : "Scraping profile"}
              </div>
              <div className={cn("p-1.5 rounded-lg font-medium", analysisProgress >= 55 ? "bg-emerald-500/10 text-emerald-600" : "text-muted-foreground")}>
                {analysisProgress >= 80 ? "✓ Brain Created" : "Creating Brain"}
              </div>
              <div className={cn("p-1.5 rounded-lg font-medium", analysisProgress >= 80 ? "bg-primary/10 text-primary animate-pulse" : "text-muted-foreground")}>
                Generating posts
              </div>
            </div>
          </Card>
        )}

        {/* ─── State 4: Done ───────────────────────────────────────────── */}
        {step === "done" && (
          <Card className="border border-border/80 bg-background/50 p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto animate-in zoom-in duration-300" />
            <div>
              <h3 className="text-lg font-bold">Brand Brain Initialized!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your writing identity has been saved. Redirecting to your dashboard to review your 3 personalized drafts...
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-emerald-500 rounded-full w-full" />
            </div>
          </Card>
        )}

      </div>
    </Container>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="max-w-xl py-12 mx-auto text-center text-muted-foreground">Loading onboarding wizard...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
