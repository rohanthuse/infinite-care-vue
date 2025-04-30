
import React from "react";
import { Card } from "@/components/ui/card";

interface DocumentsTabProps {
  clientId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId }) => {
  return (
    <div className="space-y-6">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Client Documents</h3>
        <p className="text-gray-500">No documents have been uploaded yet for client {clientId}.</p>
      </Card>
    </div>
  );
};
