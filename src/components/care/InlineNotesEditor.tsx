import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X } from "lucide-react";
import { useState } from "react";

interface InlineNotesEditorProps {
  notes?: string | null;
  onSave: (notes: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const InlineNotesEditor = ({
  notes,
  onSave,
  disabled = false,
  placeholder = "Add notes about this goal...",
}: InlineNotesEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes || "");

  const handleStartEdit = () => {
    setLocalNotes(notes || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(localNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalNotes(notes || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          disabled={disabled}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={disabled}
            className="h-8"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Notes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={disabled}
            className="h-8"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes ? (
        <div className="bg-muted/50 rounded-md p-3 text-sm text-foreground whitespace-pre-wrap">
          {notes}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">
          No notes yet
        </div>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleStartEdit}
        disabled={disabled}
        className="h-8"
      >
        <Edit className="w-3 h-3 mr-1" />
        {notes ? 'Edit Notes' : 'Add Notes'}
      </Button>
    </div>
  );
};
