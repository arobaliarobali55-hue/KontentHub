/**
 * Shared product constants — sourced from the PRD.
 * Used by marketing, app, and API layers so values stay in sync.
 */

export type ToneId =
  | "professional"
  | "founder"
  | "storytelling"
  | "educational"
  | "corporate"
  | "thought_leadership";

export type LengthId = "short" | "medium" | "long";

export type PlanId = "free" | "pro";

export const TONES: { id: ToneId; label: string; description: string }[] = [
  {
    id: "professional",
    label: "Professional",
    description: "Polished and credible — the safe, smart default.",
  },
  {
    id: "founder",
    label: "Founder",
    description: "Direct, opinionated, building-in-public energy.",
  },
  {
    id: "storytelling",
    label: "Storytelling",
    description: "Narrative hooks that pull readers in and keep them reading.",
  },
  {
    id: "educational",
    label: "Educational",
    description: "Clear, value-dense, teaches something useful.",
  },
  {
    id: "corporate",
    label: "Corporate",
    description: "Measured and on-message for company channels.",
  },
  {
    id: "thought_leadership",
    label: "Thought Leadership",
    description: "Bold takes that establish a point of view.",
  },
];

export const LENGTHS: { id: LengthId; label: string; description: string }[] = [
  { id: "short", label: "Short", description: "~60–90 words. Quick, punchy." },
  {
    id: "medium",
    label: "Medium",
    description: "~150–220 words. The sweet spot for reach.",
  },
  {
    id: "long",
    label: "Long",
    description: "~300–450 words. Deep takes and threads.",
  },
];

/** Free-plan weekly generation cap (PRD). */
export const FREE_WEEKLY_LIMIT = 4;

/** Pro plan monthly price in USD (PRD). */
export const PRO_PRICE_USD = 1.99;

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: 0,
    cadence: "forever",
    description: "Everything you need to start posting consistently.",
    features: [
      `${FREE_WEEKLY_LIMIT} AI-generated posts per week`,
      "Personalized content from your profile",
      "Standard generation speed",
      "Copy to clipboard",
      "Full post history",
    ],
    cta: "Get started",
    ctaHref: "/sign-up",
    highlighted: false,
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    price: PRO_PRICE_USD,
    cadence: "per month",
    description: "For creators serious about growing on LinkedIn.",
    features: [
      "Unlimited content generation",
      "AI cover images",
      "Premium writing styles",
      "Faster AI responses",
      "Export options (TXT, Markdown)",
      "Early access to new features",
    ],
    cta: "Start Pro",
    ctaHref: "/sign-up",
    highlighted: true,
  },
} as const;
