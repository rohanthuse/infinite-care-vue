
export interface TravelRecord {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number; // in minutes
  purpose: string;
  vehicleType: VehicleType;
  costPerMile: number;
  totalCost: number;
  notes?: string;
  status: TravelStatus;
  createdBy: string;
  clientName?: string;
  carerId?: string;
  carerName?: string;
  receiptImage?: string;
}

export type VehicleType = 
  | 'car_personal'
  | 'car_company'
  | 'public_transport'
  | 'taxi'
  | 'bicycle'
  | 'walking'
  | 'other';

export type TravelStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'reimbursed';

export const vehicleTypeLabels: Record<VehicleType, string> = {
  car_personal: 'Personal Car',
  car_company: 'Company Car',
  public_transport: 'Public Transport',
  taxi: 'Taxi',
  bicycle: 'Bicycle',
  walking: 'Walking',
  other: 'Other'
};

export const travelStatusLabels: Record<TravelStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  reimbursed: 'Reimbursed'
};

export interface TravelFilter {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  vehicleTypes: VehicleType[];
  status: TravelStatus[];
  minDistance?: number;
  maxDistance?: number;
  minCost?: number;
  maxCost?: number;
  carerIds?: string[];
  clientNames?: string[];
}
