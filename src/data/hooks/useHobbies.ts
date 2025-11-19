import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface Hobby {
  id: string;
  title: string;
  status: string;
  organization_id?: string;
}

async function fetchHobbies(organizationId?: string) {
  if (!organizationId) return [];
  
  const { data, error } = await supabase
    .from("hobbies")
    .select("id, title, status, organization_id")
    .eq('organization_id', organizationId)
    .in("status", ["active", "Active"])
    .order("title");
  
  if (error) throw error;
  return data || [];
}

export function useHobbies() {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ["hobbies", organization?.id],
    queryFn: () => fetchHobbies(organization?.id),
    enabled: !!organization?.id,
  });
}