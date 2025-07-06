-- Fix client message participants to use auth user IDs instead of database IDs
SELECT * FROM public.fix_message_participants_user_ids();