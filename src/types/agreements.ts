
export type AgreementType = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Agreement = {
    id: string;
    title: string;
    content: string | null;
    template_id: string | null;
    type_id: string | null;
    status: "Active" | "Pending" | "Expired" | "Terminated";
    expiry_date: string | null;
    renewal_date: string | null;
    signed_by_name: string | null;
    signed_by_client_id: string | null;
    signed_by_staff_id: string | null;
    signing_party: "client" | "staff" | "other" | null;
    signed_at: string | null;
    digital_signature: string | null;
    primary_document_id: string | null;
    signature_file_id: string | null;
    branch_id: string | null;
    created_at: string;
    updated_at: string;
    agreement_types: { name: string } | null;
    agreement_signers?: { id: string; signer_name: string; signer_type: string; signing_status?: string; signed_at?: string | null; signature_file_id?: string | null; }[];
    agreement_files?: {
      id: string;
      file_name: string;
      file_type: string;
      file_size: number;
      storage_path: string;
      file_category: 'document' | 'signature' | 'template' | 'attachment';
      created_at: string;
    }[];
    statusHistory?: { status: string; date: string; reason?: string; changedBy: string; }[];
    
    // Approval workflow fields
    approval_status?: "pending_signatures" | "pending_review" | "approved" | "rejected" | "archived";
    approved_by?: string | null;
    approved_at?: string | null;
    rejection_reason?: string | null;
    approval_notes?: string | null;
    archived_at?: string | null;
    archived_by?: string | null;
};

export type ExpiringAgreement = Agreement & {
  days_until_expiry: number;
  notification_sent: boolean;
};

export type AgreementPartyFilter = "all" | "client" | "staff" | "other";

export type ApprovalStatusFilter = "all" | "pending_review" | "approved" | "rejected" | "archived";

export type ScheduledAgreement = {
  id: string;
  title: string;
  scheduled_for: string | null;
  scheduled_with_name: string | null;
  scheduled_with_client_id: string | null;
  scheduled_with_staff_id: string | null;
  type_id: string | null;
  template_id: string | null;
  status: 'Upcoming' | 'Pending Approval' | 'Under Review' | 'Completed' | 'Cancelled';
  notes: string | null;
  attachment_file_id: string | null;
  branch_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  agreement_types: { name: string } | null;
};

export type AgreementTemplate = {
  id: string;
  title: string;
  content: string | null;
  type_id: string | null;
  template_file_id: string | null;
  branch_id: string | null;
  created_by: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
  agreement_types: { name: string } | null;
};
