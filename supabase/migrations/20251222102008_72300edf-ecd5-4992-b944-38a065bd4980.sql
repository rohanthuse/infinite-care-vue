-- Activate user account for ditee25@yahoo.com (Dolapo Cole)
-- User ID: a08f0990-61ef-498b-b24c-287529961a66

-- Activate the organization membership
UPDATE organization_members 
SET status = 'active', 
    updated_at = NOW()
WHERE user_id = 'a08f0990-61ef-498b-b24c-287529961a66';

-- Activate the profile
UPDATE profiles 
SET status = 'active', 
    updated_at = NOW()
WHERE id = 'a08f0990-61ef-498b-b24c-287529961a66';