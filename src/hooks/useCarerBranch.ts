
import { useQuery } from "@tanstack/react-query";
import { useCarerContext } from "./useCarerContext";

export const useCarerBranch = () => {
  const { data: carerContext } = useCarerContext();

  return useQuery({
    queryKey: ['carer-branch', carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffProfile) {
        throw new Error('No carer context available');
      }

      console.log('[useCarerBranch] Using cached context data:', carerContext.staffProfile);
      
      // Return the staff profile data which already includes branch relationship
      return {
        ...carerContext.staffProfile,
        branches: carerContext.branchInfo,
        branch_id: carerContext.branchInfo?.id
      };
    },
    enabled: !!carerContext?.staffProfile,
    // Very fast cache since this data is already fetched by useCarerContext
    staleTime: 10 * 60 * 1000, // 10 minutes
    initialData: carerContext?.staffProfile ? {
      ...carerContext.staffProfile,
      branches: carerContext.branchInfo,
      branch_id: carerContext.branchInfo?.id
    } : undefined,
  });
};
