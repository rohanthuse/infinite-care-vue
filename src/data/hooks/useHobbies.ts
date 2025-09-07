import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Hobby {
  id: string;
  title: string;
  status: string;
}

async function fetchHobbies() {
  const { data, error } = await supabase
    .from("hobbies")
    .select("id, title, status")
    .eq("status", "active")
    .order("title");
  
  if (error) throw error;
  return data || [];
}

export function useHobbies() {
  return useQuery({
    queryKey: ["hobbies"],
    queryFn: fetchHobbies,
  });
}