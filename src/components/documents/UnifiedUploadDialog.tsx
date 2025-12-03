
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { UploadDocumentData } from "@/hooks/useUnifiedDocuments";

const formSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  access_level: z.string().default("branch"),
  expiry_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UnifiedUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (document: UploadDocumentData) => Promise<void>;
  clients?: Array<{ id: string; first_name: string; last_name: string }>;
  staff?: Array<{ id: string; first_name: string; last_name: string }>;
}

const documentCategories = [
  "Medical Report",
  "Care Plan", 
  "Legal Document",
  "Insurance",
  "Assessment",
  "Agreement",
  "Form",
  "Training",
  "Policy",
  "Template",
  "Invoice",
  "General"
];

const documentTypes = [
  "PDF",
  "Word Document", 
  "Excel Spreadsheet",
  "Image",
  "Text File",
  "Presentation",
  "Audio",
  "Video",
  "Other"
];

export function UnifiedUploadDialog({ 
  open, 
  onOpenChange, 
  onSave,
  clients = [],
  staff = []
}: UnifiedUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sharedWithClients, setSharedWithClients] = useState<string[]>([]);
  const [sharedWithStaff, setSharedWithStaff] = useState<string[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      category: "",
      description: "",
      access_level: "branch",
      expiry_date: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!form.getValues('name')) {
        form.setValue('name', file.name);
      }
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  async function onSubmit(data: FormValues) {
    if (!selectedFile) {
      form.setError("name", { message: "Please select a file to upload" });
      return;
    }

    setIsUploading(true);
    // Validate restricted access level
    if (data.access_level === 'restricted' && sharedWithClients.length === 0 && sharedWithStaff.length === 0) {
      form.setError("access_level", { message: "Restricted documents must be shared with at least one client or staff member" });
      return;
    }

    try {
      const uploadData: UploadDocumentData = {
        name: data.name,
        type: data.type,
        category: data.category,
        description: data.description,
        file: selectedFile,
        tags,
        access_level: data.access_level,
        expiry_date: data.expiry_date,
        shared_with_clients: sharedWithClients.length > 0 ? sharedWithClients : undefined,
        shared_with_staff: sharedWithStaff.length > 0 ? sharedWithStaff : undefined,
      };


      await onSave(uploadData);
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      setTags([]);
      setSharedWithClients([]);
      setSharedWithStaff([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <FileText className="h-5 w-5" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload a new document to the system with proper categorization and tagging
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">All file types supported (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {selectedFile && (
                <p className="text-sm text-green-600">Selected: {selectedFile.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Document name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentCategories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="access_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="branch">Branch Only</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Access Level Explanation */}
            {form.watch('access_level') && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {form.watch('access_level') === 'public' && 'Document will be visible to all users in the organization.'}
                {form.watch('access_level') === 'branch' && 'Document will only be visible to users in this branch.'}
                {form.watch('access_level') === 'restricted' && 'Document will only be visible to selected clients and staff members.'}
              </div>
            )}

            {/* Sharing Options for Restricted Documents */}
            {form.watch('access_level') === 'restricted' && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-900">Share Document With:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-800">Clients</label>
                    <MultiSelect
                      options={clients.map(client => ({
                        value: client.id,
                        label: `${client.first_name} ${client.last_name}`,
                        description: `Client ID: ${client.id.slice(0, 8)}...`
                      }))}
                      selected={sharedWithClients}
                      onSelectionChange={setSharedWithClients}
                      placeholder="Select clients..."
                      searchPlaceholder="Search clients..."
                      emptyText="No clients found."
                      maxDisplay={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-800">Staff Members</label>
                    <MultiSelect
                      options={staff.map(staffMember => ({
                        value: staffMember.id,
                        label: `${staffMember.first_name} ${staffMember.last_name}`,
                        description: `Staff ID: ${staffMember.id.slice(0, 8)}...`
                      }))}
                      selected={sharedWithStaff}
                      onSelectionChange={setSharedWithStaff}
                      placeholder="Select staff..."
                      searchPlaceholder="Search staff..."
                      emptyText="No staff found."
                      maxDisplay={2}
                    />
                  </div>
                </div>

                {sharedWithClients.length === 0 && sharedWithStaff.length === 0 && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ You must select at least one client or staff member for restricted documents.
                  </div>
                )}
              </div>
            )}


            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Document description..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} size="sm">Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
