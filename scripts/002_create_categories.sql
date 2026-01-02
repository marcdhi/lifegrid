-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 002: Categories
-- =============================================
-- Run this AFTER 001_create_users_extension.sql

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (categories are globally readable)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read categories
CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

-- Insert default categories (EXACT as specified)
INSERT INTO public.categories (name, color, sort_order) VALUES
  ('Sleep', '#2C2F4A', 1),
  ('Work', '#7A1F2B', 2),
  ('Hobbies / Projects', '#C97A2B', 3),
  ('Freelance', '#8E5EA2', 4),
  ('Exercise', '#2F7D6D', 5),
  ('Friends', '#4A90A4', 6),
  ('Relaxation & Leisure', '#6B7C85', 7),
  ('Dating / Partner', '#B56A7A', 8),
  ('Family', '#8C6D4F', 9),
  ('Productive / Chores', '#5F6A3D', 10),
  ('Travel', '#3E5C76', 11),
  ('Misc / Getting Ready', '#4B4B4B', 12)
ON CONFLICT DO NOTHING;

