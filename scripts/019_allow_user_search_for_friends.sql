-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 019: Allow User Search for Friends
-- =============================================
-- Run this AFTER 017_create_friends_system.sql
-- 
-- This migration adds RLS policy to allow authenticated users
-- to search for other users by email for friend requests

-- Add policy to allow authenticated users to view other users
-- This is needed for the friend search functionality
-- Note: The existing policy "Users can view own profile" already allows
-- users to view their own data. This policy allows viewing other users.
-- When multiple SELECT policies exist, PostgreSQL uses OR logic.
CREATE POLICY "Authenticated users can search other users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Note: RLS policies control row-level access, not column-level access.
-- The application code should only select id and email when searching
-- for friends to limit what data is exposed.

