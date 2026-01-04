-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 014: Add image URLs to workout exercises
-- =============================================
-- Run this AFTER 008_create_fitness_tables.sql
-- 
-- This migration adds an image_url column to workout_exercises
-- and populates it with appropriate image URLs for each exercise

-- Add image_url column to workout_exercises table
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update exercises with image URLs
-- 
-- IMPORTANT: These are placeholder URLs. You need to replace them with actual image URLs.
-- 
-- To find images for each exercise:
-- 1. Visit https://unsplash.com/s/photos/{exercise-name}
--    Example: https://unsplash.com/s/photos/squat-exercise
-- 2. Click on an image you like
-- 3. Copy the image URL from the download button or use the format:
--    https://images.unsplash.com/photo-{photo-id}?w=400&h=400&fit=crop&auto=format
-- 
-- Alternative sources:
-- - Pixabay: https://pixabay.com/images/search/{exercise-name}/
-- - Pexels: https://www.pexels.com/search/{exercise-name}/
-- - WorkoutLabs: https://workoutlabs.com/exercise-guide/
--
-- Recommended image dimensions: 400x400px, square format works best

-- Full Body exercises
-- Bodyweight Squats - Search: "squat exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Bodyweight Squats';

-- Wall Push-ups - Search: "wall push up exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Wall Push-ups';

-- Glute Bridges - Search: "glute bridge exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Glute Bridges';

-- Standing March - Search: "marching exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Standing March';

-- Superman Hold - Search: "superman exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Superman Hold';

-- Dead Bug - Search: "dead bug exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Dead Bug';

-- Walk + Mobility exercises
-- Brisk Walk - Search: "walking exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Brisk Walk';

-- Arm Circles - Search: "arm circles exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Arm Circles';

-- Cat-Cow Stretch - Search: "cat cow stretch yoga"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Cat-Cow Stretch';

-- Hip Circles - Search: "hip mobility exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Hip Circles';

-- Shoulder Rolls - Search: "shoulder roll exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Shoulder Rolls';

-- Gentle Neck Stretches - Search: "neck stretch exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Gentle Neck Stretches';

-- Optional/light exercises
-- Stretching Routine - Search: "stretching exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Stretching Routine';

-- Light Walk - Search: "walking exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Light Walk';

-- Yoga Flow - Search: "yoga exercise"
UPDATE public.workout_exercises
SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop&auto=format'
WHERE name = 'Yoga Flow';

-- Add comment to column
COMMENT ON COLUMN public.workout_exercises.image_url IS 'URL to exercise demonstration image';

