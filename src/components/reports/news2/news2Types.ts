
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
