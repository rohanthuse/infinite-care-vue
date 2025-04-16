
export type News2PatientTrend = "up" | "down" | "stable";

export interface News2Patient {
  id: string;
  name: string;
  age: number;
  latestScore: number;
  trend: News2PatientTrend;
  lastUpdated: string;
  observations?: News2Observation[];
}

export interface News2Observation {
  id: string;
  patientId: string;
  dateTime: string;
  respRate: number;
  spo2: number;
  systolicBP: number;
  pulse: number;
  consciousness: string;
  temperature: number;
  o2Therapy: boolean;
  score: number;
}

export interface News2AlertSettings {
  highThreshold: number;
  mediumThreshold: number;
  rapidIncreaseThreshold: number;
  notifyClinicianOnDuty: boolean;
  notifyAssignedNurse: boolean;
  notifyMedicalDirector: boolean;
  notifyRapidResponseTeam: boolean;
  useSystemNotifications: boolean;
  useEmail: boolean;
  useSMS: boolean;
  useMobileApp: boolean;
  reminderInterval: number; // minutes
  escalationTime: number; // minutes
  overrideEmail: string;
}
