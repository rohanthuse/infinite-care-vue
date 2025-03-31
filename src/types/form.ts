
export type FormStatus = 'completed' | 'in-progress' | 'not-started' | 'approved' | 'rejected';
export type FormCategory = 'onboarding' | 'assessment' | 'feedback' | 'medical' | 'compliance';

export interface Form {
  id: string;
  title: string;
  category: FormCategory;
  description: string;
  dueDate?: string;
  completionDate?: string;
  status: FormStatus;
  validFor?: number; // months
  assignedTo?: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  formsCompleted: number;
  formsTotal: number;
}

export interface FormCell {
  status: FormStatus;
  completionDate?: string;
  expiryDate?: string;
  lastUpdated?: string;
  comments?: string;
}

export interface FormMatrix {
  staffMembers: StaffMember[];
  forms: Form[];
  data: Record<string, Record<string, FormCell>>;
}
