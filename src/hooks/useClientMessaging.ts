
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useTenant } from "@/contexts/TenantContext";

export interface CareTeamMember {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  type: "admin" | "carer";
  email: string;
  unread: number;
}

export const useClientCareTeam = () => {
  const { clientId, branchId } = useClientAuth();
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['client-care-team', clientId, organization?.id],
    queryFn: async (): Promise<CareTeamMember[]> => {
      if (!clientId || !organization?.id) {
        console.log('[useClientCareTeam] Missing client ID or organization');
        return [];
      }

      console.log('[useClientCareTeam] Fetching care team for client:', clientId, 'org:', organization.id);

      const { data: careTeamData, error } = await supabase
        .rpc('get_client_care_team', { p_org_id: organization.id });

      if (error) {
        console.error('[useClientCareTeam] Error fetching care team:', error);
        throw error;
      }

      console.log('[useClientCareTeam] Raw care team data:', careTeamData);

      if (!careTeamData || careTeamData.length === 0) {
        console.log('[useClientCareTeam] No care team members found');
        return [];
      }

      // Transform the data into the expected format
      const careTeam: CareTeamMember[] = careTeamData.map((member: any) => {
        const initials = member.user_name
          ?.split(' ')
          .map((n: string) => n.charAt(0))
          .join('')
          .substring(0, 2)
          .toUpperCase() || '??';

        return {
          id: member.user_id, // This is now the auth_user_id
          name: member.user_name || 'Team Member',
          avatar: initials,
          status: "offline" as const, // Default status - could be enhanced with real presence
          type: member.user_type as "admin" | "carer",
          email: member.email || '',
          unread: 0 // Default - could be enhanced with actual unread counts
        };
      });

      console.log('[useClientCareTeam] Processed care team:', careTeam);
      return careTeam;
    },
    enabled: !!clientId && !!organization?.id,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};
