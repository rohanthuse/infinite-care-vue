// Sharing types and interfaces for Staff and Client profile sharing

export interface ShareableSection {
  id: string;
  label: string;
  description: string;
  isDefault: boolean;        // Selected by default
  isSensitive: boolean;      // Requires explicit selection, shows warning
  isExternallyShareable: boolean; // Can be shared externally
  category?: string;         // Category for grouping
}

export interface SectionGroup {
  id: string;
  label: string;
  icon?: string;
  sections: string[];
}

// Staff share section keys - expanded to 21 modules
export interface StaffShareSections {
  // Personal Details (4)
  personalInfo: boolean;
  communication: boolean;
  staffEmergencyContacts: boolean;
  staffHobbies: boolean;
  // Employment & Settings (5)
  generalSettings: boolean;
  employmentHistory: boolean;
  typeOfWork: boolean;
  settings: boolean;
  bankDetails: boolean;
  // Rates & Availability (2)
  rateSchedules: boolean;
  availability: boolean;
  // Qualifications & Training (4)
  qualifications: boolean;
  training: boolean;
  skills: boolean;
  supportingStatement: boolean;
  // Compliance & Records (5)
  documents: boolean;
  essentials: boolean;
  attendance: boolean;
  forms: boolean;
  meetings: boolean;
  // Notes (1)
  notes: boolean;
}

// Client share section keys - expanded to 26 modules
export interface ClientShareSections {
  // Basic Information (5)
  personalInfo: boolean;
  generalInfo: boolean;
  emergencyContacts: boolean;
  keyContacts: boolean;
  addresses: boolean;
  // Care & Medical (9)
  carePlans: boolean;
  medicalInfo: boolean;
  medications: boolean;
  news2Assessments: boolean;
  activities: boolean;
  riskAssessments: boolean;
  vaccinations: boolean;
  safeguarding: boolean;
  dietaryRequirements: boolean;
  // Appointments & Records (4)
  appointments: boolean;
  visitRecords: boolean;
  serviceReports: boolean;
  documents: boolean;
  // Financial (3)
  rates: boolean;
  invoices: boolean;
  reviews: boolean;
  // Notes & History (4)
  notes: boolean;
  hobbies: boolean;
  compliance: boolean;
  eventsLogs: boolean;
}

// Staff section groups for organized display
export const STAFF_SECTION_GROUPS: SectionGroup[] = [
  {
    id: 'personal',
    label: 'Personal Details',
    icon: '👤',
    sections: ['personalInfo', 'communication', 'staffEmergencyContacts', 'staffHobbies']
  },
  {
    id: 'employment',
    label: 'Employment & Settings',
    icon: '💼',
    sections: ['generalSettings', 'employmentHistory', 'typeOfWork', 'settings', 'bankDetails']
  },
  {
    id: 'rates',
    label: 'Rates & Availability',
    icon: '📊',
    sections: ['rateSchedules', 'availability']
  },
  {
    id: 'qualifications',
    label: 'Qualifications & Training',
    icon: '🎓',
    sections: ['qualifications', 'training', 'skills', 'supportingStatement']
  },
  {
    id: 'compliance',
    label: 'Compliance & Records',
    icon: '📋',
    sections: ['documents', 'essentials', 'attendance', 'forms', 'meetings']
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: '📝',
    sections: ['notes']
  }
];

// Client section groups for organized display
export const CLIENT_SECTION_GROUPS: SectionGroup[] = [
  {
    id: 'basic',
    label: 'Basic Information',
    icon: '📋',
    sections: ['personalInfo', 'generalInfo', 'emergencyContacts', 'keyContacts', 'addresses']
  },
  {
    id: 'care',
    label: 'Care & Medical',
    icon: '🏥',
    sections: ['carePlans', 'medicalInfo', 'medications', 'news2Assessments', 'activities', 'riskAssessments', 'vaccinations', 'safeguarding', 'dietaryRequirements']
  },
  {
    id: 'appointments',
    label: 'Appointments & Records',
    icon: '📅',
    sections: ['appointments', 'visitRecords', 'serviceReports', 'documents']
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: '💰',
    sections: ['rates', 'invoices', 'reviews']
  },
  {
    id: 'history',
    label: 'Notes & History',
    icon: '📝',
    sections: ['notes', 'hobbies', 'compliance', 'eventsLogs']
  }
];

