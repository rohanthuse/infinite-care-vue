
-- Extend client risk assessments with Risk and Personal Risk sections

ALTER TABLE public.client_risk_assessments
  ADD COLUMN IF NOT EXISTS rag_status text,                          -- 'none' | 'low' | 'medium' | 'high' (validated in app)
  ADD COLUMN IF NOT EXISTS has_pets boolean,
  ADD COLUMN IF NOT EXISTS fall_risk text,
  ADD COLUMN IF NOT EXISTS risk_to_staff text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS adverse_weather_plan text,
  ADD COLUMN IF NOT EXISTS lives_alone boolean,
  ADD COLUMN IF NOT EXISTS rural_area boolean,
  ADD COLUMN IF NOT EXISTS cared_in_bed boolean,
  ADD COLUMN IF NOT EXISTS smoker boolean,
  ADD COLUMN IF NOT EXISTS can_call_for_assistance boolean,
  ADD COLUMN IF NOT EXISTS communication_needs text,
  ADD COLUMN IF NOT EXISTS social_support text,
  ADD COLUMN IF NOT EXISTS fallen_past_six_months boolean,
  ADD COLUMN IF NOT EXISTS has_assistance_device boolean,
  ADD COLUMN IF NOT EXISTS arrange_assistance_device boolean;
