
export interface ServiceRate {
  id: string;
  serviceName: string;
  serviceCode: string;
  rateType: RateType;
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  description?: string;
  applicableDays: string[];
  clientType: ClientType;
  fundingSource: FundingSource;
  status: RateStatus;
  lastUpdated: string;
  createdBy: string;
  isDefault: boolean;
}

export type RateType = 
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'per_visit'
  | 'fixed';

export type ClientType = 
  | 'private'
  | 'local_authority'
  | 'nhs'
  | 'school'
  | 'charity'
  | 'other';

export type FundingSource = 
  | 'self_funded'
  | 'local_authority'
  | 'nhs'
  | 'school'
  | 'combined'
  | 'other';

export type RateStatus = 
  | 'active'
  | 'pending'
  | 'expired'
  | 'discontinued';

export const rateTypeLabels: Record<RateType, string> = {
  hourly: 'Per Hour',
  daily: 'Per Day',
  weekly: 'Per Week',
  per_visit: 'Per Visit',
  fixed: 'Fixed Rate'
};

export const clientTypeLabels: Record<ClientType, string> = {
  private: 'Private Client',
  local_authority: 'Local Authority',
  nhs: 'NHS',
  school: 'School',
  charity: 'Charity',
  other: 'Other'
};

export const fundingSourceLabels: Record<FundingSource, string> = {
  self_funded: 'Self-Funded',
  local_authority: 'Local Authority',
  nhs: 'NHS',
  school: 'School',
  combined: 'Combined',
  other: 'Other'
};

export const rateStatusLabels: Record<RateStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
  discontinued: 'Discontinued'
};

export interface RateFilter {
  serviceNames?: string[];
  rateTypes?: RateType[];
  clientTypes?: ClientType[];
  fundingSources?: FundingSource[];
  statuses?: RateStatus[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  minAmount?: number;
  maxAmount?: number;
}
