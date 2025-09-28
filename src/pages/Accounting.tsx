
import React from "react";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import AccountingTab from "@/components/accounting/AccountingTab";

const Accounting = () => {
  return (
    <BranchLayout>
      <AccountingTab />
    </BranchLayout>
  );
};

export default Accounting;
