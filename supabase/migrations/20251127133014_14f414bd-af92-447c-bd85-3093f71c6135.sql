-- Deactivate the "basic" subscription plan (50 Users - £29.00/mo - £290.00/yr)
-- This plan will no longer appear in the subscription plan dropdown for tenant creation
UPDATE subscription_plans 
SET is_active = false, 
    updated_at = now()
WHERE id = '543215f5-4488-4126-b1b3-a18446f0e9f8';