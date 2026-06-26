import type { LengthId, PlanId, ToneId } from "@/lib/constants";

export type ExperienceEntry = {
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
};

export type Profile = {
  id: string; // Clerk user id (PK)
  email: string;
  full_name: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ManualProfile = {
  full_name: string;
  role: string;
  industry: string;
  interests: string;
  tone: string;
  target_audience: string;
  cta_style: string;
};

export type UserPreferences = {
  user_id: string;
  headline: string | null;
  about: string | null;
  industry: string | null;
  skills: string[] | null;
  experience: ExperienceEntry[] | null;
  target_audience: string | null;
  writing_goal: string | null;
  writing_tone: ToneId;
  preferred_post_length: LengthId;
  brand_voice: string | null;
  use_emojis: boolean;
  cta_style: string;
  hashtag_style: string;
  // LinkedIn OAuth (Pro plan)
  linkedin_access_token: string | null;
  linkedin_refresh_token: string | null;
  linkedin_person_urn: string | null;
  linkedin_name: string | null;
  recent_activity: string | null;
  // Workflow fields
  onboarding_status: "pending" | "completed" | "skipped";
  linkedin_connected: boolean;
  manual_profile: ManualProfile | null;
  brand_brain_id: string | null;
  weekly_usage: number;
  current_plan: "free" | "pro";
  created_at: string;
  updated_at: string;
};

/** Source types accepted by the Brand Profile Analyzer */
export type BrandSourceType =
  | "linkedin_url"
  | "resume_pdf"
  | "website"
  | "portfolio";

export interface BrandSource {
  type: BrandSourceType;
  value: string; // URL or extracted text
}

/** Enriched brand profile created by multi-source analysis */
export interface BrandProfile {
  headline: string | null;
  about: string | null;
  industry: string | null;
  skills: string[];
  experience: ExperienceEntry[];
  target_audience: string | null;
  writing_goal: string | null;
  brand_voice: string | null;
  interests: string[];
  tone_suggestion: ToneId;
  sources_used: BrandSourceType[];
}

/** Complete persistent Brand Brain stored in Firestore */
export interface BrandBrain {
  user_id: string;
  name: string | null;
  email: string | null;
  profile_picture: string | null;
  linkedin_urn: string | null;
  connection_status: "connected" | "disconnected";
  linkedin_url: string | null;
  headline: string | null;
  bio: string | null;
  industry: string | null;
  skills: string[];
  experience: ExperienceEntry[];
  featured: string | null;
  recent_posts: string | null;

  // Synthesized Brand Brain fields
  expertise: string[];
  writing_tone: string;
  audience: string | null;
  cta_style: string;
  emoji_style: string;
  content_pillars: string[];
  favorite_topics: string[];
  personal_story: string | null;
  recent_activity: string | null;
  keywords: string[];

  created_at: string;
  updated_at: string;
}

export type Usage = {
  user_id: string;
  plan: PlanId;
  week_start: string;
  posts_generated: number;
  remaining_posts: number;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  user_id: string;
  dodo_customer_id: string | null;
  subscription_id: string | null;
  status: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type GeneratedPost = {
  id: string;
  user_id: string;
  title: string;
  hook: string;
  content: string;
  cta: string;
  hashtags: string[];
  tone: ToneId;
  length: LengthId;
  topic: string | null;
  source_url: string | null;
  engagement_score: number | null;
  best_time_to_post: string | null;
  estimated_reading_time: string | null;
  cover_image_url: string | null;
  image_prompt?: string | null;
  image_model?: string | null;
  image_created_at?: string | null;
  image_updated_at?: string | null;
  image_status?: "processing" | "done" | "failed" | null;
  image_dimensions?: string | null;
  image_seed?: string | null;
  cloudinary_public_id?: string | null;
  image_width?: number | null;
  image_height?: number | null;
  image_generation_time_ms?: number | null;
  image_version?: string | null;
  is_favorite: boolean;
  is_pinned: boolean;
  is_archived: boolean;

  // Scheduling and Publishing fields
  scheduled_at?: string | null;
  is_scheduled?: boolean | null;
  published_at?: string | null;
  is_published?: boolean | null;
  linkedin_share_urn?: string | null;

  // Pexels attribution
  pexels_photographer?: string | null;
  pexels_photographer_url?: string | null;

  created_at: string;
  updated_at: string;
};

export type GeneratedContentPackage = {
  title: string;
  hook: string;
  content: string;
  cta: string;
  hashtags: string[];
  engagement_score: number;
  best_time_to_post: string;
  estimated_reading_time: string;
};
