
import React from "react";

export interface KeyParametersContentProps {
  branchId: string;
  branchName: string;
}

export const keyParametersContent: React.FC<KeyParametersContentProps> = ({ branchId, branchName }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Key Parameters for {branchName}</h2>
      <p>This is a placeholder for the Key Parameters content. Branch ID: {branchId}</p>
    </div>
  );
};
