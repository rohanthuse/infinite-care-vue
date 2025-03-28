import React from "react";

interface CarersTabProps {
  branchId?: string; // Make branchId optional
}

export const CarersTab: React.FC<CarersTabProps> = ({ branchId = "" }) => {
  // Your component implementation
  return (
    <div>
      <h2>Carers Tab for Branch: {branchId || "N/A"}</h2>
      {/* Implement the rest of your component */}
    </div>
  );
};
