import { useQuery } from '@tanstack/react-query';

export interface Authority {
  id: string;
  name: string;
  code: string;
  contact_email?: string;
  contact_phone?: string;
  billing_address?: any;
  default_credit_period_days: number;
  contract_reference?: string;
  status: string;
}

// Mock authorities data until database table is fully set up
const mockAuthorities: Authority[] = [
  {
    id: 'auth-001',
    name: 'Adult Social Care Authority',
    code: 'ASC-001',
    contact_email: 'billing@asc.gov.uk',
    contact_phone: '0300 123 4567',
    default_credit_period_days: 14,
    status: 'active'
  },
  {
    id: 'auth-002', 
    name: 'NHS Continuing Healthcare',
    code: 'NHS-CHC',
    contact_email: 'payments@nhs.uk',
    contact_phone: '0300 311 2233',
    default_credit_period_days: 14,
    status: 'active'
  },
  {
    id: 'auth-003',
    name: 'Independent Living Fund',
    code: 'ILF-001',
    contact_email: 'finance@ilf.org.uk', 
    contact_phone: '0300 020 0137',
    default_credit_period_days: 21,
    status: 'active'
  }
];

// Fetch all authorities
export const useAuthorities = () => {
  return useQuery({
    queryKey: ['authorities'],
    queryFn: async () => {
      // Return mock data for now
      return mockAuthorities.filter(auth => auth.status === 'active');
    },
  });
};

// Fetch authorities for billing (used in dropdowns)
export const useAuthoritiesForBilling = () => {
  return useQuery({
    queryKey: ['authorities-billing'],
    queryFn: async () => {
      return mockAuthorities
        .filter(auth => auth.status === 'active')
        .map(auth => ({
          id: auth.id,
          name: auth.name,
          code: auth.code,
          default_credit_period_days: auth.default_credit_period_days
        }));
    },
  });
};