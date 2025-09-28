
import React from "react";
import { useParams } from "react-router-dom";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import AccountingTab from "@/components/accounting/AccountingTab";

const Accounting = () => {
  const { id, branchName } = useParams<{ id: string; branchName: string }>();
  
  return (
    <BranchLayout>
      <AccountingTab branchId={id} branchName={decodeURIComponent(branchName || "")} />
    </BranchLayout>
  );
};

export default Accounting;
