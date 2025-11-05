
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgreementTypes, useCreateTemplate } from "@/data/hooks/agreements";
import { FileUploadDropzone } from "./FileUploadDropzone";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  isOrganizationLevel?: boolean;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  branchId,
  isOrganizationLevel = false
}: CreateTemplateDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [content, setContent] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);
  const [isTemplateCreated, setIsTemplateCreated] = useState(false);
  
  // Fetch data
  const { data: agreementTypes, isLoading: typesLoading } = useAgreementTypes();
  const createTemplateMutation = useCreateTemplate();
  
  const handleCreateTemplate = async () => {
    if (!title || !selectedType) {
      return;
    }
    
    try {
      const result = await createTemplateMutation.mutateAsync({
        title,
        content: content || null,
        type_id: selectedType,
        template_file_id: null,
        branch_id: isOrganizationLevel ? null : branchId || null,
        created_by: null, // Will be set by auth context when available
      });
      
      // Store the created template ID and mark as created
      setCreatedTemplateId(result.id);
      setIsTemplateCreated(true);
      
      // Move to step 2 for file uploads
      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleCompleteTemplate = () => {
    resetForm();
    onOpenChange(false);
  };
  
  const resetForm = () => {
    setTitle("");
    setSelectedType("");
    setContent("");
    setCurrentStep(1);
    setCreatedTemplateId(null);
    setIsTemplateCreated(false);
  };

  const canProceedToStep2 = title && selectedType;
  const canComplete = canProceedToStep2;

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Agreement Template</DialogTitle>
          <DialogDescription>
            Create a new template for future agreements with files and content
          </DialogDescription>
        </DialogHeader>
        
        {typesLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs value={`step${currentStep}`} onValueChange={(value) => setCurrentStep(parseInt(value.replace('step', '')))}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="step1">Template Details</TabsTrigger>
              <TabsTrigger value="step2" disabled={!canProceedToStep2}>Template Files</TabsTrigger>
            </TabsList>

            <TabsContent value="step1" className="space-y-4 py-4">
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
                  You can use placeholders like CLIENT_NAME, DATE, COMPANY_NAME that will be replaced when creating agreements from this template.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="step2" className="space-y-4 py-4">
              <div className="space-y-4">
                {isTemplateCreated && createdTemplateId ? (
                  <div>
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-lg font-medium text-green-800 mb-2">✓ Template Created Successfully!</h3>
                      <p className="text-sm text-green-700">
                        Your template has been created. You can now upload template files (optional).
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Template Files</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload template documents that can be reused for multiple agreements
                      </p>
                      <FileUploadDropzone
                        templateId={createdTemplateId}
                        category="template"
                        maxFiles={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-500">
                      Create the template first to upload files
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button 
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>
          )}
          {currentStep < 2 ? (
            <Button 
              onClick={handleCreateTemplate}
              disabled={createTemplateMutation.isPending || !canComplete}
            >
              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          ) : (
            <Button 
              onClick={handleCompleteTemplate}
            >
              Complete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
