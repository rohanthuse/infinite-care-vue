
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BranchService {
  id: string;
  title: string;
  description?: string;
  category: string;
  double_handed: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export async function fetchBranchServices(branchId?: string, organizationId?: string) {
  console.log("[fetchBranchServices] Fetching services for branch:", branchId, "organization:", organizationId);
  
  if (!branchId) {
    console.log("[fetchBranchServices] No branch ID provided");
    return [];
  }
  
  let query = supabase
    .from("services")
    .select("*")
    .eq("status", "active")
    .order("title", { ascending: true });

  // Filter by organization if provided
  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchBranchServices] Error fetching services:", error);
    throw error;
  }
  
  console.log("[fetchBranchServices] Successfully fetched", data?.length || 0, "services");
  return data || [];
}

export function useBranchServices(branchId?: string, organizationId?: string) {
  return useQuery({
    queryKey: ["branch-services", branchId, organizationId],
    queryFn: () => fetchBranchServices(branchId, organizationId),
    enabled: !!branchId,
  });
}
