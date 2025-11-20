-- Add comprehensive fields to system_tenant_agreements table

-- Agreement Details
ALTER TABLE system_tenant_agreements 
  ADD COLUMN agreement_reference text UNIQUE,
  ADD COLUMN software_service_name text DEFAULT 'MED-INFINITE ENDLESS CARE',
  ADD COLUMN start_date timestamp with time zone;

-- Parties Information - Tenant
ALTER TABLE system_tenant_agreements
  ADD COLUMN tenant_address text,
  ADD COLUMN tenant_contact_person text,
  ADD COLUMN tenant_email text,
  ADD COLUMN tenant_phone text;

-- Parties Information - Provider
ALTER TABLE system_tenant_agreements
  ADD COLUMN provider_company_name text DEFAULT 'MED-INFINITE ENDLESS CARE',
  ADD COLUMN provider_address text,
  ADD COLUMN provider_contact_person text,
  ADD COLUMN provider_email text,
  ADD COLUMN provider_phone text;

-- Financial Terms
ALTER TABLE system_tenant_agreements
  ADD COLUMN subscription_plan text,
  ADD COLUMN payment_terms text,
  ADD COLUMN price_amount numeric(10,2),
  ADD COLUMN currency text DEFAULT 'GBP',
  ADD COLUMN discount_percentage numeric(5,2),
  ADD COLUMN discount_amount numeric(10,2),
  ADD COLUMN payment_mode text,
  ADD COLUMN late_payment_penalty text;

-- Service Scope
ALTER TABLE system_tenant_agreements
  ADD COLUMN services_included text,
  ADD COLUMN user_limitations text,
  ADD COLUMN support_maintenance text,
  ADD COLUMN training_onboarding text;

-- Legal Terms
ALTER TABLE system_tenant_agreements
  ADD COLUMN confidentiality_clause text,
  ADD COLUMN data_protection_privacy text,
  ADD COLUMN termination_clause text,
  ADD COLUMN liability_indemnity text,
  ADD COLUMN governing_law text DEFAULT 'United Kingdom',
  ADD COLUMN jurisdiction text DEFAULT 'England and Wales';

-- Signatures
ALTER TABLE system_tenant_agreements
  ADD COLUMN tenant_signature_date date,
  ADD COLUMN system_signature_date date,
  ADD COLUMN tenant_digital_signature text,
  ADD COLUMN system_digital_signature text;

-- Audit fields
ALTER TABLE system_tenant_agreements
  ADD COLUMN version_number integer DEFAULT 1,
  ADD COLUMN previous_version_id uuid REFERENCES system_tenant_agreements(id);

-- Add new status value 'Draft' to enum
ALTER TYPE system_tenant_agreement_status ADD VALUE IF NOT EXISTS 'Draft';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_tenant_agreements_reference ON system_tenant_agreements(agreement_reference);
CREATE INDEX IF NOT EXISTS idx_system_tenant_agreements_start_date ON system_tenant_agreements(start_date);
CREATE INDEX IF NOT EXISTS idx_system_tenant_agreements_expiry_date ON system_tenant_agreements(expiry_date);

-- Add comment
COMMENT ON TABLE system_tenant_agreements IS 'Comprehensive tenant agreements with full contract details, financial terms, legal clauses, and signatures';