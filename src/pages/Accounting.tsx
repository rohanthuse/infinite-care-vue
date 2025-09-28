
import React from "react";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import AccountingTab from "@/components/accounting/AccountingTab";

const Accounting = () => {
  console.log('[Accounting] Component rendered successfully');
  
  return (
    <BranchLayout>
      <AccountingTab />
    </BranchLayout>
  );
};

export default Accounting;
