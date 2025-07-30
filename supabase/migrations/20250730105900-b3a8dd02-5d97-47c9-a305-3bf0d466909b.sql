-- Add missing fields to client_events_logs table for enhanced event logging

-- Staff involvement fields
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS staff_present TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS staff_aware TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS other_people_present JSONB DEFAULT '[]'::jsonb;

-- Follow-up tracking fields
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_assigned_to UUID,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- Outcome and investigation fields
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS immediate_actions_taken TEXT,
ADD COLUMN IF NOT EXISTS investigation_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS investigation_assigned_to UUID,
ADD COLUMN IF NOT EXISTS expected_resolution_date DATE,
ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- File attachments
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Risk assessment fields
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low',
ADD COLUMN IF NOT EXISTS contributing_factors TEXT[],
ADD COLUMN IF NOT EXISTS environmental_factors TEXT,
ADD COLUMN IF NOT EXISTS preventable BOOLEAN;

-- Regulatory and compliance fields
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS external_reporting_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS family_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gp_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_notes TEXT;