"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

const CATEGORIES = ["AI", "SaaS", "Startups", "Marketing", "Productivity", "Business", "Technology"];

type Suggestion = {
  title: string;
  description: string;
};

export function TrendingTopicsClient() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/topics/suggestions?category=${encodeURIComponent(selectedCategory)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setSuggestions(data.suggestions);
        } else {
          toast.error("Failed to load trending suggestions.");
        }
      } catch (error) {
        console.error("Error loading suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [selectedCategory]);

  const handleSuggestionClick = (description: string) => {
    router.push(`/app/generate?topic=${encodeURIComponent(description)}`);
  };

  return (
    <Card className="border border-primary/10">
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Trending Topics & AI Suggestions
          </h2>
          <p className="text-sm text-muted-foreground">
            Select a category to discover trending angles and instantly start writing.
          </p>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const isSelected = category === selectedCategory;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Suggestions List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2 bg-muted/20 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Generating fresh trending suggestions...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg">
              No suggestions available.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {suggestions.map((suggestion, idx) => (
                <Card 
                  key={idx} 
                  onClick={() => handleSuggestionClick(suggestion.description)}
                  className="group relative cursor-pointer border border-border/80 bg-background/50 hover:bg-primary/2 hover:border-primary/30 transition-all overflow-hidden"
                >
                  <CardContent className="p-4 space-y-2 flex flex-col justify-between h-full min-h-[140px]">
                    <div className="space-y-1.5">
                      <Badge variant="outline" className="text-3xs uppercase font-medium bg-primary/5 border-primary/20 text-primary">
                        Angle {idx + 1}
                      </Badge>
                      <h4 className="text-xs font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                        {suggestion.title}
                      </h4>
                      <p className="text-2xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {suggestion.description}
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-end text-3xs font-semibold text-primary gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Write Post <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
