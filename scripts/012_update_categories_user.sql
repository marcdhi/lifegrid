-- Add user_id to categories to support user-specific categories
ALTER TABLE public.categories
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Index for performance
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- Update RLS policies
-- First drop existing policy
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;

-- Allow viewing system categories (user_id IS NULL) AND user's own categories
CREATE POLICY "Users can view system and own categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Allow users to create their own categories
CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own categories
CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own categories
CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

