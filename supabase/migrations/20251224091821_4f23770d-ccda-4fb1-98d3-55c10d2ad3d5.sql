-- Fix case mismatch: update lowercase status values to capitalized format
UPDATE public.medical_conditions SET status = 'Active' WHERE LOWER(status) = 'active' AND status != 'Active';
UPDATE public.medical_conditions SET status = 'Inactive' WHERE LOWER(status) = 'inactive' AND status != 'Inactive';