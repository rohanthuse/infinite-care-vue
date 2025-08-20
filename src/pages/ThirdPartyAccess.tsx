
import React, { useEffect } from "react";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { useParams } from "react-router-dom";
import { ThirdPartyAccessManagement } from "@/components/third-party-access/ThirdPartyAccessManagement";

const ThirdPartyAccess = () => {
  const { id, branchName } = useParams();
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  // Set page title
  useEffect(() => {
    document.title = `Third Party Access | ${decodedBranchName}`;
  }, [decodedBranchName]);

  return (
    <BranchLayout>
      <ThirdPartyAccessManagement branchId={id || ""} />
    </BranchLayout>
  );
};

export default ThirdPartyAccess;
