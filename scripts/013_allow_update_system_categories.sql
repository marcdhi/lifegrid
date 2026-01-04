-- Update RLS policy: Users can ONLY update their own categories, NOT system categories
-- When editing a system category, a user-specific copy will be created instead

DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;

-- Only allow users to update their own categories (user_id = auth.uid())
-- System categories (user_id IS NULL) cannot be updated
CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid());

