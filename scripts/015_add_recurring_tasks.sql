-- Add recurring tasks support
-- This allows users to define "default" tasks that auto-populate on future days

-- Add is_recurring column to tasks table
ALTER TABLE public.tasks
ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for querying recurring tasks
CREATE INDEX idx_tasks_user_recurring ON public.tasks(user_id, is_recurring) WHERE is_recurring = TRUE;

-- Add template_task_id to link daily instances to their recurring template
ALTER TABLE public.tasks
ADD COLUMN template_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

CREATE INDEX idx_tasks_template ON public.tasks(template_task_id);

-- Comments for clarity
COMMENT ON COLUMN public.tasks.is_recurring IS 'Marks this task as a recurring template that should auto-populate on future days';
COMMENT ON COLUMN public.tasks.template_task_id IS 'References the recurring template task that generated this daily instance';
