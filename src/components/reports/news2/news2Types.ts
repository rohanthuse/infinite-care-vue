
export interface News2Observation {
  id: string;
  dateTime: string;
  respRate: number;
  spo2: number;
  o2Therapy: boolean;
  systolicBP: number;
  pulse: number;
  consciousness: string;
  temperature: number;
  score: number;
}

export interface News2Patient {
  id: string;
  name: string;
  age: number;
  latestScore: number;
  trend: string;  // "up", "down", or "stable"
  lastUpdated: string;
  observations?: News2Observation[];
}

// Adding the News2AlertSettings interface that was missing
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
  reminderInterval: number;
  escalationTime: number;
  overrideEmail: string;
}

// Adding the News2PatientTrend type that was missing
export type News2PatientTrend = "up" | "down" | "stable";
