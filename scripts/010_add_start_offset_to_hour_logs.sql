-- Migration 010: Add start offset to hour logs
-- This allows blocks to start at minute precision within an hour

ALTER TABLE public.hour_logs
ADD COLUMN start_offset INTEGER DEFAULT 0 NOT NULL CHECK (start_offset >= 0 AND start_offset < 60);

-- Update RLS policies if needed (usually covered by table policies, but good to check)
-- No changes needed for existing RLS policies as they are on the table level.

