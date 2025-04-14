
import React from "react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface ActionsListProps {
  actions: Array<{ id: string; text: string; date: Date }>;
  setActions: React.Dispatch<React.SetStateAction<Array<{ id: string; text: string; date: Date }>>>;
}

export function ActionsList({ actions, setActions }: ActionsListProps) {
  if (actions.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">No actions added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <Card key={action.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium">{action.text || "No description provided"}</p>
              <p className="text-xs text-gray-500 mt-1">Due: {format(action.date, "PPP")}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
