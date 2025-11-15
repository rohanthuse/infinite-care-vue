import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Branch {
  id: string;
  name: string;
  country: string;
  branch_type: string;
  address: string | null;
  status: string;
}

interface BranchAdmin {
  id: string;
  email: string;
  full_name: string;
  branch_name: string | null;
  branch_id: string | null;
}

interface SuperAdminSearchResult {
  branches: Branch[];
  admins: BranchAdmin[];
  isLoading: boolean;
}

export function useSuperAdminSearch(searchTerm: string): SuperAdminSearchResult {
  const trimmedSearch = searchTerm.trim().toLowerCase();
  const enabled = trimmedSearch.length >= 2;

  // Search branches
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['super-admin-search-branches', trimmedSearch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, country, branch_type, address, status')
        .or(`name.ilike.%${trimmedSearch}%,country.ilike.%${trimmedSearch}%,branch_type.ilike.%${trimmedSearch}%,address.ilike.%${trimmedSearch}%`)
        .eq('status', 'active')
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error searching branches:', error);
        return [];
      }

      return data as Branch[];
    },
    enabled,
  });

  // Search branch admins
  const { data: admins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['super-admin-search-admins', trimmedSearch],
    queryFn: async () => {
      // Query profiles with admin_branches join to get branch admins
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          admin_branches!inner (
            branch_id,
            branches (
              name
            )
          )
        `)
        .or(`email.ilike.%${trimmedSearch}%,first_name.ilike.%${trimmedSearch}%,last_name.ilike.%${trimmedSearch}%`)
        .order('first_name')
        .limit(10);

      if (error) {
        console.error('Error searching admins:', error);
        return [];
      }

      // Transform the data to match our interface
      const transformedAdmins = (data || []).map((admin: any) => {
        const branchData = admin.admin_branches?.[0];
        return {
          id: admin.id,
          email: admin.email || '',
          full_name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Unknown',
          branch_name: branchData?.branches?.name || null,
          branch_id: branchData?.branch_id || null,
        };
      });

      return transformedAdmins as BranchAdmin[];
    },
    enabled,
  });

  return {
    branches,
    admins,
    isLoading: branchesLoading || adminsLoading,
  };
}
