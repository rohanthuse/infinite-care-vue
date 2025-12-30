import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Upload, File, Calendar, CheckCircle, AlertCircle, Eye, Download } from "lucide-react";
import { useViewClientDocument, useDownloadClientDocument } from "@/hooks/useClientDocuments";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUnifiedDocuments } from "@/hooks/useUnifiedDocuments";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface WizardStep13DocumentsProps {
  form: UseFormReturn<any>;
  clientId: string;
}

export function WizardStep13Documents({ form, clientId }: WizardStep13DocumentsProps) {
  const { id: branchId } = useParams();
  const { user } = useAuth();
  const { uploadDocument, isUploading } = useUnifiedDocuments(branchId || '');
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: boolean }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: number]: string }>({});
  
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();

  const handleViewDocument = (filePath: string) => {
    if (filePath) {
      viewDocumentMutation.mutate({ filePath });
    } else {
      toast.error('Document file path not available');
    }
  };

  const handleDownloadDocument = (filePath: string, fileName: string) => {
    if (filePath) {
      downloadDocumentMutation.mutate({ filePath, fileName });
    } else {
      toast.error('Document file path not available');
    }
  };

  // Debug logging for initialization
  console.log('[WizardStep13Documents] Component initialized:', {
    branchId,
    clientId,
    userId: user?.id,
    userEmail: user?.email,
    isUploading,
    formDocuments: form.getValues("documents")
  });

  const addDocument = () => {
    const current = form.getValues("documents") || [];
    console.log('[WizardStep13Documents] Adding new document, current count:', current.length);
    
    form.setValue("documents", [...current, {
      name: "",
      type: "",
      upload_date: new Date(),
      uploaded_by: "",
      file_path: "",
      file_size: "",
      uploaded_document_id: null
    }]);
  };

  const removeDocument = (index: number) => {
    const current = form.getValues("documents") || [];
    console.log('[WizardStep13Documents] Removing document at index:', index);
    
    form.setValue("documents", current.filter((_, i) => i !== index));
    
    // Clear any upload state for this index
    setUploadingFiles(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    
    setUploadErrors(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const handleFileUpload = async (index: number, file: File) => {
    console.log('[WizardStep13Documents] Starting file upload:', {
      index,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      branchId,
      clientId,
      userId: user?.id
    });

    // Pre-upload validation
    if (!branchId) {
      const error = "Branch ID not found - cannot upload file";
      console.error('[WizardStep13Documents] Upload failed:', error);
      setUploadErrors(prev => ({ ...prev, [index]: error }));
      toast.error(error);
      return;
    }

    if (!user) {
      const error = "User not authenticated - please log in";
      console.error('[WizardStep13Documents] Upload failed:', error);
      setUploadErrors(prev => ({ ...prev, [index]: error }));
      toast.error(error);
      return;
    }

    if (!clientId) {
      const error = "Client ID not provided - cannot associate document";
      console.error('[WizardStep13Documents] Upload failed:', error);
      setUploadErrors(prev => ({ ...prev, [index]: error }));
      toast.error(error);
      return;
    }

    // File validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      const error = "File too large - maximum size is 50MB";
      console.error('[WizardStep13Documents] Upload failed:', error);
      setUploadErrors(prev => ({ ...prev, [index]: error }));
      toast.error(error);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      const error = `File type not supported: ${file.type}`;
      console.error('[WizardStep13Documents] Upload failed:', error);
      setUploadErrors(prev => ({ ...prev, [index]: error }));
      toast.error(error);
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [index]: true }));
    setUploadErrors(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    
    try {
      console.log('[WizardStep13Documents] Preparing upload data...');
      
      // Prepare upload data
      const uploadData = {
        name: file.name,
        type: getDocumentTypeFromFile(file),
        category: "Care Plan",
        description: `Care plan document for client`,
        file: file,
        tags: ["care-plan", "client-document"],
        access_level: "branch" as const,
        client_id: clientId
      };

      console.log('[WizardStep13Documents] Upload data prepared:', {
        ...uploadData,
        file: `File object: ${file.name} (${file.size} bytes)`
      });

      // Upload the file using the unified documents hook
      console.log('[WizardStep13Documents] Calling uploadDocument...');
      const uploadedDocument = await uploadDocument(uploadData);
      
      console.log('[WizardStep13Documents] Upload response:', uploadedDocument);
      
      if (uploadedDocument) {
        const formattedSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        
        console.log('[WizardStep13Documents] Updating form with uploaded document data...');
        
        // Update form with the uploaded document information
        form.setValue(`documents.${index}.name`, file.name);
        form.setValue(`documents.${index}.file_size`, formattedSize);
        form.setValue(`documents.${index}.file_path`, uploadedDocument.file_path || '');
        form.setValue(`documents.${index}.upload_date`, new Date());
        form.setValue(`documents.${index}.uploaded_by`, uploadedDocument.uploaded_by_name || 'Admin');
        form.setValue(`documents.${index}.type`, getDocumentTypeFromFile(file));
        form.setValue(`documents.${index}.uploaded_document_id`, uploadedDocument.id);
        
        console.log('[WizardStep13Documents] Form updated successfully');
        toast.success(`Document "${file.name}" uploaded successfully`);
      } else {
        throw new Error('Upload returned no document data');
      }
      
    } catch (error) {
      console.error("[WizardStep13Documents] File upload failed:", {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileSize: file.size,
        branchId,
        clientId
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed - please try again';
      setUploadErrors(prev => ({ ...prev, [index]: errorMessage }));
      toast.error(`Failed to upload "${file.name}": ${errorMessage}`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [index]: false }));
      console.log('[WizardStep13Documents] Upload process completed for index:', index);
    }
  };

  const getDocumentTypeFromFile = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (["pdf"].includes(extension || "")) return "care_plan";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) return "photo";
    if (["doc", "docx"].includes(extension || "")) return "assessment";
    if (["txt"].includes(extension || "")) return "other";
    
    return "other";
  };

  const documents = form.watch("documents") || [];

  console.log('[WizardStep13Documents] Current documents in form:', documents);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Documents</h2>
        <p className="text-gray-600">
          Upload and organize important care plan documentation and files.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Document Library</h3>
            <Button type="button" onClick={addDocument} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Document
            </Button>
          </div>

          {documents.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No documents uploaded yet. Click "Add Document" to upload your first file.</p>
            </div>
          )}

          {documents.map((_, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium flex items-center">
                  <File className="h-4 w-4 mr-2" />
                  Document {index + 1}
                  {form.watch(`documents.${index}.file_path`) && (
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                  )}
                  {uploadErrors[index] && (
                    <AlertCircle className="h-4 w-4 ml-2 text-red-600" />
                  )}
                  {uploadingFiles[index] && (
                    <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  )}
                </h4>
                <Button
                  type="button"
                  onClick={() => removeDocument(index)}
                  size="sm"
                  variant="outline"
                  disabled={uploadingFiles[index]}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {uploadErrors[index] && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <strong>Upload Error:</strong>
                  </div>
                  <p className="mt-1">{uploadErrors[index]}</p>
                </div>
              )}

              {uploadingFiles[index] && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    <strong>Uploading...</strong>
                  </div>
                  <p className="mt-1">Please wait while your file is being uploaded to the server.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`documents.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter document name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`documents.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="care_plan">Care Plan</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="medical_report">Medical Report</SelectItem>
                          <SelectItem value="consent_form">Consent Form</SelectItem>
                          <SelectItem value="photo">Photo</SelectItem>
                          <SelectItem value="insurance">Insurance Document</SelectItem>
                          <SelectItem value="identification">Identification</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`documents.${index}.uploaded_by`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uploaded By</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter uploader name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`documents.${index}.upload_date`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Upload Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Enhanced File Upload Area */}
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
                  uploadingFiles[index] || isUploading
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                )}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!uploadingFiles[index] && !isUploading) {
                    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                  
                  if (uploadingFiles[index] || isUploading) return;
                  
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    const file = files[0];
                    console.log('[WizardStep13Documents] File dropped:', {
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type,
                      index
                    });
                    handleFileUpload(index, file);
                  }
                }}
                onClick={() => {
                  if (!uploadingFiles[index] && !isUploading) {
                    document.getElementById(`file-input-${index}`)?.click();
                  }
                }}
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    {uploadingFiles[index] ? "Uploading file..." : "Drag and drop your file here, or click to browse"}
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    disabled={uploadingFiles[index] || isUploading}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {uploadingFiles[index] ? "Uploading..." : "Browse Files"}
                  </Button>
                  <input
                    id={`file-input-${index}`}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      console.log('[WizardStep13Documents] File selected:', {
                        fileName: file?.name,
                        fileSize: file?.size,
                        fileType: file?.type,
                        index
                      });
                      if (file) {
                        handleFileUpload(index, file);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.gif,.webp"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP, TXT (Max 50MB)
                </p>
              </div>
                
                {form.watch(`documents.${index}.file_path`) && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">
                          {form.watch(`documents.${index}.name`)}
                        </p>
                        <p className="text-xs text-green-600">
                          {form.watch(`documents.${index}.file_size`)} • Uploaded successfully
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(form.watch(`documents.${index}.file_path`))}
                          disabled={viewDocumentMutation.isPending}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(
                            form.watch(`documents.${index}.file_path`),
                            form.watch(`documents.${index}.name`)
                          )}
                          disabled={downloadDocumentMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      </Form>
    </div>
  );
}
