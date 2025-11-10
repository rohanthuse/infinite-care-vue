import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, X, Loader2 } from 'lucide-react';

interface ClientDocumentBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isDeleting: boolean;
}

export const ClientDocumentBulkActionsBar: React.FC<ClientDocumentBulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  isDeleting,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-background border border-border rounded-lg shadow-lg px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedCount} client document{selectedCount > 1 ? 's' : ''} selected
            </span>
            <Badge variant="secondary">{selectedCount}</Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isDeleting}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
