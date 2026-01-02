-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 006: Travel Tracking
-- =============================================
-- Run this AFTER 005_create_food_and_media.sql

CREATE TABLE IF NOT EXISTS public.travel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_travel_user_id ON public.travel(user_id);
CREATE INDEX idx_travel_start_date ON public.travel(start_date);
CREATE INDEX idx_travel_end_date ON public.travel(end_date);

-- Enable RLS
ALTER TABLE public.travel ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own travel"
  ON public.travel FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel"
  ON public.travel FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own travel"
  ON public.travel FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own travel"
  ON public.travel FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_travel_updated_at
  BEFORE UPDATE ON public.travel
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

