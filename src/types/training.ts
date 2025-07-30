
export type TrainingStatus = 'completed' | 'in-progress' | 'expired' | 'not-started' | 'paused' | 'under-review' | 'failed' | 'renewal-required';
export type TrainingCategory = 'core' | 'mandatory' | 'specialized' | 'optional';

export interface Training {
  id: string;
  title: string;
  category: TrainingCategory;
  description: string;
  dueDate?: string;
  completionDate?: string;
  status: TrainingStatus;
  validFor?: number; // months
  score?: number;
  maxScore?: number;
  assignedTo?: string[];
  expiryDate?: string; // Added expiryDate property
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  trainingCompleted: number;
  trainingTotal: number;
}

export interface TrainingCell {
  status: TrainingStatus;
  completionDate?: string;
  expiryDate?: string;
  score?: number;
  maxScore?: number;
}

export interface TrainingMatrix {
  staffMembers: StaffMember[];
  trainings: Training[];
  data: Record<string, Record<string, TrainingCell>>;
}
