-- Fix notifications type constraint to allow 'message' type
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint that includes 'message' type
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('booking', 'task', 'appointment', 'document', 'system', 'staff', 'client', 'medication', 'rota', 'message'));