// Staff shareable sections configuration - 21 modules
export const STAFF_SHAREABLE_SECTIONS: ShareableSection[] = [
  // Personal Details
  {
    id: 'personalInfo',
    label: 'Personal Information',
    description: 'Name, contact details, and address',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'personal',
  },
  {
    id: 'communication',
    label: 'Communication Details',
    description: 'Preferred contact methods and communication preferences',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'personal',
  },
  {
    id: 'staffEmergencyContacts',
    label: 'Emergency Contacts',
    description: 'Emergency contact details and next of kin',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'personal',
  },
  {
    id: 'staffHobbies',
    label: 'Hobbies & Interests',
    description: 'Personal hobbies and interests',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'personal',
  },
  // Employment & Settings
  {
    id: 'generalSettings',
    label: 'General Settings',
    description: 'Contract type, pay frequency, employment details',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'employment',
  },
  {
    id: 'employmentHistory',
    label: 'Employment History',
    description: 'Previous employment and work experience',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'employment',
  },
  {
    id: 'typeOfWork',
    label: 'Type of Work Preferences',
    description: 'Preferred work types and service categories',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'employment',
  },
  {
    id: 'settings',
    label: 'Settings & Preferences',
    description: 'Travel payment preferences and other settings',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'employment',
  },
  {
    id: 'bankDetails',
    label: 'Bank Details',
    description: 'Account information - requires consent',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'employment',
  },
  // Rates & Availability
  {
    id: 'rateSchedules',
    label: 'Rate Schedules',
    description: 'Pay rates and billing schedules',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'rates',
  },
  {
    id: 'availability',
    label: 'Availability',
    description: 'Working hours, days, and schedule preferences',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'rates',
  },
  // Qualifications & Training
  {
    id: 'qualifications',
    label: 'Qualifications',
    description: 'Professional certifications and qualifications',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'qualifications',
  },
  {
    id: 'training',
    label: 'Training Records',
    description: 'Completed training courses and certifications',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'qualifications',
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Professional skills and competencies',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'qualifications',
  },
  {
    id: 'supportingStatement',
    label: 'Supporting Statement',
    description: 'Personal statement and career objectives',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'qualifications',
  },
  // Compliance & Records
  {
    id: 'documents',
    label: 'Documents',
    description: 'DBS checks, ID documents, and certificates',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'compliance',
  },
  {
    id: 'essentials',
    label: 'Essentials',
    description: 'Right to work, DBS status, visa information',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'compliance',
  },
  {
    id: 'attendance',
    label: 'Attendance Records',
    description: 'Leave history and attendance summary',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'compliance',
  },
  {
    id: 'forms',
    label: 'Forms',
    description: 'Completed forms and assessments',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'compliance',
  },
  {
    id: 'meetings',
    label: 'Meetings',
    description: 'Scheduled meetings and appointments',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'compliance',
  },
  // Notes
  {
    id: 'notes',
    label: 'Notes',
    description: 'Internal notes and comments',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'notes',
  },
];

