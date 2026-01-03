-- Migration: Add duration support to hour_logs
-- This allows blocks to span variable durations instead of fixed 1-hour slots

ALTER TABLE hour_logs
ADD COLUMN duration_minutes INTEGER DEFAULT 60;

-- Update existing rows to have 60 minute duration
UPDATE hour_logs
SET duration_minutes = 60
WHERE duration_minutes IS NULL;

-- Add constraint to ensure positive duration
ALTER TABLE hour_logs
ADD CONSTRAINT duration_positive CHECK (duration_minutes > 0);

-- hour now represents the start time (0-23)
-- duration_minutes represents how long the block lasts
-- Example: hour=9, duration_minutes=90 means 9:00 AM to 10:30 AM

