
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  title: string;
  code: string;
  category?: string;
  description?: string;
  double_handed?: boolean;
  status?: string;
  organization_id?: string;
}

async function fetchServices(organizationId?: string) {
  let query = supabase
    .from("services")
    .select("id, title, code, category, description, double_handed, status, organization_id")
    .eq("status", "active")
    .order("title", { ascending: true });

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function useServices(organizationId?: string) {
  return useQuery({
    queryKey: ["services", organizationId],
    queryFn: () => fetchServices(organizationId),
    enabled: !!organizationId,
  });
}
