-- Create booking_alert_settings table for configurable thresholds
CREATE TABLE IF NOT EXISTS public.booking_alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  first_alert_delay_minutes integer NOT NULL DEFAULT 0,
  missed_booking_threshold_minutes integer NOT NULL DEFAULT 3,
  enable_late_start_alerts boolean NOT NULL DEFAULT true,
  enable_missed_booking_alerts boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_alert_settings
CREATE POLICY "Super admins can manage all alert settings"
ON public.booking_alert_settings FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Branch admins can view their branch alert settings"
ON public.booking_alert_settings FOR SELECT
USING (
  branch_id IN (
    SELECT ab.branch_id FROM admin_branches ab WHERE ab.admin_id = auth.uid()
  )
);

CREATE POLICY "Organization members can view org alert settings"
ON public.booking_alert_settings FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- Add late start tracking columns to bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS is_late_start boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_missed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_start_notified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS missed_notified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS late_start_minutes integer DEFAULT 0;

-- Add performance tracking columns to staff table
ALTER TABLE public.staff 
  ADD COLUMN IF NOT EXISTS late_arrival_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missed_booking_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS punctuality_score numeric DEFAULT 100;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_booking_alert_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_booking_alert_settings_updated_at ON public.booking_alert_settings;
CREATE TRIGGER update_booking_alert_settings_updated_at
BEFORE UPDATE ON public.booking_alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_booking_alert_settings_updated_at();

-- Create index for efficient querying of late/missed bookings
CREATE INDEX IF NOT EXISTS idx_bookings_late_start ON public.bookings(is_late_start) WHERE is_late_start = true;
CREATE INDEX IF NOT EXISTS idx_bookings_missed ON public.bookings(is_missed) WHERE is_missed = true;
CREATE INDEX IF NOT EXISTS idx_bookings_status_start_time ON public.bookings(status, start_time) WHERE status IN ('confirmed', 'assigned');