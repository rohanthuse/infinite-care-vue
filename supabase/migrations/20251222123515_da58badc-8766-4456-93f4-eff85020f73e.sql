-- Create medical_categories table for tenants
CREATE TABLE IF NOT EXISTS medical_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source_system_id UUID REFERENCES system_medical_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on medical_categories
ALTER TABLE medical_categories ENABLE ROW LEVEL SECURITY;

-- Create medical_conditions table for tenants
CREATE TABLE IF NOT EXISTS medical_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES medical_categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source_system_id UUID REFERENCES system_medical_conditions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on medical_conditions
ALTER TABLE medical_conditions ENABLE ROW LEVEL SECURITY;

-- RLS policies for medical_categories
CREATE POLICY "tenant_medical_categories_select" ON medical_categories FOR SELECT
USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tenant_medical_categories_insert" ON medical_categories FOR INSERT
WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tenant_medical_categories_update" ON medical_categories FOR UPDATE
USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tenant_medical_categories_delete" ON medical_categories FOR DELETE
USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS policies for medical_conditions
CREATE POLICY "tenant_medical_conditions_select" ON medical_conditions FOR SELECT
USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tenant_medical_conditions_insert" ON medical_conditions FOR INSERT
WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tenant_medical_conditions_update" ON medical_conditions FOR UPDATE
USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tenant_medical_conditions_delete" ON medical_conditions FOR DELETE
USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));