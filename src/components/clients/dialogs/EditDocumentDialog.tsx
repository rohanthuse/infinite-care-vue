
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id: string;
    name: string;
    type: string;
    uploaded_by: string;
  }) => void;
  document: any;
}

export function EditDocumentDialog({
  open,
  onOpenChange,
  onSave,
  document,
}: EditDocumentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    uploaded_by: "",
  });

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || "",
        type: document.type || "",
        uploaded_by: document.uploaded_by || "",
      });
    }
  }, [document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (document && formData.name && formData.type) {
      onSave({
        id: document.id,
        ...formData,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      type: "",
      uploaded_by: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update the document information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter document name"
              required
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Medical Report">Medical Report</SelectItem>
                <SelectItem value="Care Plan">Care Plan</SelectItem>
                <SelectItem value="Assessment">Assessment</SelectItem>
                <SelectItem value="Legal Document">Legal Document</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Consent Form">Consent Form</SelectItem>
                <SelectItem value="Photo">Photo</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Uploaded By */}
          <div className="space-y-2">
            <Label htmlFor="uploaded_by">Uploaded By</Label>
            <Input
              id="uploaded_by"
              value={formData.uploaded_by}
              onChange={(e) => setFormData(prev => ({ ...prev, uploaded_by: e.target.value }))}
              placeholder="Who uploaded this document?"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name || !formData.type}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
