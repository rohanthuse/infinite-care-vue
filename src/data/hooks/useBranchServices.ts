
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BranchService {
  id: string;
  name: string;
}

export async function fetchBranchServices(branchId?: string): Promise<BranchService[]> {
  if (!branchId) return [];
  const { data, error } = await supabase
    .from("services")
    .select("id, title")
    .eq("status", "Active")
    .order("title");
  if (error) throw error;
  return (data ?? []).map((item: any) => ({
    id: item.id,
    name: item.title,
  }));
}

export function useBranchServices(branchId?: string) {
  return useQuery({
    queryKey: ["branch-services", branchId],
    queryFn: () => fetchBranchServices(branchId),
    enabled: !!branchId,
  });
}
