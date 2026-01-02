-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 004: Spending Tracking
-- =============================================
-- Run this AFTER 003_create_days_and_hours.sql

CREATE TABLE IF NOT EXISTS public.spend_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL, -- free-form text category
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_spend_entries_user_id ON public.spend_entries(user_id);
CREATE INDEX idx_spend_entries_day_id ON public.spend_entries(day_id);
CREATE INDEX idx_spend_entries_category ON public.spend_entries(category);

-- Enable RLS
ALTER TABLE public.spend_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own spend entries"
  ON public.spend_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spend entries"
  ON public.spend_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spend entries"
  ON public.spend_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spend entries"
  ON public.spend_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_spend_entries_updated_at
  BEFORE UPDATE ON public.spend_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

