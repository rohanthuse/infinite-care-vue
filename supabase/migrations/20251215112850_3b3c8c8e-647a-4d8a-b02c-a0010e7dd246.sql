-- Make category_id nullable in medical_conditions table
ALTER TABLE public.medical_conditions 
ALTER COLUMN category_id DROP NOT NULL;