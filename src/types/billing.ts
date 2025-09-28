export interface ClientFundingInfo {
  funding_type: 'private' | 'authority';
  authority_id?: string;
  authority_name?: string;
}

export interface ClientFundingPeriod {
  id: string;
  client_id: string;
  funding_type: 'private' | 'authority';
  authority_id?: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AuthorityBillingInfo {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
}

export interface BillToSelection {
  type: 'authority' | 'private';
  entity_id: string;
  entity_name: string;
  consolidation_type?: 'single' | 'split_by_client';
}

export interface InvoiceCreationContext {
  bill_to_type: 'authority' | 'private';
  authority_id?: string;
  client_ids: string[];
  consolidation_type?: 'single' | 'split_by_client';
  bill_to_address?: any;
  service_to_address?: any;
}

export interface AuthorityInvoiceOptions {
  authority_id: string;
  consolidation_type: 'single' | 'split_by_client';
  client_ids: string[];
  start_date: string;
  end_date: string;
}

export interface EnhancedInvoiceCreationData {
  bill_to_type: 'authority' | 'private';
  authority_id?: string;
  client_id?: string;
  consolidation_type?: 'single' | 'split_by_client';
  description: string;
  amount: number;
  invoice_date: string;
  due_date: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

// Funding type labels for UI
export const fundingTypeLabels: Record<'private' | 'authority', string> = {
  private: 'Private (Self-Funded)',
  authority: 'Authority Funded'
};

// Bill-to type labels for UI
export const billToTypeLabels: Record<'private' | 'authority', string> = {
  private: 'Bill to Client',
  authority: 'Bill to Authority'
};

// Consolidation type labels for UI
export const consolidationTypeLabels: Record<'single' | 'split_by_client', string> = {
  single: 'Consolidated Invoice',
  split_by_client: 'Split by Client'
};