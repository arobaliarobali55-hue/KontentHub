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
export const FREE_WEEKLY_LIMIT = 3;

/** Pro plan monthly price in USD (PRD). */
export const PRO_PRICE_USD = 1.99;

export type ImageStylePresetId =
  | "photorealistic"
  | "corporate_office"
  | "three_d_render"
  | "minimalist"
  | "flat_illustration"
  | "vector_art"
  | "digital_painting"
  | "futuristic"
  | "modern_startup"
  | "dark_theme";

export const IMAGE_STYLE_PRESETS: { id: ImageStylePresetId; label: string; prompt: string }[] = [
  {
    id: "photorealistic",
    label: "Photorealistic",
    prompt: "photorealistic style, highly detailed real photograph, professional camera shot",
  },
  {
    id: "corporate_office",
    label: "Corporate Office",
    prompt: "corporate office setting, professional workspace, clean corporate aesthetic",
  },
  {
    id: "three_d_render",
    label: "3D Render",
    prompt: "abstract 3D render, smooth glossy materials, premium Blender rendering style",
  },
  {
    id: "minimalist",
    label: "Minimalist",
    prompt: "minimalist design, clean lines, simple geometric forms, high negative space",
  },
  {
    id: "flat_illustration",
    label: "Flat Illustration",
    prompt: "modern flat digital illustration, bold graphic style, simple vector characters",
  },
  {
    id: "vector_art",
    label: "Vector Art",
    prompt: "clean vector art, sharp lines, scalable vector graphic look",
  },
  {
    id: "digital_painting",
    label: "Digital Painting",
    prompt: "beautiful digital painting, detailed brush strokes, artistic concept art style",
  },
  {
    id: "futuristic",
    label: "Futuristic",
    prompt: "futuristic tech concept, neon accents, cyber design elements, high tech atmosphere",
  },
  {
    id: "modern_startup",
    label: "Modern Startup",
    prompt: "modern tech startup vibe, vibrant color palette, dynamic creative workspace energy",
  },
  {
    id: "dark_theme",
    label: "Dark Theme",
    prompt: "dark mode color grading, deep shadows, subtle neon glowing lights, sleek dark style",
  },
];

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: 0,
    cadence: "forever",
    description: "Everything you need to start posting consistently.",
    features: [
      `${FREE_WEEKLY_LIMIT} AI-generated posts per week`,
      "Direct LinkedIn publishing (if connected)",
      "Manual Profile generation mode",
      "Pexels image auto-selection",
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
      "AI cover images (NVIDIA FLUX)",
      "Custom image upload & styling",
      "Post scheduling & auto-publish",
      "Blog, YouTube & PDF import",
      "Priority generation support",
    ],
    cta: "Start Pro",
    ctaHref: "/sign-up",
    highlighted: true,
  },
} as const;
