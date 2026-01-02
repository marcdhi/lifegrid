-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 005: Food & Media Logging
-- =============================================
-- Run this AFTER 004_create_spend_entries.sql

-- ==================
-- FOOD LOGS
-- ==================
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  tags TEXT[], -- array of tags
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_food_logs_user_id ON public.food_logs(user_id);
CREATE INDEX idx_food_logs_day_id ON public.food_logs(day_id);

-- Enable RLS
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own food logs"
  ON public.food_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs"
  ON public.food_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs"
  ON public.food_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs"
  ON public.food_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_food_logs_updated_at
  BEFORE UPDATE ON public.food_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================
-- MEDIA LOGS
-- ==================
CREATE TABLE IF NOT EXISTS public.media_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('book', 'movie', 'tv', 'podcast', 'music', 'game', 'article')),
  title TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_logs_user_id ON public.media_logs(user_id);
CREATE INDEX idx_media_logs_day_id ON public.media_logs(day_id);
CREATE INDEX idx_media_logs_type ON public.media_logs(type);

-- Enable RLS
ALTER TABLE public.media_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own media logs"
  ON public.media_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media logs"
  ON public.media_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media logs"
  ON public.media_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media logs"
  ON public.media_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_media_logs_updated_at
  BEFORE UPDATE ON public.media_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

