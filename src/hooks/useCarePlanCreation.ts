import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CarePlanCreationData {
  client_id: string;
  status: string;
  care_plan_id?: string;
  [key: string]: any;
}

export const useCarePlanCreation = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createCarePlan = async (data: CarePlanCreationData) => {
    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('client_care_plans')
        .update({ 
          status: data.status,
          finalized_at: new Date().toISOString(),
          finalized_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', data.care_plan_id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error finalizing care plan:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createCarePlan,
    isCreating
  };
};