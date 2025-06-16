
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { useToast } from '@/components/ui/use-toast';

export interface ClientCarePlan {
  id: string;
  title: string;
  provider_name: string;
  start_date: string;
  end_date?: string;
  review_date?: string;
  goals_progress: number;
  status: string;
  goals?: ClientCarePlanGoal[];
  medications?: ClientMedication[];
  activities?: ClientActivity[];
}

export interface ClientCarePlanGoal {
  id: string;
  description: string;
  status: string;
  progress: number;
  notes?: string;
}

export interface ClientMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status: string;
}

export interface ClientActivity {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  status: string;
}

export const useClientCarePlans = () => {
  const [carePlans, setCarePlans] = useState<ClientCarePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { client } = useClient();
  const { toast } = useToast();

  const fetchCarePlans = async () => {
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      // Fetch care plans
      const { data: carePlansData, error: carePlansError } = await supabase
        .from('client_care_plans')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (carePlansError) {
        console.error('Error fetching care plans:', carePlansError);
        toast({
          title: "Error",
          description: "Failed to load care plans",
          variant: "destructive"
        });
        return;
      }

      // Fetch related data for each care plan
      const enrichedCarePlans = await Promise.all(
        (carePlansData || []).map(async (carePlan) => {
          const [goalsResult, medicationsResult, activitiesResult] = await Promise.all([
            supabase
              .from('client_care_plan_goals')
              .select('*')
              .eq('care_plan_id', carePlan.id),
            supabase
              .from('client_medications')
              .select('*')
              .eq('care_plan_id', carePlan.id),
            supabase
              .from('client_activities')
              .select('*')
              .eq('care_plan_id', carePlan.id)
          ]);

          return {
            ...carePlan,
            goals: goalsResult.data || [],
            medications: medicationsResult.data || [],
            activities: activitiesResult.data || []
          };
        })
      );

      setCarePlans(enrichedCarePlans);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarePlans();
  }, [client]);

  return {
    carePlans,
    loading,
    refetch: fetchCarePlans
  };
};
