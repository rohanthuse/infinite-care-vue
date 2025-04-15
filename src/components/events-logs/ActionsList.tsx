
import React from "react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, TrashIcon, EditIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionsListProps {
  actions: Array<{ id: string; text: string; date: Date }>;
  setActions: React.Dispatch<React.SetStateAction<Array<{ id: string; text: string; date: Date }>>>;
}

export function ActionsList({ actions, setActions }: ActionsListProps) {
  if (actions.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
        <p className="text-gray-500 mb-2">No actions added yet</p>
        <p className="text-sm text-gray-400">Actions added to this event will appear here</p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    setActions(actions.filter(action => action.id !== id));
  };

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <Card key={action.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{action.text || "No description provided"}</p>
              <div className="mt-2 flex items-center flex-wrap gap-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
                  <span>{format(action.date, "PP")}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
                  <span>{format(action.date, "p")}</span>
                </div>
                <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-200">
                  Action Item
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <EditIcon className="h-4 w-4 text-gray-500 hover:text-blue-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600" 
                onClick={() => handleDelete(action.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
