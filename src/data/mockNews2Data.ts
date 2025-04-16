
export interface News2Patient {
  id: string;
  name: string;
  age: number;
  clientId: string;
  conditions?: string[];
  latestScore?: number;
  latestTimestamp?: Date;
}

export interface News2Observation {
  id: string;
  patientId: string;
  timestamp: Date;
  respiratoryRate: number;
  oxygenSaturation: number;
  supplementalOxygen: boolean;
  systolicBP: number;
  pulseRate: number;
  consciousness: 'A' | 'V' | 'P' | 'U';
  temperature: number;
  score: number;
  notes?: string;
  recordedBy: string;
}

export interface AlertSettings {
  patientId: string;
  enableAlerts: boolean;
  increasedMonitoringThreshold: number;
  emergencyCareThreshold: number;
  notifyByEmail: boolean;
  notifyByPush: boolean;
  notifyByFlag: boolean;
}

// Mock data for NEWS2 patients
export const mockNews2Patients: News2Patient[] = [
  { id: "NP001", name: "Johnson, Robert", age: 68, clientId: "CL-001", latestScore: 3, latestTimestamp: new Date(2025, 3, 14, 9, 30) },
  { id: "NP002", name: "Williams, Emily", age: 75, clientId: "CL-002", latestScore: 6, latestTimestamp: new Date(2025, 3, 15, 10, 45) },
  { id: "NP003", name: "Brown, Michael", age: 82, clientId: "CL-003", latestScore: 2, latestTimestamp: new Date(2025, 3, 15, 14, 15) },
  { id: "NP004", name: "Jones, Patricia", age: 71, clientId: "CL-004", latestScore: 8, latestTimestamp: new Date(2025, 3, 15, 18, 0) },
  { id: "NP005", name: "Miller, David", age: 79, clientId: "CL-005", latestScore: 1, latestTimestamp: new Date(2025, 3, 14, 11, 20) },
  { id: "NP006", name: "Davis, Linda", age: 65, clientId: "CL-006", latestScore: 5, latestTimestamp: new Date(2025, 3, 14, 16, 30) },
  { id: "NP007", name: "Garcia, James", age: 77, clientId: "CL-007", latestScore: 0, latestTimestamp: new Date(2025, 3, 13, 9, 0) },
  { id: "NP008", name: "Wilson, Mary", age: 84, clientId: "CL-008", latestScore: 7, latestTimestamp: new Date(2025, 3, 15, 13, 10) },
  { id: "NP009", name: "Martinez, John", age: 70, clientId: "CL-009", latestScore: 4, latestTimestamp: new Date(2025, 3, 13, 14, 45) },
  { id: "NP010", name: "Anderson, Barbara", age: 73, clientId: "CL-010", latestScore: 9, latestTimestamp: new Date(2025, 3, 15, 8, 15) }
];

// Mock data for NEWS2 observations
export const mockNews2Observations: News2Observation[] = [
  { 
    id: "NO001", 
    patientId: "NP001", 
    timestamp: new Date(2025, 3, 14, 9, 30), 
    respiratoryRate: 18, 
    oxygenSaturation: 95, 
    supplementalOxygen: false,
    systolicBP: 138, 
    pulseRate: 72, 
    consciousness: 'A', 
    temperature: 37.1, 
    score: 3,
    recordedBy: "Nurse Smith"
  },
  { 
    id: "NO002", 
    patientId: "NP002", 
    timestamp: new Date(2025, 3, 15, 10, 45), 
    respiratoryRate: 23, 
    oxygenSaturation: 92, 
    supplementalOxygen: true,
    systolicBP: 145, 
    pulseRate: 88, 
    consciousness: 'A', 
    temperature: 38.4, 
    score: 6,
    recordedBy: "Dr. Johnson"
  },
  { 
    id: "NO003", 
    patientId: "NP003", 
    timestamp: new Date(2025, 3, 15, 14, 15), 
    respiratoryRate: 16, 
    oxygenSaturation: 97, 
    supplementalOxygen: false,
    systolicBP: 130, 
    pulseRate: 65, 
    consciousness: 'A', 
    temperature: 36.8, 
    score: 2,
    recordedBy: "Nurse Brown"
  },
  { 
    id: "NO004", 
    patientId: "NP004", 
    timestamp: new Date(2025, 3, 15, 18, 0), 
    respiratoryRate: 28, 
    oxygenSaturation: 88, 
    supplementalOxygen: true,
    systolicBP: 160, 
    pulseRate: 110, 
    consciousness: 'V', 
    temperature: 39.2, 
    score: 8,
    recordedBy: "Dr. Williams"
  }
];

