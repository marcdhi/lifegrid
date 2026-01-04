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
SET image_url = 'https://github.com/user-attachments/assets/6af9eb0d-6706-4fde-8fd2-89d419ef9bfe'
WHERE name = 'Bodyweight Squats';

-- Wall Push-ups - Search: "wall push up exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/33031f0a-4ad1-42f2-bab9-028c690cf19a'
WHERE name = 'Wall Push-ups';

-- Glute Bridges - Search: "glute bridge exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/d8fac93c-b6ab-4929-b611-df5398578d2c'
WHERE name = 'Glute Bridges';

-- Standing March - Search: "marching exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/848b63aa-b63c-4eba-a827-0d8ea25ab0d4'
WHERE name = 'Standing March';

-- Superman Hold - Search: "superman exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/ca7cc1f6-4336-41b7-b0bf-badd0584e154'
WHERE name = 'Superman Hold';

-- Dead Bug - Search: "dead bug exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/6e6a275b-43ab-47df-a038-dadbca7b2d72'
WHERE name = 'Dead Bug';

-- Walk + Mobility exercises
-- Brisk Walk - Search: "walking exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/5b9f7204-c01c-45a8-869c-a1d1c9a4e26d'
WHERE name = 'Brisk Walk';

-- Arm Circles - Search: "arm circles exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/8bbc5a97-1a49-40e5-beb8-fe2d7077c3f5'
WHERE name = 'Arm Circles';

-- Cat-Cow Stretch - Search: "cat cow stretch yoga"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/f2303e1d-be12-471d-9a63-e5399e611801'
WHERE name = 'Cat-Cow Stretch';

-- Hip Circles - Search: "hip mobility exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/a31e4521-a5f4-4bca-8759-c9713bbe9616'
WHERE name = 'Hip Circles';

-- Shoulder Rolls - Search: "shoulder roll exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/2d8133bf-aa83-4a46-80dc-ab6b54a3d8f0'
WHERE name = 'Shoulder Rolls';

-- Gentle Neck Stretches - Search: "neck stretch exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/edba278c-7478-4b96-87a5-aa28ec3f6956'
WHERE name = 'Gentle Neck Stretches';

-- Optional/light exercises
-- Stretching Routine - Search: "stretching exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/98e04bcd-e932-46ce-92c2-2d1ff19d1c8c'
WHERE name = 'Stretching Routine';

-- Light Walk - Search: "walking exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/c9cac59b-b858-4b12-a030-7c9b2db9034a'
WHERE name = 'Light Walk';

-- Yoga Flow - Search: "yoga exercise"
UPDATE public.workout_exercises
SET image_url = 'https://github.com/user-attachments/assets/c9d429c9-a711-4133-b3d6-745b9ed5bd6b'
WHERE name = 'Yoga Flow';

-- Add comment to column
COMMENT ON COLUMN public.workout_exercises.image_url IS 'URL to exercise demonstration image';

