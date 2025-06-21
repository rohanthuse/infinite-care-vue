
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Tag, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgreementTypes, useCreateTemplate } from "@/data/hooks/agreements";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  branchId
}: CreateTemplateDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [content, setContent] = useState("");
  
  // Fetch data
  const { data: agreementTypes, isLoading: typesLoading } = useAgreementTypes();
  const createTemplateMutation = useCreateTemplate();
  
  const handleCreateTemplate = async () => {
    if (!title || !selectedType) {
      return;
    }
    
    try {
      await createTemplateMutation.mutateAsync({
        title,
        content: content || null,
        type_id: selectedType,
        branch_id: branchId !== "global" ? branchId : null,
        created_by: null, // Will be set by auth context when available
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setSelectedType("");
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Agreement Template</DialogTitle>
          <DialogDescription>
            Create a new template for future agreements
          </DialogDescription>
        </DialogHeader>
        
        {typesLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Template Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="Enter template title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Agreement Type <span className="text-red-500">*</span>
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select agreement type" />
                </SelectTrigger>
                <SelectContent>
                  {agreementTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template Content</label>
              <Textarea
                placeholder="Enter the template content. Use placeholders like {{CLIENT_NAME}}, {{DATE}}, etc. for dynamic content."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-gray-500">
                You can use placeholders like {{"{{"}}CLIENT_NAME{{"}}"}}, {{"{{"}}DATE{{"}}"}}, {{"{{"}}COMPANY_NAME{{"}}"}} that will be replaced when creating agreements from this template.
              </p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTemplate} 
            disabled={createTemplateMutation.isPending || !title || !selectedType}
          >
            {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
