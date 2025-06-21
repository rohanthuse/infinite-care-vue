
import React from "react";
import { useParams } from "react-router-dom";
import AccountingTab from "@/components/accounting/AccountingTab";

const Accounting = () => {
  const { id, name } = useParams<{ id: string; name: string }>();
  
  return (
    <div className="p-6 pt-24 md:pt-6 md:ml-64 lg:ml-64 min-h-screen bg-gray-50">
      <AccountingTab branchId={id} branchName={decodeURIComponent(name || "")} />
    </div>
  );
};

export default Accounting;
