
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  date_of_birth?: string;
  registered_on?: string;
}

export interface ClientCarePlan {
  id: string;
  title: string;
  provider_name: string;
  status: string;
  start_date: string;
  end_date?: string;
  review_date?: string;
  goals_progress?: number;
  updated_at: string;
}

export interface ClientAppointment {
  id: string;
  appointment_type: string;
  provider_name: string;
  appointment_date: string;
  appointment_time: string;
  location?: string;
  status: string;
  notes?: string;
}

export interface ClientBilling {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  invoice_date: string;
}

// Get authenticated client ID from localStorage
const getAuthenticatedClientId = (): string => {
  const clientId = localStorage.getItem("clientId");
  if (!clientId) {
    throw new Error("Client not authenticated");
  }
  return clientId;
};

const fetchClientProfile = async (): Promise<ClientProfile> => {
  const clientId = getAuthenticatedClientId();
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client profile:', error);
    throw error;
  }

  return data;
};

const fetchClientCarePlans = async (): Promise<ClientCarePlan[]> => {
  const clientId = getAuthenticatedClientId();
  
  const { data, error } = await supabase
    .from('client_care_plans')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client care plans:', error);
    throw error;
  }

  return data || [];
};

const fetchClientAppointments = async (): Promise<ClientAppointment[]> => {
  const clientId = getAuthenticatedClientId();
  
  const { data, error } = await supabase
    .from('client_appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: true });

  if (error) {
    console.error('Error fetching client appointments:', error);
    throw error;
  }

  return data || [];
};

const fetchClientBilling = async (): Promise<ClientBilling[]> => {
  const clientId = getAuthenticatedClientId();
  
  const { data, error } = await supabase
    .from('client_billing')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching client billing:', error);
    throw error;
  }

  return data || [];
};

export const useClientProfile = () => {
  return useQuery({
    queryKey: ['client-profile'],
    queryFn: fetchClientProfile,
    retry: 1,
  });
};

export const useClientCarePlans = () => {
  return useQuery({
    queryKey: ['client-care-plans'],
    queryFn: fetchClientCarePlans,
    retry: 1,
  });
};

export const useClientAppointments = () => {
  return useQuery({
    queryKey: ['client-appointments'],
    queryFn: fetchClientAppointments,
    retry: 1,
  });
};

export const useClientBilling = () => {
  return useQuery({
    queryKey: ['client-billing'],
    queryFn: fetchClientBilling,
    retry: 1,
  });
};
