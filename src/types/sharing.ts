// Sharing types and interfaces for Staff and Client profile sharing

export interface ShareableSection {
  id: string;
  label: string;
  description: string;
  isDefault: boolean;        // Selected by default
  isSensitive: boolean;      // Requires explicit selection, shows warning
  isExternallyShareable: boolean; // Can be shared externally
}

// Staff share section keys
export interface StaffShareSections {
  personalInfo: boolean;
  generalSettings: boolean;
  rateSchedules: boolean;
  availability: boolean;
  qualifications: boolean;
  documents: boolean;
  notes: boolean;
  bankDetails: boolean;
}

// Client share section keys
export interface ClientShareSections {
  personalInfo: boolean;
  generalInfo: boolean;
  carePlans: boolean;
  rates: boolean;
  invoices: boolean;
  notes: boolean;
  medicalInfo: boolean;
  emergencyContacts: boolean;
}

// Staff shareable sections configuration
export const STAFF_SHAREABLE_SECTIONS: ShareableSection[] = [
  {
    id: 'personalInfo',
    label: 'Personal Information',
    description: 'Name, contact details, and address',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
  },
  {
    id: 'generalSettings',
    label: 'General Settings',
    description: 'Contract type, pay frequency, employment details',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
  },
  {
    id: 'rateSchedules',
    label: 'Rate Schedules',
    description: 'Pay rates and billing schedules',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
  },
  {
    id: 'availability',
    label: 'Availability',
    description: 'Working hours, days, and schedule preferences',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
  },
  {
    id: 'qualifications',
    label: 'Qualifications & Training',
    description: 'Professional certifications and training records',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'DBS checks, ID documents, and certificates',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
  },
  {
    id: 'notes',
    label: 'Notes',
    description: 'Internal notes and comments',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
  },
  {
    id: 'bankDetails',
    label: 'Bank Details',
    description: 'Account information - requires consent',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
  },
];

// Client shareable sections configuration
export const CLIENT_SHAREABLE_SECTIONS: ShareableSection[] = [
  {
    id: 'personalInfo',
    label: 'Personal Information',
    description: 'Name, contact details, and address',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
  },
  {
    id: 'generalInfo',
    label: 'General Information',
    description: 'Care preferences, language, and requirements',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
  },
  {
    id: 'emergencyContacts',
    label: 'Emergency Contacts',
    description: 'Emergency contact details and next of kin',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
  },
  {
    id: 'carePlans',
    label: 'Care Plans',
    description: 'Active care plans and service actions',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
  },
  {
    id: 'rates',
    label: 'Service Rates',
    description: 'Billing rates and service charges',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
  },
  {
    id: 'notes',
    label: 'Care Notes',
    description: 'Daily notes and observations',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
  },
  {
    id: 'medicalInfo',
    label: 'Medical Information',
    description: 'Health conditions, medications, and allergies',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
  },
  {
    id: 'invoices',
    label: 'Invoices & Billing',
    description: 'Financial records and payment history',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
  },
];

// Helper to get default selections for staff
export const getDefaultStaffSections = (): StaffShareSections => ({
  personalInfo: true,
  generalSettings: true,
  rateSchedules: false,
  availability: true,
  qualifications: false,
  documents: false,
  notes: false,
  bankDetails: false,
});

// Helper to get default selections for client
export const getDefaultClientSections = (): ClientShareSections => ({
  personalInfo: true,
  generalInfo: true,
  carePlans: false,
  rates: false,
  invoices: false,
  notes: false,
  medicalInfo: false,
  emergencyContacts: true,
});
