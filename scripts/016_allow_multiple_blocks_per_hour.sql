-- Migration 016: Allow multiple blocks per hour with different start offsets
-- This fixes the constraint to allow tasks like:
--   - hour=9, offset=0 (9:00 PM - 9:45 PM)
--   - hour=9, offset=45 (9:45 PM - 10:00 PM)
-- Both can exist in the same hour as long as start_offset differs

-- Drop the old constraint that only checked hour
ALTER TABLE public.hour_logs
DROP CONSTRAINT IF EXISTS unique_day_hour;

-- Create new constraint that includes start_offset
-- This allows multiple blocks per hour as long as they start at different minutes
ALTER TABLE public.hour_logs
ADD CONSTRAINT unique_day_hour_offset UNIQUE (day_id, hour, start_offset);

-- Note: This doesn't prevent overlapping blocks (e.g., hour=9, offset=0, duration=60 
-- and hour=9, offset=30, duration=30 would overlap). Overlap prevention should be 
-- handled at the application level or with a more complex constraint/trigger.

