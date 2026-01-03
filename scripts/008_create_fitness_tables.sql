-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 008: Fitness (Food + Workout) System
-- =============================================
-- Run this AFTER 007_update_category_colors.sql
-- 
-- This migration creates:
-- 1. User fitness profile (optional onboarding data)
-- 2. Food entries (tag-based, time-aware)
-- 3. Food tags (user's global tag dictionary)
-- 4. Workout plans (beginner fitness regime)
-- 5. Workout exercises (exercise definitions)
-- 6. Workout completions (daily tracking)

-- ==================
-- USER FITNESS PROFILE
-- ==================
-- Stores optional onboarding data for personalized workout suggestions
CREATE TABLE IF NOT EXISTS public.fitness_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  age INTEGER,
  height_cm NUMERIC(5, 1),
  weight_kg NUMERIC(5, 1),
  goal TEXT CHECK (goal IN ('get_active', 'lose_weight', 'build_strength', 'stay_healthy')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_fitness_profile UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.fitness_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own fitness profile"
  ON public.fitness_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness profile"
  ON public.fitness_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness profile"
  ON public.fitness_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness profile"
  ON public.fitness_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_fitness_profiles_updated_at
  BEFORE UPDATE ON public.fitness_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================
-- FOOD TAGS
-- ==================
-- User's personal food tag dictionary for autocomplete
CREATE TABLE IF NOT EXISTS public.food_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_food_tag UNIQUE (user_id, name)
);

-- Indexes
CREATE INDEX idx_food_tags_user_id ON public.food_tags(user_id);
CREATE INDEX idx_food_tags_use_count ON public.food_tags(use_count DESC);

-- Enable RLS
ALTER TABLE public.food_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own food tags"
  ON public.food_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food tags"
  ON public.food_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food tags"
  ON public.food_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food tags"
  ON public.food_tags FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_food_tags_updated_at
  BEFORE UPDATE ON public.food_tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================
-- FOOD ENTRIES
-- ==================
-- Individual food entries with tags and time
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  food_tags TEXT[] NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_food_entries_user_id ON public.food_entries(user_id);
CREATE INDEX idx_food_entries_date ON public.food_entries(date);
CREATE INDEX idx_food_entries_user_date ON public.food_entries(user_id, date);

-- Enable RLS
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own food entries"
  ON public.food_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food entries"
  ON public.food_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food entries"
  ON public.food_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food entries"
  ON public.food_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_food_entries_updated_at
  BEFORE UPDATE ON public.food_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================
-- WORKOUT PLANS
-- ==================
-- User's weekly workout plan (can be customized)
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  workout_type TEXT NOT NULL, -- 'full_body', 'walk_mobility', 'rest', 'optional'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_day_plan UNIQUE (user_id, day_of_week)
);

-- Indexes
CREATE INDEX idx_workout_plans_user_id ON public.workout_plans(user_id);

-- Enable RLS
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workout plans"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================
-- WORKOUT EXERCISES (Global - shared definitions)
-- ==================
-- Predefined exercises for beginner workouts
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  workout_type TEXT NOT NULL, -- matches workout_plans.workout_type
  suggested_reps TEXT, -- "10-15 reps" or "30 seconds"
  suggested_sets INTEGER DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_workout_exercises_type ON public.workout_exercises(workout_type);

-- Insert default beginner exercises
INSERT INTO public.workout_exercises (name, description, workout_type, suggested_reps, suggested_sets, sort_order) VALUES
-- Full Body exercises
('Bodyweight Squats', 'Stand with feet shoulder-width apart. Lower yourself as if sitting in a chair, keeping your back straight. Return to standing.', 'full_body', '10-15 reps', 2, 1),
('Wall Push-ups', 'Place hands on a wall at shoulder height. Lower your chest toward the wall, then push back. Great for building upper body strength gently.', 'full_body', '8-12 reps', 2, 2),
('Glute Bridges', 'Lie on your back with knees bent. Lift your hips toward the ceiling, squeezing your glutes. Lower back down slowly.', 'full_body', '12-15 reps', 2, 3),
('Standing March', 'Stand tall and march in place, lifting your knees high. Keep your core engaged and arms swinging naturally.', 'full_body', '30 seconds', 2, 4),
('Superman Hold', 'Lie face down with arms extended. Lift your arms and legs slightly off the ground, hold briefly, then lower.', 'full_body', '8-10 reps', 2, 5),
('Dead Bug', 'Lie on your back with arms up and knees bent at 90°. Slowly lower opposite arm and leg, keeping your back flat.', 'full_body', '8 each side', 2, 6),

-- Walk + Mobility exercises
('Brisk Walk', 'Walk at a pace that slightly elevates your heart rate. You should be able to talk but feel a bit warm.', 'walk_mobility', '15-20 minutes', 1, 1),
('Arm Circles', 'Extend arms to the sides and make small circles, gradually increasing size. Reverse direction halfway.', 'walk_mobility', '30 seconds each', 1, 2),
('Cat-Cow Stretch', 'On hands and knees, arch your back up (cat) then dip it down (cow). Move slowly with your breath.', 'walk_mobility', '10 slow reps', 1, 3),
('Hip Circles', 'Stand on one leg (hold something for balance) and make circles with your raised knee.', 'walk_mobility', '10 each leg', 1, 4),
('Shoulder Rolls', 'Roll shoulders forward in big circles, then backward. Release any tension in your upper back.', 'walk_mobility', '10 each direction', 1, 5),
('Gentle Neck Stretches', 'Slowly tilt your head to each side, holding for a few breaths. Never force the stretch.', 'walk_mobility', '15 seconds each', 1, 6),

-- Optional/light
('Stretching Routine', 'Spend 10-15 minutes gently stretching all major muscle groups. Hold each stretch for 15-30 seconds.', 'optional', '10-15 minutes', 1, 1),
('Light Walk', 'A casual walk at a comfortable pace. Focus on enjoying the movement rather than intensity.', 'optional', '10-20 minutes', 1, 2),
('Yoga Flow', 'A gentle sequence of yoga poses. Focus on breathing and body awareness rather than difficulty.', 'optional', '15-20 minutes', 1, 3);

-- ==================
-- WORKOUT COMPLETIONS
-- ==================
-- Tracks which exercises were completed each day
CREATE TABLE IF NOT EXISTS public.workout_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  duration_minutes INTEGER, -- optional: how long it took
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_date_exercise UNIQUE (user_id, date, exercise_id)
);

-- Indexes
CREATE INDEX idx_workout_completions_user_id ON public.workout_completions(user_id);
CREATE INDEX idx_workout_completions_date ON public.workout_completions(date);
CREATE INDEX idx_workout_completions_user_date ON public.workout_completions(user_id, date);

-- Enable RLS
ALTER TABLE public.workout_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workout completions"
  ON public.workout_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout completions"
  ON public.workout_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout completions"
  ON public.workout_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout completions"
  ON public.workout_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_workout_completions_updated_at
  BEFORE UPDATE ON public.workout_completions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

