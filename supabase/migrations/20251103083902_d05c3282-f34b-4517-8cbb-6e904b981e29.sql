-- Migration: Update rate schedules to support multiple service types

-- ========================================
-- CLIENT RATE SCHEDULES
-- ========================================

-- Step 1: Add new array column for client_rate_schedules
ALTER TABLE public.client_rate_schedules 
ADD COLUMN IF NOT EXISTS service_type_codes text[] DEFAULT '{}';

-- Step 2: Migrate existing single service_type_code to array
UPDATE public.client_rate_schedules 
SET service_type_codes = CASE 
  WHEN service_type_code IS NOT NULL AND service_type_code != '' 
  THEN ARRAY[service_type_code]
  ELSE ARRAY[]::text[]
END
WHERE service_type_codes = '{}' OR service_type_codes IS NULL;

-- Step 3: Drop foreign key constraint if exists
ALTER TABLE public.client_rate_schedules 
DROP CONSTRAINT IF EXISTS client_rate_schedules_service_type_code_fkey;

-- Step 4: Drop old single service_type_code column
ALTER TABLE public.client_rate_schedules 
DROP COLUMN IF EXISTS service_type_code;

-- Step 5: Add comment for clarity
COMMENT ON COLUMN public.client_rate_schedules.service_type_codes IS 'Array of service type codes that this rate schedule applies to. Empty array means applies to all services.';

-- ========================================
-- STAFF RATE SCHEDULES
-- ========================================

-- Step 1: Add new array column for staff_rate_schedules
ALTER TABLE public.staff_rate_schedules 
ADD COLUMN IF NOT EXISTS service_type_codes text[] DEFAULT '{}';

-- Step 2: Migrate existing single service_type_code to array
UPDATE public.staff_rate_schedules 
SET service_type_codes = CASE 
  WHEN service_type_code IS NOT NULL AND service_type_code != '' 
  THEN ARRAY[service_type_code]
  ELSE ARRAY[]::text[]
END
WHERE service_type_codes = '{}' OR service_type_codes IS NULL;

-- Step 3: Drop foreign key constraint if exists
ALTER TABLE public.staff_rate_schedules 
DROP CONSTRAINT IF EXISTS staff_rate_schedules_service_type_code_fkey;

-- Step 4: Drop old single service_type_code column
ALTER TABLE public.staff_rate_schedules 
DROP COLUMN IF EXISTS service_type_code;

-- Step 5: Add comment for clarity
COMMENT ON COLUMN public.staff_rate_schedules.service_type_codes IS 'Array of service type codes that this rate schedule applies to. Empty array means applies to all services.';

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Add GIN indexes for efficient array queries
CREATE INDEX IF NOT EXISTS idx_client_rate_schedules_service_codes 
ON public.client_rate_schedules USING GIN (service_type_codes);

CREATE INDEX IF NOT EXISTS idx_staff_rate_schedules_service_codes 
ON public.staff_rate_schedules USING GIN (service_type_codes);