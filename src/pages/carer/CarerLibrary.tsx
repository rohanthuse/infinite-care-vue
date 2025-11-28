import React, { useState, useEffect } from "react";
import { LibraryResourcesList } from "@/components/library/LibraryResourcesList";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { Skeleton } from "@/components/ui/skeleton";

const CarerLibrary = () => {
  const { carerProfile } = useCarerAuthSafe();
  const [branchId, setBranchId] = useState<string>("");

  // Set page title
  useEffect(() => {
    document.title = "Library Resources | Carer Dashboard";
  }, []);

  useEffect(() => {
    // Get the branch_id from carerProfile
    if (carerProfile?.id) {
      // We need to fetch the staff record to get branch_id
      import("@/integrations/supabase/client").then(({ supabase }) => {
        supabase
          .from('staff')
          .select('branch_id')
          .eq('id', carerProfile.id)
          .single()
          .then(({ data }) => {
            if (data?.branch_id) {
              setBranchId(data.branch_id);
            }
          });
      });
    }
  }, [carerProfile]);

  if (!branchId) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Library Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse and access educational and reference materials</p>
      </div>
      
      <LibraryResourcesList branchId={branchId} canDelete={false} showEngagementMetrics={false} />
    </div>
  );
};
export default CarerLibrary;