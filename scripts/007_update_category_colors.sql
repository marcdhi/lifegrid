-- =============================================
-- LIFEGRID DATABASE SCHEMA
-- Migration 007: Update Category Colors
-- =============================================
-- Dusty, desaturated colors (Apple-like)
-- Run this to update existing category colors

UPDATE public.categories SET color = '#1E1F2E' WHERE name = 'Sleep';
UPDATE public.categories SET color = '#5C2A2A' WHERE name = 'Work';
UPDATE public.categories SET color = '#8B5A2B' WHERE name = 'Hobbies / Projects';
UPDATE public.categories SET color = '#5E4A6B' WHERE name = 'Freelance';
UPDATE public.categories SET color = '#2B4A42' WHERE name = 'Exercise';
UPDATE public.categories SET color = '#3A5A6B' WHERE name = 'Friends';
UPDATE public.categories SET color = '#3D444A' WHERE name = 'Relaxation & Leisure';
UPDATE public.categories SET color = '#6B4A52' WHERE name = 'Dating / Partner';
UPDATE public.categories SET color = '#5A4A3A' WHERE name = 'Family';
UPDATE public.categories SET color = '#4A5030' WHERE name = 'Productive / Chores';
UPDATE public.categories SET color = '#2E3D4A' WHERE name = 'Travel';
UPDATE public.categories SET color = '#2A2A2A' WHERE name = 'Misc / Getting Ready';

