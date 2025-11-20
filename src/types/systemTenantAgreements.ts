export type SystemTenantAgreementStatus = 'Active' | 'Pending' | 'Expired' | 'Terminated';

export type SystemTenantAgreementFileCategory = 'document' | 'signature' | 'template' | 'attachment';

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
}
