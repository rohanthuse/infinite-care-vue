
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface BranchService {
  id: string;
  name: string;
}

// Use explicit Supabase type to avoid deep type inference
type ServiceFromDB = Tables<'services'>;

export async function fetchBranchServices(branchId?: string): Promise<BranchService[]> {
  if (!branchId) return [];
  
  const { data, error } = await supabase
    .from("services")
    .select("id, title")
    .eq("status", "Active")
    .order("title");
    
  if (error) throw error;
  
  // Explicitly type the data to break inference chain
  const services: ServiceFromDB[] = data ?? [];
  
  return services.map((service: ServiceFromDB) => ({
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
