
// Updated types to match the real database structure
export interface News2Patient {
  id: string;
  name: string;
  age: number | string;
  latestScore: number;
  lastUpdated: string;
  trend: string;
  riskLevel: 'low' | 'medium' | 'high';
  observations?: News2Observation[];
  // Raw database record
  _raw?: {
    id: string;
    client_id: string;
    branch_id: string;
    assigned_carer_id?: string;
    risk_category: string;
    monitoring_frequency: string;
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
    client?: {
      id: string;
      first_name: string;
      last_name: string;
      date_of_birth?: string;
    };
    latest_observation?: News2Observation;
    observation_count?: number;
  };
}

export interface News2Observation {
  id: string;
  news2_patient_id: string;
  recorded_by_staff_id: string;
  recorded_at: string;
  // Vital signs
  respiratory_rate?: number;
  oxygen_saturation?: number;
  supplemental_oxygen: boolean;
  systolic_bp?: number;
  pulse_rate?: number;
  consciousness_level: 'A' | 'V' | 'P' | 'U';
  temperature?: number;
  // Calculated scores
  respiratory_rate_score: number;
  oxygen_saturation_score: number;
  supplemental_oxygen_score: number;
  systolic_bp_score: number;
  pulse_rate_score: number;
  consciousness_level_score: number;
  temperature_score: number;
  total_score: number;
  risk_level: 'low' | 'medium' | 'high';
  // Clinical data
  clinical_notes?: string;
  action_taken?: string;
  next_review_time?: string;
  created_at: string;
  updated_at: string;
  // Related data
  recorded_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface News2Alert {
  id: string;
  news2_observation_id: string;
  news2_patient_id: string;
  alert_type: 'high_score' | 'deteriorating' | 'overdue_observation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

// Backward compatibility with existing mock data structure
export interface LegacyNews2Patient {
  id: string;
  name: string;
  age: number;
  latestScore: number;
  lastUpdated: string;
  trend: string;
  observations?: Array<{
    id: string;
    dateTime: string;
    score: number;
    vitals: {
      respiratoryRate: number;
      oxygenSaturation: number;
      systolicBP: number;
      pulse: number;
      temperature: number;
      consciousness: string;
      supplementalOxygen: boolean;
    };
  }>;
}
