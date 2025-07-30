-- Add new fields to staff_training_records table for enhanced training management
ALTER TABLE public.staff_training_records 
ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS time_spent_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed timestamp with time zone,
ADD COLUMN IF NOT EXISTS training_notes text,
ADD COLUMN IF NOT EXISTS reflection_notes text,
ADD COLUMN IF NOT EXISTS evidence_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS retake_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS renewal_requested_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS supervisor_comments text,
ADD COLUMN IF NOT EXISTS competency_assessment jsonb DEFAULT '{}'::jsonb;

-- Update the status enum to include new status options
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_status_extended') THEN
        CREATE TYPE training_status_extended AS ENUM (
            'not-started',
            'in-progress', 
            'completed',
            'expired',
            'paused',
            'under-review',
            'failed',
            'renewal-required'
        );
        
        -- Add new status column alongside existing one for gradual migration
        ALTER TABLE public.staff_training_records 
        ADD COLUMN status_extended training_status_extended DEFAULT 'not-started';
        
        -- Copy existing status values to new column
        UPDATE public.staff_training_records 
        SET status_extended = status::text::training_status_extended
        WHERE status::text IN ('not-started', 'in-progress', 'completed', 'expired');
    END IF;
END $$;

-- Create index for better performance on training queries
CREATE INDEX IF NOT EXISTS idx_staff_training_progress ON public.staff_training_records(staff_id, progress_percentage);
CREATE INDEX IF NOT EXISTS idx_staff_training_last_accessed ON public.staff_training_records(last_accessed);

-- Create function to update last_accessed timestamp automatically
CREATE OR REPLACE FUNCTION public.update_training_last_accessed()
RETURNS trigger AS $$
BEGIN
  IF OLD.progress_percentage IS DISTINCT FROM NEW.progress_percentage 
     OR OLD.status IS DISTINCT FROM NEW.status 
     OR OLD.training_notes IS DISTINCT FROM NEW.training_notes THEN
    NEW.last_accessed = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_accessed
DROP TRIGGER IF EXISTS trigger_update_training_last_accessed ON public.staff_training_records;
CREATE TRIGGER trigger_update_training_last_accessed
  BEFORE UPDATE ON public.staff_training_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_training_last_accessed();