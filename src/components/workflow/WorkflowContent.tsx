
import React from "react";

export interface WorkflowContentProps {
  branchId: string;
  branchName: string;
}

export const WorkflowContent: React.FC<WorkflowContentProps> = ({ branchId, branchName }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Workflow for {branchName}</h2>
      <p>This is a placeholder for the Workflow content. Branch ID: {branchId}</p>
    </div>
  );
};
