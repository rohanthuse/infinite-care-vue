import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, FileText, X, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface UnifiedInlineUploadFormProps {
  onSave: (document: UploadDocumentData) => Promise<void>;
  isUploading: boolean;
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

// File type detection mapping
const fileTypeMapping: Record<string, string> = {
  'pdf': 'PDF',
  'doc': 'Word Document',
  'docx': 'Word Document',
  'xls': 'Excel Spreadsheet',
  'xlsx': 'Excel Spreadsheet',
  'jpg': 'Image',
  'jpeg': 'Image',
  'png': 'Image',
  'gif': 'Image',
  'webp': 'Image',
  'txt': 'Text File',
  'ppt': 'Presentation',
  'pptx': 'Presentation',
  'mp3': 'Audio',
  'wav': 'Audio',
  'mp4': 'Video',
  'avi': 'Video',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UnifiedInlineUploadForm({ 
  onSave,
  isUploading,
  clients = [],
  staff = []
}: UnifiedInlineUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [relatedEntity, setRelatedEntity] = useState<string>("none");
  const [relatedEntityId, setRelatedEntityId] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sharedWithClients, setSharedWithClients] = useState<string[]>([]);
  const [sharedWithStaff, setSharedWithStaff] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Current file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`;
    }
    
    // Check file type (basic validation)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/x-msvideo'
    ];
    
    if (!allowedTypes.includes(file.type) && file.type !== '') {
      return `File type "${file.type}" is not supported. Please upload PDF, Word, Excel, Image, or other common document types.`;
    }
    
    return null;
  };

  const detectDocumentType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? fileTypeMapping[extension] || 'Other' : 'Other';
  };

  const handleFileChange = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      return;
    }

    setFileError("");
    setSelectedFile(file);
    setUploadProgress(0);

    // Auto-fill form fields
    if (!form.getValues('name')) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      form.setValue('name', nameWithoutExt);
    }

    // Auto-detect document type
    const detectedType = detectDocumentType(file.name);
    if (!form.getValues('type')) {
      form.setValue('type', detectedType);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
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

  const removeFile = () => {
    setSelectedFile(null);
    setFileError("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function onSubmit(data: FormValues) {
    if (!selectedFile) {
      setFileError("Please select a file to upload");
      return;
    }

    // Validate restricted access level
    if (data.access_level === 'restricted' && sharedWithClients.length === 0 && sharedWithStaff.length === 0) {
      setFileError("Restricted documents must be shared with at least one client or staff member");
      return;
    }

    setUploadProgress(10);
    
    try {
      const uploadData: UploadDocumentData = {
        name: data.name,
        type: data.type,
        category: data.category,
        description: data.description,
        file: selectedFile,
        tags,
        access_level: data.access_level,
        expiry_date: data.expiry_date || undefined,
        shared_with_clients: sharedWithClients.length > 0 ? sharedWithClients : undefined,
        shared_with_staff: sharedWithStaff.length > 0 ? sharedWithStaff : undefined,
      };

      // Add related entity if selected
      if (relatedEntity === "client" && relatedEntityId) {
        uploadData.client_id = relatedEntityId;
      } else if (relatedEntity === "staff" && relatedEntityId) {
        uploadData.staff_id = relatedEntityId;
      }

      setUploadProgress(50);
      await onSave(uploadData);
      setUploadProgress(100);
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      setTags([]);
      setRelatedEntity("none");
      setRelatedEntityId("");
      setSharedWithClients([]);
      setSharedWithStaff([]);
      setFileError("");
      setUploadProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadProgress(0);
      console.error('Upload error:', error);
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <FileText className="h-5 w-5" />
          Upload New Document
        </CardTitle>
        <CardDescription>
          Upload documents with proper categorization, validation, and file management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select File *</label>
              <div
                className={`flex items-center justify-center w-full transition-colors ${
                  isDragOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`w-10 h-10 mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, Images (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleInputChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.ppt,.pptx,.mp3,.wav,.mp4,.avi"
                  />
                </label>
              </div>

              {/* File Error */}
              {fileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fileError}</AlertDescription>
                </Alert>
              )}

              {/* Selected File */}
              {selectedFile && !fileError && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{selectedFile.name}</span>
                    <span className="text-xs text-green-600">({formatFileSize(selectedFile.size)})</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uploading...</span>
                    <span className="text-sm text-gray-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter document name" {...field} />
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
                    <FormLabel>Document Type *</FormLabel>
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

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
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
                    <FormLabel>Access Level *</FormLabel>
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

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="date" 
                          {...field} 
                          className="pl-10"
                        />
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Access Level Explanation */}
            {form.watch('access_level') && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {form.watch('access_level') === 'public' && '📢 Document will be visible to all users in the organization.'}
                {form.watch('access_level') === 'branch' && '🏢 Document will only be visible to users in this branch.'}
                {form.watch('access_level') === 'restricted' && '🔒 Document will only be visible to selected clients and staff members.'}
              </div>
            )}

            {/* Sharing Options for Restricted Documents */}
            {form.watch('access_level') === 'restricted' && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-900">Share Document With:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-800">Clients</label>
                    <div className="relative z-50">
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-800">Staff Members</label>
                    <div className="relative z-50">
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
                </div>

                {sharedWithClients.length === 0 && sharedWithStaff.length === 0 && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ You must select at least one client or staff member for restricted documents.
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Related Entity Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Related To</label>
                <Select value={relatedEntity} onValueChange={setRelatedEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Related Entity Selection */}
            {relatedEntity && relatedEntity !== "none" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select {relatedEntity === "client" ? "Client" : "Staff Member"}
                </label>
                <Select value={relatedEntityId} onValueChange={setRelatedEntityId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${relatedEntity}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {relatedEntity === "client" ? 
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      )) :
                      staff.map((staffMember) => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          {staffMember.first_name} {staffMember.last_name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add document description..." 
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
                <Button type="button" onClick={addTag} size="sm" variant="outline">Add</Button>
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

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={isUploading || !selectedFile || !!fileError}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedFile(null);
                  setTags([]);
                  setRelatedEntity("none");
                  setRelatedEntityId("");
                  setSharedWithClients([]);
                  setSharedWithStaff([]);
                  setFileError("");
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}