

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BranchService {
  id: string;
  name: string;
}

// Simple type for what we actually select from the database
type ServiceSelectResult = {
  id: string;
  title: string;
};

export async function fetchBranchServices(branchId?: string): Promise<BranchService[]> {
  if (!branchId) return [];
  
  const { data, error } = await supabase
    .from("services")
    .select("id, title")
    .eq("status", "Active")
    .order("title");
    
  if (error) throw error;
  
  // Type the data as what we actually selected
  const services: ServiceSelectResult[] = data ?? [];
  
  return services.map((service) => ({
    id: service.id,
    name: service.title,
  }));
}

export function useBranchServices(branchId?: string) {
  return useQuery({
    queryKey: ["branch-services", branchId],
    queryFn: () => fetchBranchServices(branchId),
    enabled: !!branchId,
  });
}

