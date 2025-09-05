-- Add new Personal Care fields: Oral Care, Podiatry, and Personal care related Risks
ALTER TABLE public.client_personal_care 
ADD COLUMN oral_care_assist_cleaning_teeth boolean,
ADD COLUMN oral_care_assist_cleaning_dentures boolean,
ADD COLUMN oral_care_summary text,
ADD COLUMN has_podiatrist boolean,
ADD COLUMN personal_care_risks_explanation text;