// Mock data for alert settings
export const mockAlertSettings: AlertSettings[] = [
  {
    patientId: "NP001",
    enableAlerts: true,
    increasedMonitoringThreshold: 5,
    emergencyCareThreshold: 7,
    notifyByEmail: true,
    notifyByPush: true,
    notifyByFlag: true
  },
  {
    patientId: "NP002",
    enableAlerts: true,
    increasedMonitoringThreshold: 5,
    emergencyCareThreshold: 7,
    notifyByEmail: false,
    notifyByPush: true,
    notifyByFlag: true
  }
];

// Function to calculate NEWS2 score based on parameters
export const calculateNews2Score = (
  respiratoryRate: number,
  oxygenSaturation: number,
  supplementalOxygen: boolean,
  systolicBP: number,
  pulseRate: number,
  consciousness: 'A' | 'V' | 'P' | 'U',
  temperature: number
): number => {
  let score = 0;
  
  // Respiratory rate scoring
  if (respiratoryRate <= 8) score += 3;
  else if (respiratoryRate >= 9 && respiratoryRate <= 11) score += 1;
  else if (respiratoryRate >= 21 && respiratoryRate <= 24) score += 2;
  else if (respiratoryRate >= 25) score += 3;
  
  // Oxygen saturation scoring
  if (oxygenSaturation <= 91) score += 3;
  else if (oxygenSaturation >= 92 && oxygenSaturation <= 93) score += 2;
  else if (oxygenSaturation >= 94 && oxygenSaturation <= 95) score += 1;
  
  // Supplemental oxygen
  if (supplementalOxygen) score += 2;
  
  // Systolic blood pressure scoring
  if (systolicBP <= 90) score += 3;
  else if (systolicBP >= 91 && systolicBP <= 100) score += 2;
  else if (systolicBP >= 101 && systolicBP <= 110) score += 1;
  else if (systolicBP >= 220) score += 3;
  
  // Pulse rate scoring
  if (pulseRate <= 40) score += 3;
  else if (pulseRate >= 41 && pulseRate <= 50) score += 1;
  else if (pulseRate >= 91 && pulseRate <= 110) score += 1;
  else if (pulseRate >= 111 && pulseRate <= 130) score += 2;
  else if (pulseRate >= 131) score += 3;
  
  // Consciousness scoring
  if (consciousness === 'A') score += 0;
  else score += 3; // V, P, or U
  
  // Temperature scoring
  if (temperature <= 35.0) score += 3;
  else if (temperature >= 35.1 && temperature <= 36.0) score += 1;
  else if (temperature >= 38.1 && temperature <= 39.0) score += 1;
  else if (temperature >= 39.1) score += 2;
  
  return score;
};

// Helper function to get status color based on NEWS2 score
export const getScoreStatusColor = (score: number): string => {
  if (score >= 7) return "text-red-600 bg-red-50";
  if (score >= 5) return "text-amber-600 bg-amber-50";
  return "text-green-600 bg-green-50";
};

// Helper function to get status text based on NEWS2 score
export const getScoreStatusText = (score: number): string => {
  if (score >= 7) return "High Risk";
  if (score >= 5) return "Medium Risk";
  return "Low Risk";
};

// Generate additional observations for each patient
export const generateMockObservationsForPatient = (patientId: string): News2Observation[] => {
  const observations: News2Observation[] = [];
  const today = new Date();
  
  // Generate 5 observations in the past for this patient
  for (let i = 1; i <= 5; i++) {
    const timestamp = new Date(today);
    timestamp.setDate(timestamp.getDate() - i);
    timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const respiratoryRate = 12 + Math.floor(Math.random() * 20); // 12-32
    const oxygenSaturation = 88 + Math.floor(Math.random() * 10); // 88-98
    const supplementalOxygen = Math.random() > 0.7;
    const systolicBP = 100 + Math.floor(Math.random() * 80); // 100-180
    const pulseRate = 50 + Math.floor(Math.random() * 80); // 50-130
    const consciousness = Math.random() > 0.9 ? 'V' : 'A'; // Mostly Alert
    const temperature = 36 + Math.random() * 3; // 36-39
    
    const score = calculateNews2Score(
      respiratoryRate,
      oxygenSaturation,
      supplementalOxygen,
      systolicBP,
      pulseRate,
      consciousness,
      temperature
    );
    
    observations.push({
      id: `NO${patientId.slice(2)}${i}`,
      patientId,
      timestamp,
      respiratoryRate,
      oxygenSaturation,
      supplementalOxygen,
      systolicBP,
      pulseRate,
      consciousness,
      temperature,
      score,
      recordedBy: Math.random() > 0.5 ? "Nurse Smith" : "Dr. Johnson"
    });
  }
  
  return observations;
};
