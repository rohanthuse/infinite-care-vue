-- Fix RLS policies for annual_leave_calendar table to properly handle super admin permissions

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert annual leave" ON annual_leave_calendar;
DROP POLICY IF EXISTS "Allow authenticated users to select annual leave" ON annual_leave_calendar;
DROP POLICY IF EXISTS "Allow authenticated users to delete annual leave" ON annual_leave_calendar;

-- Create improved RLS policies for annual_leave_calendar
-- Policy for SELECT (viewing holidays)
CREATE POLICY "Users can view annual leave for their branch or if super admin" 
ON annual_leave_calendar 
FOR SELECT 
USING (
  -- Super admins can see all
  has_role(auth.uid(), 'super_admin'::app_role) OR
  -- Branch admins can see their branch holidays
  (branch_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM admin_branches ab 
    WHERE ab.branch_id = annual_leave_calendar.branch_id 
    AND ab.admin_id = auth.uid()
  )) OR
  -- Company-wide holidays (branch_id is NULL) are visible to all authenticated users
  (branch_id IS NULL)
);

-- Policy for INSERT (creating holidays)
CREATE POLICY "Users can create annual leave for their branch or if super admin" 
ON annual_leave_calendar 
FOR INSERT 
WITH CHECK (
  -- Super admins can create any holiday
  has_role(auth.uid(), 'super_admin'::app_role) OR
  -- Branch admins can create holidays for their branch
  (branch_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM admin_branches ab 
    WHERE ab.branch_id = annual_leave_calendar.branch_id 
    AND ab.admin_id = auth.uid()
  ))
);

-- Policy for UPDATE (editing holidays)
CREATE POLICY "Users can update annual leave for their branch or if super admin" 
ON annual_leave_calendar 
FOR UPDATE 
USING (
  -- Super admins can update any holiday
  has_role(auth.uid(), 'super_admin'::app_role) OR
  -- Branch admins can update holidays for their branch
  (branch_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM admin_branches ab 
    WHERE ab.branch_id = annual_leave_calendar.branch_id 
    AND ab.admin_id = auth.uid()
  ))
);

-- Policy for DELETE (removing holidays)
CREATE POLICY "Users can delete annual leave for their branch or if super admin" 
ON annual_leave_calendar 
FOR DELETE 
USING (
  -- Super admins can delete any holiday
  has_role(auth.uid(), 'super_admin'::app_role) OR
  -- Branch admins can delete holidays for their branch
  (branch_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM admin_branches ab 
    WHERE ab.branch_id = annual_leave_calendar.branch_id 
    AND ab.admin_id = auth.uid()
  ))
);