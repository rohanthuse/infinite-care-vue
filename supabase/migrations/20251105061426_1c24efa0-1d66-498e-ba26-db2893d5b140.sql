-- Add expiry_date and renewal_date columns to agreements table
ALTER TABLE public.agreements 
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_agreements_expiry_date ON public.agreements(expiry_date);
CREATE INDEX IF NOT EXISTS idx_agreements_active_expiry 
ON public.agreements(status, expiry_date) 
WHERE status = 'Active';

-- Create table to track which expiry notifications have been sent
CREATE TABLE IF NOT EXISTS public.agreement_expiry_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  days_before_expiry INTEGER NOT NULL,
  notification_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_agreement_expiry_notification UNIQUE (agreement_id, days_before_expiry)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_agreement_expiry_notif_agreement 
ON public.agreement_expiry_notifications(agreement_id);

-- Enable RLS
ALTER TABLE public.agreement_expiry_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists, then create
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view expiry notifications for their branch" ON public.agreement_expiry_notifications;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- RLS Policy
CREATE POLICY "Users can view expiry notifications for their branch"
ON public.agreement_expiry_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agreements a
    WHERE a.id = agreement_id
    AND (
      a.branch_id IN (
        SELECT branch_id FROM public.system_users 
        WHERE id = auth.uid()
      )
      OR a.branch_id IS NULL
    )
  )
);

-- Update notification type constraint to include agreement_expiry and all existing types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'info', 'booking', 'medication', 'appointment', 
  'message', 'leave_request', 'incident', 'staff_check_in',
  'agreement_expiry', 'care_plan', 'demo_request', 'task', 'unassigned_booking'
));

-- Function to process expiring agreements and create notifications
CREATE OR REPLACE FUNCTION public.process_expiring_agreements()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agreement RECORD;
  v_days_before INTEGER;
  v_notification_intervals INTEGER[] := ARRAY[30, 15, 7, 3, 1];
  v_sent_count INTEGER := 0;
  v_expired_count INTEGER := 0;
  v_result JSON;
BEGIN
  -- Part 1: Update expired agreements
  UPDATE public.agreements
  SET status = 'Expired',
      updated_at = NOW()
  WHERE status = 'Active'
    AND expiry_date IS NOT NULL
    AND expiry_date < NOW()
    AND expiry_date >= NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Part 2: Send expiry warnings
  FOR v_agreement IN 
    SELECT 
      a.*,
      EXTRACT(DAY FROM (a.expiry_date - NOW()))::INTEGER as days_remaining,
      COALESCE(
        (SELECT array_agg(signer_name) 
         FROM public.agreement_signers 
         WHERE agreement_id = a.id), 
        ARRAY[a.signed_by_name]
      ) as signers
    FROM public.agreements a
    WHERE a.status = 'Active'
      AND a.expiry_date IS NOT NULL
      AND a.expiry_date > NOW()
      AND a.expiry_date <= NOW() + INTERVAL '30 days'
  LOOP
    FOREACH v_days_before IN ARRAY v_notification_intervals
    LOOP
      IF v_agreement.days_remaining <= v_days_before 
         AND v_agreement.days_remaining > (v_days_before - 1)
      THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.agreement_expiry_notifications
          WHERE agreement_id = v_agreement.id
            AND days_before_expiry = v_days_before
        ) THEN
          IF v_agreement.branch_id IS NULL THEN
            INSERT INTO public.notifications (
              user_id, branch_id, type, category, priority, 
              title, message, data
            )
            SELECT 
              su.id,
              NULL,
              'agreement_expiry',
              'warning',
              CASE 
                WHEN v_days_before <= 3 THEN 'high'
                WHEN v_days_before <= 7 THEN 'medium'
                ELSE 'low'
              END,
              'Agreement Expiring Soon',
              'Agreement "' || v_agreement.title || '" will expire in ' || v_days_before || ' day(s)',
              jsonb_build_object(
                'agreement_id', v_agreement.id,
                'agreement_title', v_agreement.title,
                'expiry_date', v_agreement.expiry_date,
                'days_remaining', v_days_before,
                'signers', v_agreement.signers
              )
            FROM public.system_users su
            WHERE su.role = 'admin'
              AND su.status = 'active';
          ELSE
            INSERT INTO public.notifications (
              user_id, branch_id, type, category, priority,
              title, message, data
            )
            SELECT 
              su.id,
              v_agreement.branch_id,
              'agreement_expiry',
              'warning',
              CASE 
                WHEN v_days_before <= 3 THEN 'high'
                WHEN v_days_before <= 7 THEN 'medium'
                ELSE 'low'
              END,
              'Agreement Expiring Soon',
              'Agreement "' || v_agreement.title || '" will expire in ' || v_days_before || ' day(s)',
              jsonb_build_object(
                'agreement_id', v_agreement.id,
                'agreement_title', v_agreement.title,
                'expiry_date', v_agreement.expiry_date,
                'days_remaining', v_days_before,
                'signers', v_agreement.signers
              )
            FROM public.system_users su
            WHERE su.branch_id = v_agreement.branch_id
              AND su.role IN ('admin', 'staff')
              AND su.status = 'active';
          END IF;
          
          INSERT INTO public.agreement_expiry_notifications (
            agreement_id, days_before_expiry
          ) VALUES (
            v_agreement.id, v_days_before
          );
          
          v_sent_count := v_sent_count + 1;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  v_result := json_build_object(
    'notifications_sent', v_sent_count,
    'agreements_expired', v_expired_count,
    'timestamp', NOW()
  );
  
  RETURN v_result;
END;
$$;