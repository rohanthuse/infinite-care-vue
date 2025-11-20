export type SystemTenantAgreementStatus = 'Draft' | 'Active' | 'Pending' | 'Expired' | 'Terminated';

export type SystemTenantAgreementFileCategory = 'document' | 'signature' | 'template' | 'attachment';

export type PaymentTerms = 'Monthly' | 'Quarterly' | 'Yearly';

export type PaymentMode = 'Bank Transfer' | 'Credit Card' | 'Direct Debit' | 'Cheque';

export type AgreementType = 'Subscription' | 'License' | 'SLA' | 'Custom';

export interface SystemTenantAgreementType {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SystemTenantAgreementFile {
  id: string;
  agreement_id: string | null;
  template_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  file_category: SystemTenantAgreementFileCategory;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemTenantAgreementTemplate {
  id: string;
  title: string;
  content: string | null;
  type_id: string | null;
  template_file_id: string | null;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  system_tenant_agreement_types?: { name: string };
  system_tenant_agreement_files?: SystemTenantAgreementFile;
}

export interface SystemTenantAgreement {
  id: string;
  tenant_id: string;
  title: string;
  content: string | null;
  template_id: string | null;
  type_id: string | null;
  status: SystemTenantAgreementStatus;
  signed_by_tenant: string | null;
  signed_by_system: string | null;
  tenant_signature_file_id: string | null;
  system_signature_file_id: string | null;
  signed_at: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // New comprehensive fields
  agreement_reference: string | null;
  software_service_name: string | null;
  start_date: string | null;
  
  // Tenant details
  tenant_address: string | null;
  tenant_contact_person: string | null;
  tenant_email: string | null;
  tenant_phone: string | null;
  
  // Provider details
  provider_company_name: string | null;
  provider_address: string | null;
  provider_contact_person: string | null;
  provider_email: string | null;
  provider_phone: string | null;
  
  // Financial terms
  subscription_plan: string | null;
  payment_terms: string | null;
  price_amount: number | null;
  currency: string | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  payment_mode: string | null;
  late_payment_penalty: string | null;
  
  // Service scope
  services_included: string | null;
  user_limitations: string | null;
  support_maintenance: string | null;
  training_onboarding: string | null;
  
  // Legal terms
  confidentiality_clause: string | null;
  data_protection_privacy: string | null;
  termination_clause: string | null;
  liability_indemnity: string | null;
  governing_law: string | null;
  jurisdiction: string | null;
  
  // Signatures
  tenant_signature_date: string | null;
  system_signature_date: string | null;
  tenant_digital_signature: string | null;
  system_digital_signature: string | null;
  
  // Audit
  version_number: number | null;
  previous_version_id: string | null;
  
  // Relations
  organizations?: { id: string; name: string };
  system_tenant_agreement_types?: { name: string };
  system_tenant_agreement_files?: SystemTenantAgreementFile[];
  tenant_signature?: SystemTenantAgreementFile;
  system_signature?: SystemTenantAgreementFile;
}

export interface CreateSystemTenantAgreementData {
  tenant_id: string;
  title: string;
  content?: string;
  template_id?: string;
  type_id?: string;
  signed_by_tenant?: string;
  signed_by_system?: string;
  expiry_date?: string;
  renewal_date?: string;
  
  // New comprehensive fields
  agreement_reference?: string;
  software_service_name?: string;
  start_date?: string;
  status?: SystemTenantAgreementStatus;
  
  // Tenant details
  tenant_address?: string;
  tenant_contact_person?: string;
  tenant_email?: string;
  tenant_phone?: string;
  
  // Provider details
  provider_company_name?: string;
  provider_address?: string;
  provider_contact_person?: string;
  provider_email?: string;
  provider_phone?: string;
  
  // Financial terms
  subscription_plan?: string;
  payment_terms?: string;
  price_amount?: number;
  currency?: string;
  discount_percentage?: number;
  discount_amount?: number;
  payment_mode?: string;
  late_payment_penalty?: string;
  
  // Service scope
  services_included?: string;
  user_limitations?: string;
  support_maintenance?: string;
  training_onboarding?: string;
  
  // Legal terms
  confidentiality_clause?: string;
  data_protection_privacy?: string;
  termination_clause?: string;
  liability_indemnity?: string;
  governing_law?: string;
  jurisdiction?: string;
  
  // Signatures
  tenant_signature_date?: string;
  system_signature_date?: string;
  tenant_digital_signature?: string;
  system_digital_signature?: string;
}

export interface UpdateSystemTenantAgreementData {
  title?: string;
  content?: string;
  status?: SystemTenantAgreementStatus;
  signed_by_tenant?: string;
  signed_by_system?: string;
  signed_at?: string;
  expiry_date?: string;
  renewal_date?: string;
  
  // New comprehensive fields
  agreement_reference?: string;
  software_service_name?: string;
  start_date?: string;
  
  // Tenant details
  tenant_address?: string;
  tenant_contact_person?: string;
  tenant_email?: string;
  tenant_phone?: string;
  
  // Provider details
  provider_company_name?: string;
  provider_address?: string;
  provider_contact_person?: string;
  provider_email?: string;
  provider_phone?: string;
  
  // Financial terms
  subscription_plan?: string;
  payment_terms?: string;
  price_amount?: number;
  currency?: string;
  discount_percentage?: number;
  discount_amount?: number;
  payment_mode?: string;
  late_payment_penalty?: string;
  
  // Service scope
  services_included?: string;
  user_limitations?: string;
  support_maintenance?: string;
  training_onboarding?: string;
  
  // Legal terms
  confidentiality_clause?: string;
  data_protection_privacy?: string;
  termination_clause?: string;
  liability_indemnity?: string;
  governing_law?: string;
  jurisdiction?: string;
  
  // Signatures
  tenant_signature_date?: string;
  system_signature_date?: string;
  tenant_digital_signature?: string;
  system_digital_signature?: string;
}
