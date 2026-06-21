-- ─────────────────────────────────────────────────────────────
-- KontentHub — Supabase schema
-- Run in Supabase Studio → SQL Editor
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── 1. profiles ──────────────────────────────────────────────
create table if not exists public.profiles (
  id                text primary key, -- Clerk User ID
  email             text not null,
  full_name         text,
  linkedin_url      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── 2. user_preferences ──────────────────────────────────────
create table if not exists public.user_preferences (
  user_id               text primary key references public.profiles(id) on delete cascade,
  headline              text,
  about                 text,
  industry              text,
  skills                text[] default '{}',
  experience            jsonb default '[]'::jsonb,
  target_audience       text,
  writing_goal          text,
  writing_tone          text default 'professional',
  preferred_post_length text default 'medium',
  brand_voice           text,
  use_emojis            boolean default true,
  cta_style             text default 'subtle',
  hashtag_style         text default 'few',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── 3. usage ─────────────────────────────────────────────────
create table if not exists public.usage (
  user_id          text primary key references public.profiles(id) on delete cascade,
  plan             text not null default 'free' check (plan in ('free','pro')),
  week_start       timestamptz not null default now(),
  posts_generated  integer not null default 0,
  remaining_posts  integer not null default 4,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── 4. subscriptions ─────────────────────────────────────────
create table if not exists public.subscriptions (
  user_id             text primary key references public.profiles(id) on delete cascade,
  dodo_customer_id    text,
  subscription_id     text,
  status              text,
  current_period_end  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── 5. generated_posts ───────────────────────────────────────
create table if not exists public.generated_posts (
  id                     uuid primary key default gen_random_uuid(),
  user_id                text not null references public.profiles(id) on delete cascade,
  title                  text not null default '',
  hook                   text not null default '',
  content                text not null default '',
  cta                    text not null default '',
  hashtags               text[] not null default '{}',
  tone                   text not null default 'professional',
  length                 text not null default 'medium',
  topic                  text,
  source_url             text,
  engagement_score       integer,
  best_time_to_post      text,
  estimated_reading_time text,
  cover_image_url        text,
  is_favorite            boolean not null default false,
  is_pinned              boolean not null default false,
  is_archived            boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists generated_posts_user_id_idx
  on public.generated_posts (user_id, created_at desc);

-- ── updated_at trigger ───────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();

drop trigger if exists user_preferences_touch_updated_at on public.user_preferences;
create trigger user_preferences_touch_updated_at before update on public.user_preferences for each row execute function public.touch_updated_at();

drop trigger if exists usage_touch_updated_at on public.usage;
create trigger usage_touch_updated_at before update on public.usage for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at before update on public.subscriptions for each row execute function public.touch_updated_at();

drop trigger if exists generated_posts_touch_updated_at on public.generated_posts;
create trigger generated_posts_touch_updated_at before update on public.generated_posts for each row execute function public.touch_updated_at();

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.usage enable row level security;
alter table public.subscriptions enable row level security;
alter table public.generated_posts enable row level security;

-- No permissive policies = deny by default.

-- ── Storage bucket for AI cover images ───────────────────────
insert into storage.buckets (id, name, public)
values ('cover-images', 'cover-images', true)
on conflict (id) do nothing;

drop policy if exists "cover-images-public-read" on storage.objects;
create policy "cover-images-public-read"
  on storage.objects for select
  using (bucket_id = 'cover-images');

-- ── Migration for existing tables ────────────────────────────
-- Run these statements in Supabase SQL editor if your tables already exist:
-- alter table public.generated_posts add column if not exists is_favorite boolean not null default false;
-- alter table public.generated_posts add column if not exists is_pinned boolean not null default false;
-- alter table public.generated_posts add column if not exists is_archived boolean not null default false;

