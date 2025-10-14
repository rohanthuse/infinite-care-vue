-- Create staff_contacts table for storing multiple contacts per staff member
CREATE TABLE staff_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('emergency', 'medical', 'personal', 'professional')),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for faster queries
CREATE INDEX idx_staff_contacts_staff_id ON staff_contacts(staff_id);
CREATE INDEX idx_staff_contacts_branch_id ON staff_contacts(branch_id);

-- Enable RLS
ALTER TABLE staff_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Staff can view their own contacts
CREATE POLICY "Staff can view own contacts"
ON staff_contacts FOR SELECT
USING (
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

-- RLS Policy: Admins can view contacts for staff in their branch
CREATE POLICY "Admins can view staff contacts in their branch"
ON staff_contacts FOR SELECT
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- RLS Policy: Admins can insert contacts for staff in their branch
CREATE POLICY "Admins can insert staff contacts in their branch"
ON staff_contacts FOR INSERT
WITH CHECK (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- RLS Policy: Admins can update contacts for staff in their branch
CREATE POLICY "Admins can update staff contacts in their branch"
ON staff_contacts FOR UPDATE
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- RLS Policy: Admins can delete contacts for staff in their branch
CREATE POLICY "Admins can delete staff contacts in their branch"
ON staff_contacts FOR DELETE
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_staff_contacts_updated_at
  BEFORE UPDATE ON staff_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_contacts_updated_at();