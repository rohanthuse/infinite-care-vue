import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, X, Loader2 } from "lucide-react";

interface BookingBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isDeleting: boolean;
}

export const BookingBulkActionsBar: React.FC<BookingBulkActionsBarProps> = ({ 
  selectedCount, 
  onClearSelection, 
  onBulkDelete,
  isDeleting 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-4 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {selectedCount} booking{selectedCount > 1 ? 's' : ''} selected
          </span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
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
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isDeleting}
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
