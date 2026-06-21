"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Container } from "@/components/layout/container";

export default function OnboardingPage() {
  const router = useRouter();
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualData, setManualData] = useState({
    headline: "",
    about: "",
    industry: "",
  });

  const handleScrape = async () => {
    if (!linkedinUrl) {
      toast.error("Please enter a LinkedIn URL");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/profile/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Profile analyzed successfully!");
        router.push("/app");
      } else {
        toast.error(data.error || "Failed to analyze profile.");
        setShowManual(true);
      }
    } catch (error) {
      toast.error("An error occurred. Please try the manual setup.");
      setShowManual(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: manualData.headline,
          about: manualData.about,
          industry: manualData.industry,
          skills: [],
        }),
      });
      if (res.ok) {
        toast.success("Profile saved!");
        router.push("/app");
      } else {
        toast.error("Failed to save profile.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="max-w-2xl py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connect your LinkedIn</h1>
          <p className="text-muted-foreground mt-2">
            We need to learn about your professional background to generate personalized content.
          </p>
        </div>

        {!showManual ? (
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="url">LinkedIn Profile URL</Label>
              <Input
                id="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleScrape} disabled={isLoading} className="w-full">
              {isLoading ? "Analyzing..." : "Analyze Profile"}
            </Button>
            <div className="text-center text-sm text-muted-foreground mt-4">
              Having trouble?{" "}
              <button
                onClick={() => setShowManual(true)}
                className="text-primary hover:underline font-medium"
              >
                Set up manually
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Manual Setup</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  placeholder="e.g. Software Engineer at Tech Co"
                  value={manualData.headline}
                  onChange={(e) => setManualData({ ...manualData, headline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g. Technology, Marketing"
                  value={manualData.industry}
                  onChange={(e) => setManualData({ ...manualData, industry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about">About / Experience Summary</Label>
                <Textarea
                  id="about"
                  placeholder="Tell us about your background..."
                  className="min-h-[100px]"
                  value={manualData.about}
                  onChange={(e) => setManualData({ ...manualData, about: e.target.value })}
                />
              </div>
              <Button onClick={handleManualSubmit} className="w-full">
                Save Profile & Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
