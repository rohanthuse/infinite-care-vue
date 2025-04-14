
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
import { toast } from "sonner";
import { Upload, Users, UserCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
  const [templateType, setTemplateType] = useState("");
  const [content, setContent] = useState("");
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [targetParty, setTargetParty] = useState("both"); // "client", "staff", or "both"
  const [loading, setLoading] = useState(false);
  
  const handleCreateTemplate = async () => {
    if (!title || !templateType) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, we would make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Template created successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setTemplateType("");
    setContent("");
    setDocumentUploaded(false);
    setTargetParty("both");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Agreement Template</DialogTitle>
          <DialogDescription>
            Create a new agreement template that can be reused
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Template Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              placeholder="Enter template name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Template Type <span className="text-red-500">*</span>
            </label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select template type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Employment Agreement">Employment Agreement</SelectItem>
                <SelectItem value="Service Agreement">Service Agreement</SelectItem>
                <SelectItem value="NDA">Non-Disclosure Agreement</SelectItem>
                <SelectItem value="Data Agreement">Data Agreement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Target Party
            </label>
            <RadioGroup 
              defaultValue="both" 
              className="flex flex-col space-y-1.5"
              value={targetParty}
              onValueChange={setTargetParty}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client-only" />
                <Label htmlFor="client-only" className="flex items-center">
                  <Users className="h-4 w-4 mr-1.5" /> Client Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="staff" id="staff-only" />
                <Label htmlFor="staff-only" className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-1.5" /> Staff Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both-parties" />
                <Label htmlFor="both-parties">Both Clients and Staff</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Template Document</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDocumentUploaded(true)}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {documentUploaded ? "Document Uploaded" : "Upload Document"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Enter template content or upload a document above"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              You can use placeholders like {"{client_name}"}, {"{date}"}, etc.
            </p>
            <p className="text-xs text-muted-foreground">
              For digital signatures, use {"{signature_placeholder}"} where you want the signature to appear.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTemplate} 
            disabled={loading || !title || !templateType}
          >
            {loading ? "Creating..." : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
