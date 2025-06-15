
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  title: string;
}

async function fetchServices() {
  const { data, error } = await supabase
    .from("services")
    .select("id, title")
    .eq("category", "Care"); // Remove this .eq if you want all services, not just care
  if (error) throw error;
  return data || [];
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
}
