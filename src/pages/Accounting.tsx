
import React from "react";
import { useParams } from "react-router-dom";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import AccountingTab from "@/components/accounting/AccountingTab";

const Accounting = () => {
  const { id, name } = useParams<{ id: string; name: string }>();
  
  return (
    <BranchLayout>
      <AccountingTab branchId={id} branchName={decodeURIComponent(name || "")} />
    </BranchLayout>
  );
};

export default Accounting;
