-- Make client_id nullable to support staff-only internal meetings
ALTER TABLE public.client_appointments 
ALTER COLUMN client_id DROP NOT NULL;

-- Add check constraint for data integrity
ALTER TABLE public.client_appointments 
ADD CONSTRAINT check_valid_meeting_type 
CHECK (
  client_id IS NOT NULL 
  OR appointment_type LIKE '%Internal Meeting%'
  OR appointment_type LIKE '%Staff Meeting%'
  OR appointment_type LIKE '%Personal Meeting%'
  OR appointment_type LIKE '%Third Party Meeting%'
);

-- Create index for better query performance on staff meetings
CREATE INDEX IF NOT EXISTS idx_client_appointments_staff_meetings 
ON public.client_appointments(branch_id, appointment_type, appointment_date) 
WHERE client_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.client_appointments.client_id IS 
'Client ID for client-related appointments. NULL for staff-only internal meetings.';

-- Update RLS policies to handle NULL client_id properly

-- Allow admins to view ALL appointments including staff meetings
DROP POLICY IF EXISTS "Admins can view client appointments" ON public.client_appointments;
CREATE POLICY "Admins can view all appointments" 
ON public.client_appointments FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM admin_branches ab
    WHERE ab.admin_id = auth.uid() 
    AND ab.branch_id = client_appointments.branch_id
  )
);

-- Allow admins to create all types of appointments
DROP POLICY IF EXISTS "Admins can create client appointments" ON public.client_appointments;
CREATE POLICY "Admins can create all appointments" 
ON public.client_appointments FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM admin_branches ab
    WHERE ab.admin_id = auth.uid() 
    AND ab.branch_id = client_appointments.branch_id
  )
);

-- Allow staff to view their own internal meetings
CREATE POLICY "Staff can view their internal meetings" 
ON public.client_appointments FOR SELECT
USING (
  client_id IS NULL
  AND (
    notes ILIKE '%Staff ID: ' || auth.uid()::text || '%'
    OR appointment_type ILIKE '%Staff Meeting%'
    OR appointment_type ILIKE '%Internal Meeting%'
  )
);

-- Update client viewing policy to exclude staff meetings
DROP POLICY IF EXISTS "Clients can view their own appointments" ON public.client_appointments;
CREATE POLICY "Clients can view their appointments" 
ON public.client_appointments FOR SELECT
USING (
  client_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = client_appointments.client_id 
    AND c.auth_user_id = auth.uid()
  )
);