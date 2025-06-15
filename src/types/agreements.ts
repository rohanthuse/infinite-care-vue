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
    signed_by_name: string | null;
    signed_by_client_id: string | null;
    signed_by_staff_id: string | null;
    signing_party: "client" | "staff" | "other" | null;
    signed_at: string | null;
    digital_signature: string | null;
    branch_id: string | null;
    created_at: string;
    updated_at: string;
    agreement_types: { name: string } | null;
    statusHistory?: { status: string; date: string; reason?: string; changedBy: string; }[];
};

export type AgreementPartyFilter = "all" | "client" | "staff" | "other";

export type ScheduledAgreement = {
  id: string;
  title: string;
  scheduled_for: string | null;
  scheduled_with_name: string | null;
  status: 'Upcoming' | 'Pending Approval' | 'Under Review' | 'Completed' | 'Cancelled';
  notes: string | null;
  agreement_types: { name: string } | null;
};

export type AgreementTemplate = {
  id: string;
  title: string;
  content: string | null;
  type_id: string | null;
  branch_id: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
  agreement_types: { name: string } | null;
};
