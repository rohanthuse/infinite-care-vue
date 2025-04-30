
import React from "react";
import { Card } from "@/components/ui/card";

interface NotesTabProps {
  clientId: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ clientId }) => {
  return (
    <div className="space-y-6">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Client Notes</h3>
        <p className="text-gray-500">No notes have been added yet for client {clientId}.</p>
      </Card>
    </div>
  );
};
