import React, { useState, useEffect } from "react";
import { LibraryResourcesList } from "@/components/library/LibraryResourcesList";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold">Library Resources</h2>
        <p className="text-gray-500 mt-1">Browse and access educational and reference materials</p>
      </div>
      
      <div className="p-4 md:p-6 max-w-full">
        <LibraryResourcesList branchId={branchId} canDelete={false} />
      </div>
    </div>
  );
};
export default CarerLibrary;