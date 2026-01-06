-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 017: Friends System
-- =============================================
-- Run this AFTER 016_allow_multiple_blocks_per_hour.sql
-- 
-- This migration creates:
-- 1. Friendships table for user relationships
-- 2. User privacy settings table for controlling public data
-- 3. RLS policies for friend data access
-- 4. Indexes for performance

-- ==================
-- FRIENDSHIPS TABLE
-- ==================
-- Stores friend relationships between users
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Indexes for common queries
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_friendships_user_status ON public.friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status ON public.friendships(friend_id, status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view friendships where they are either user_id or friend_id
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can create friendships where they are the user_id
CREATE POLICY "Users can create own friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update friendships where they are the friend_id (to accept/reject)
-- or where they are the user_id (to cancel/block)
CREATE POLICY "Users can update own friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete friendships where they are the user_id
CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================
-- USER PRIVACY SETTINGS TABLE
-- ==================
-- Stores user preferences for what data is public to friends
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fitness_public BOOLEAN NOT NULL DEFAULT FALSE,
  analytics_public BOOLEAN NOT NULL DEFAULT FALSE,
  schedule_public BOOLEAN NOT NULL DEFAULT FALSE,
  grid_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_privacy_settings UNIQUE (user_id)
);

-- Index for querying public users
CREATE INDEX idx_privacy_settings_fitness_public ON public.user_privacy_settings(user_id) WHERE fitness_public = TRUE;
CREATE INDEX idx_privacy_settings_analytics_public ON public.user_privacy_settings(user_id) WHERE analytics_public = TRUE;
CREATE INDEX idx_privacy_settings_schedule_public ON public.user_privacy_settings(user_id) WHERE schedule_public = TRUE;
CREATE INDEX idx_privacy_settings_grid_public ON public.user_privacy_settings(user_id) WHERE grid_public = TRUE;

-- Enable RLS
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own privacy settings
CREATE POLICY "Users can view own privacy settings"
  ON public.user_privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view friends' privacy settings (to check what's public)
-- This allows checking if a friend has made their data public
CREATE POLICY "Users can view friends' privacy settings"
  ON public.user_privacy_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (
        (friendships.user_id = auth.uid() AND friendships.friend_id = user_privacy_settings.user_id)
        OR
        (friendships.friend_id = auth.uid() AND friendships.user_id = user_privacy_settings.user_id)
      )
      AND friendships.status = 'accepted'
    )
  );

-- Users can insert their own privacy settings
CREATE POLICY "Users can insert own privacy settings"
  ON public.user_privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own privacy settings
CREATE POLICY "Users can update own privacy settings"
  ON public.user_privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own privacy settings
CREATE POLICY "Users can delete own privacy settings"
  ON public.user_privacy_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_user_privacy_settings_updated_at
  BEFORE UPDATE ON public.user_privacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