// Client shareable sections configuration - 19 modules
export const CLIENT_SHAREABLE_SECTIONS: ShareableSection[] = [
  // Basic Information
  {
    id: 'personalInfo',
    label: 'Personal Information',
    description: 'Name, contact details, and address',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'basic',
  },
  {
    id: 'generalInfo',
    label: 'General Information',
    description: 'Care preferences, language, and requirements',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'basic',
  },
  {
    id: 'emergencyContacts',
    label: 'Emergency Contacts',
    description: 'Emergency contact details and next of kin',
    isDefault: true,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'basic',
  },
  {
    id: 'keyContacts',
    label: 'Key Contacts',
    description: 'Family, GP, social worker, and other key contacts',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'basic',
  },
  {
    id: 'addresses',
    label: 'Client Addresses',
    description: 'All registered addresses for the client',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'basic',
  },
  // Care & Medical
  {
    id: 'carePlans',
    label: 'Care Plans',
    description: 'Active care plans and service actions',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'care',
  },
  {
    id: 'medicalInfo',
    label: 'Medical Information',
    description: 'Health conditions, and allergies',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'care',
  },
  {
    id: 'medications',
    label: 'Medications',
    description: 'Current medications and prescriptions',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'care',
  },
  {
    id: 'news2Assessments',
    label: 'NEWS2 Assessments',
    description: 'NEWS2 scores and clinical observations',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'care',
  },
  {
    id: 'activities',
    label: 'Activities',
    description: 'Daily activities and routines',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'care',
  },
  {
    id: 'riskAssessments',
    label: 'Risk Assessments',
    description: 'Risk assessments and mitigation strategies',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'care',
  },
  {
    id: 'vaccinations',
    label: 'Vaccinations',
    description: 'Vaccination records and immunization history',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'care',
  },
  {
    id: 'safeguarding',
    label: 'Safeguarding',
    description: 'Safeguarding risks and management plans',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'care',
  },
  {
    id: 'dietaryRequirements',
    label: 'Dietary Requirements',
    description: 'Dietary needs, allergies, and preferences',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'care',
  },
  // Appointments & Records
  {
    id: 'appointments',
    label: 'Appointments / Bookings',
    description: 'Scheduled appointments and bookings',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'appointments',
  },
  {
    id: 'visitRecords',
    label: 'Visit Records',
    description: 'Visit history and check-in/out records',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'appointments',
  },
  {
    id: 'serviceReports',
    label: 'Service Reports',
    description: 'Service delivery reports and summaries',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'appointments',
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Uploaded documents and files',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'appointments',
  },
  // Financial
  {
    id: 'rates',
    label: 'Service Rates',
    description: 'Billing rates and service charges',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'financial',
  },
  {
    id: 'invoices',
    label: 'Invoices & Billing',
    description: 'Financial records and payment history',
    isDefault: false,
    isSensitive: true,
    isExternallyShareable: false,
    category: 'financial',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    description: 'Service reviews and feedback',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'financial',
  },
  // Notes & History
  {
    id: 'notes',
    label: 'Care Notes',
    description: 'Daily notes and observations',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'history',
  },
  {
    id: 'hobbies',
    label: 'Hobbies & Preferences',
    description: 'Personal interests and preferences',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: true,
    category: 'history',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Compliance records and status',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'history',
  },
  {
    id: 'eventsLogs',
    label: 'Events Log / History',
    description: 'Activity history and event logs',
    isDefault: false,
    isSensitive: false,
    isExternallyShareable: false,
    category: 'history',
  },
];

// Helper to get default selections for staff - 21 modules
export const getDefaultStaffSections = (): StaffShareSections => ({
  // Personal Details
  personalInfo: true,
  communication: false,
  staffEmergencyContacts: false,
  staffHobbies: false,
  // Employment & Settings
  generalSettings: true,
  employmentHistory: false,
  typeOfWork: false,
  settings: false,
  bankDetails: false,
  // Rates & Availability
  rateSchedules: false,
  availability: true,
  // Qualifications & Training
  qualifications: false,
  training: false,
  skills: false,
  supportingStatement: false,
  // Compliance & Records
  documents: false,
  essentials: false,
  attendance: false,
  forms: false,
  meetings: false,
  // Notes
  notes: false,
});

// Helper to get default selections for client - 26 modules
export const getDefaultClientSections = (): ClientShareSections => ({
  // Basic Information
  personalInfo: true,
  generalInfo: true,
  emergencyContacts: true,
  keyContacts: false,
  addresses: false,
  // Care & Medical
  carePlans: false,
  medicalInfo: false,
  medications: false,
  news2Assessments: false,
  activities: false,
  riskAssessments: false,
  vaccinations: false,
  safeguarding: false,
  dietaryRequirements: false,
  // Appointments & Records
  appointments: false,
  visitRecords: false,
  serviceReports: false,
  documents: false,
  // Financial
  rates: false,
  invoices: false,
  reviews: false,
  // Notes & History
  notes: false,
  hobbies: false,
  compliance: false,
  eventsLogs: false,
});
