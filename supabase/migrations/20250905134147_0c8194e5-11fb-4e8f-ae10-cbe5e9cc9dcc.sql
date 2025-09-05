-- Add washing, showering, bathing fields to client_personal_care table
ALTER TABLE public.client_personal_care 
ADD COLUMN washing_showering_bathing_assistance_level text,
ADD COLUMN washing_showering_bathing_notes text,
ADD COLUMN wash_hands_face_independently boolean DEFAULT false,
ADD COLUMN wash_body_independently boolean DEFAULT false,
ADD COLUMN get_in_out_bath_shower_independently boolean DEFAULT false,
ADD COLUMN dry_self_independently boolean DEFAULT false,
ADD COLUMN prefer_bath_or_shower text,
ADD COLUMN bathing_frequency text,
ADD COLUMN specific_washing_requirements text,
ADD COLUMN skin_condition_considerations text,
ADD COLUMN mobility_aids_for_bathing text,
ADD COLUMN bathroom_safety_concerns text;