-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 003: Days and Hour Logs (CORE)
-- =============================================
-- Run this AFTER 002_create_categories.sql

-- ==================
-- DAYS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS public.days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC(5, 2), -- optional daily weight
  highlights TEXT, -- short text
  notes TEXT, -- long text
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Indexes
CREATE INDEX idx_days_user_id ON public.days(user_id);
CREATE INDEX idx_days_date ON public.days(date);
CREATE INDEX idx_days_user_date ON public.days(user_id, date);

-- Enable RLS
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own days"
  ON public.days FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own days"
  ON public.days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own days"
  ON public.days FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own days"
  ON public.days FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger for days
CREATE TRIGGER set_days_updated_at
  BEFORE UPDATE ON public.days
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================
-- HOUR LOGS TABLE (CORE)
-- ==================
CREATE TABLE IF NOT EXISTS public.hour_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  note TEXT, -- optional note per hour
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_day_hour UNIQUE (day_id, hour)
);

-- Indexes
CREATE INDEX idx_hour_logs_user_id ON public.hour_logs(user_id);
CREATE INDEX idx_hour_logs_day_id ON public.hour_logs(day_id);
CREATE INDEX idx_hour_logs_category_id ON public.hour_logs(category_id);

-- Enable RLS
ALTER TABLE public.hour_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own hour logs"
  ON public.hour_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hour logs"
  ON public.hour_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hour logs"
  ON public.hour_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hour logs"
  ON public.hour_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger for hour_logs
CREATE TRIGGER set_hour_logs_updated_at
  BEFORE UPDATE ON public.hour_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

