
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  title: string;
  code: string;
}

async function fetchServices() {
  const { data, error } = await supabase
    .from("services")
    .select("id, title, code");
  if (error) throw error;
  return data || [];
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
}
