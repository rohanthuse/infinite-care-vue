import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, X } from "lucide-react";

interface SystemUsersBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isDeleting: boolean;
}

export const SystemUsersBulkActionsBar = ({ 
  selectedCount, 
  onClearSelection, 
  onBulkDelete,
  isDeleting 
}: SystemUsersBulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-background border border-border shadow-lg rounded-lg p-4 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="font-medium text-foreground">
            {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
          </span>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            {selectedCount}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Selected"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isDeleting}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
