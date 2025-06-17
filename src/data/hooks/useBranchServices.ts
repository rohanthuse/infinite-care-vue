
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BranchService {
  id: string;
  title: string;
  description?: string;
  category: string;
  double_handed: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchBranchServices(branchId?: string) {
  console.log("[fetchBranchServices] Fetching services for branch:", branchId);
  
  if (!branchId) {
    console.log("[fetchBranchServices] No branch ID provided");
    return [];
  }
  
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    console.error("[fetchBranchServices] Error fetching services:", error);
    throw error;
  }
  
  console.log("[fetchBranchServices] Successfully fetched", data?.length || 0, "services");
  return data || [];
}

export function useBranchServices(branchId?: string) {
  return useQuery({
    queryKey: ["branch-services", branchId],
    queryFn: () => fetchBranchServices(branchId),
    enabled: !!branchId,
  });
}
