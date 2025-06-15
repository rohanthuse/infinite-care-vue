
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Carers = staff table with branch_id
export interface CarerDB {
  id: string;
  first_name: string;
  last_name: string;
  branch_id: string | null;
}

export async function fetchBranchCarers(branchId?: string) {
  if (!branchId) return [];
  const { data, error } = await supabase
    .from("staff")
    .select("id, first_name, last_name, branch_id")
    .eq("branch_id", branchId)
    .order("first_name", {ascending: true});

  if (error) throw error;
  return data || [];
}

export function useBranchCarers(branchId?: string) {
  return useQuery({
    queryKey: ["branch-carers", branchId],
    queryFn: () => fetchBranchCarers(branchId),
    enabled: !!branchId,
  });
}
