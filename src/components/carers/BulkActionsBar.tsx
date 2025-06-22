
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, X } from "lucide-react";
import { CarerDB } from "@/data/hooks/useBranchCarers";

interface BulkActionsBarProps {
  selectedCarers: CarerDB[];
  onClearSelection: () => void;
  onBulkStatusChange: () => void;
}

export const BulkActionsBar = ({ 
  selectedCarers, 
  onClearSelection, 
  onBulkStatusChange 
}: BulkActionsBarProps) => {
  if (selectedCarers.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-lg rounded-lg p-4 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900">
            {selectedCarers.length} carer{selectedCarers.length > 1 ? 's' : ''} selected
          </span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {selectedCarers.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkStatusChange}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Change Status
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
