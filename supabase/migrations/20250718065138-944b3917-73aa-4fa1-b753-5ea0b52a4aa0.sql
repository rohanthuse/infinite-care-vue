-- Add diastolic blood pressure support to NEWS2 observations
ALTER TABLE public.news2_observations 
ADD COLUMN diastolic_bp integer,
ADD COLUMN diastolic_bp_score integer DEFAULT 0;

-- Update the calculate_news2_score function to accept diastolic BP parameter
CREATE OR REPLACE FUNCTION public.calculate_news2_score(
  resp_rate integer, 
  o2_sat integer, 
  supp_o2 boolean, 
  sys_bp integer, 
  dias_bp integer,  -- Add diastolic BP parameter
  pulse integer, 
  consciousness text, 
  temp numeric
)
RETURNS TABLE(
  resp_score integer, 
  o2_score integer, 
  supp_o2_score integer, 
  bp_score integer, 
  pulse_score integer, 
  consciousness_score integer, 
  temp_score integer, 
  total integer, 
  risk text
)
LANGUAGE plpgsql
AS $function$
DECLARE
  resp_score_val INTEGER := 0;
  o2_score_val INTEGER := 0;
  supp_o2_score_val INTEGER := 0;
  bp_score_val INTEGER := 0;
  pulse_score_val INTEGER := 0;
  consciousness_score_val INTEGER := 0;
  temp_score_val INTEGER := 0;
  total_score INTEGER := 0;
  risk_level TEXT := 'low';
BEGIN
  -- Respiratory Rate scoring
  IF resp_rate <= 8 THEN resp_score_val := 3;
  ELSIF resp_rate <= 11 THEN resp_score_val := 1;
  ELSIF resp_rate <= 20 THEN resp_score_val := 0;
  ELSIF resp_rate <= 24 THEN resp_score_val := 2;
  ELSE resp_score_val := 3;
  END IF;
  
  -- Oxygen Saturation scoring
  IF o2_sat <= 91 THEN o2_score_val := 3;
  ELSIF o2_sat <= 93 THEN o2_score_val := 2;
  ELSIF o2_sat <= 95 THEN o2_score_val := 1;
  ELSE o2_score_val := 0;
  END IF;
  
  -- Supplemental Oxygen scoring
  IF supp_o2 THEN supp_o2_score_val := 2;
  ELSE supp_o2_score_val := 0;
  END IF;
  
  -- Blood Pressure scoring (NEWS2 uses only systolic BP for scoring)
  IF sys_bp <= 90 THEN bp_score_val := 3;
  ELSIF sys_bp <= 100 THEN bp_score_val := 2;
  ELSIF sys_bp <= 110 THEN bp_score_val := 1;
  ELSIF sys_bp <= 219 THEN bp_score_val := 0;
  ELSE bp_score_val := 3;
  END IF;
  
  -- Pulse Rate scoring
  IF pulse <= 40 THEN pulse_score_val := 3;
  ELSIF pulse <= 50 THEN pulse_score_val := 1;
  ELSIF pulse <= 90 THEN pulse_score_val := 0;
  ELSIF pulse <= 110 THEN pulse_score_val := 1;
  ELSIF pulse <= 130 THEN pulse_score_val := 2;
  ELSE pulse_score_val := 3;
  END IF;
  
  -- Consciousness Level scoring
  CASE consciousness
    WHEN 'A' THEN consciousness_score_val := 0;
    WHEN 'V' THEN consciousness_score_val := 3;
    WHEN 'P' THEN consciousness_score_val := 3;
    WHEN 'U' THEN consciousness_score_val := 3;
    ELSE consciousness_score_val := 0;
  END CASE;
  
  -- Temperature scoring
  IF temp <= 35.0 THEN temp_score_val := 3;
  ELSIF temp <= 36.0 THEN temp_score_val := 1;
  ELSIF temp <= 38.0 THEN temp_score_val := 0;
  ELSIF temp <= 39.0 THEN temp_score_val := 1;
  ELSE temp_score_val := 2;
  END IF;
  
  -- Calculate total score
  total_score := resp_score_val + o2_score_val + supp_o2_score_val + bp_score_val + 
                 pulse_score_val + consciousness_score_val + temp_score_val;
  
  -- Determine risk level
  IF total_score >= 7 THEN risk_level := 'high';
  ELSIF total_score >= 5 THEN risk_level := 'medium';
  ELSE risk_level := 'low';
  END IF;
  
  -- Return calculated values
  RETURN QUERY SELECT 
    resp_score_val, o2_score_val, supp_o2_score_val, bp_score_val,
    pulse_score_val, consciousness_score_val, temp_score_val,
    total_score, risk_level;
END;
$function$;

-- Update the auto_calculate_news2_scores trigger function
CREATE OR REPLACE FUNCTION public.auto_calculate_news2_scores()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  score_result RECORD;
BEGIN
  -- Calculate scores using the updated function
  SELECT * INTO score_result FROM public.calculate_news2_score(
    NEW.respiratory_rate,
    NEW.oxygen_saturation,
    NEW.supplemental_oxygen,
    NEW.systolic_bp,
    COALESCE(NEW.diastolic_bp, 0), -- Default to 0 if null
    NEW.pulse_rate,
    NEW.consciousness_level,
    NEW.temperature
  );
  
  -- Update the NEW record with calculated scores
  NEW.respiratory_rate_score := score_result.resp_score;
  NEW.oxygen_saturation_score := score_result.o2_score;
  NEW.supplemental_oxygen_score := score_result.supp_o2_score;
  NEW.systolic_bp_score := score_result.bp_score;
  NEW.diastolic_bp_score := 0; -- NEWS2 doesn't score diastolic BP, but we store it
  NEW.pulse_rate_score := score_result.pulse_score;
  NEW.consciousness_level_score := score_result.consciousness_score;
  NEW.temperature_score := score_result.temp_score;
  NEW.total_score := score_result.total;
  NEW.risk_level := score_result.risk;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$function$;