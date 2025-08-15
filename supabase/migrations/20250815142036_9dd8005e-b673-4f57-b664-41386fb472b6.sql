-- Fix NULL values in auth.users table that are causing login failures
UPDATE auth.users 
SET 
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
WHERE 
  email_change IS NULL 
  OR email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR email_change_confirm_status IS NULL;