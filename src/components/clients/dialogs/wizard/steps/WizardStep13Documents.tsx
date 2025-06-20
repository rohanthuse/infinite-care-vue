
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Upload, File, Calendar } from "lucide-react";
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

interface WizardStep13DocumentsProps {
  form: UseFormReturn<any>;
  clientId: string;
}

export function WizardStep13Documents({ form, clientId }: WizardStep13DocumentsProps) {
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: boolean }>({});

  const addDocument = () => {
    const current = form.getValues("documents") || [];
    form.setValue("documents", [...current, {
      name: "",
      type: "",
      upload_date: new Date(),
      uploaded_by: "",
      file_path: "",
      file_size: ""
    }]);
  };

  const removeDocument = (index: number) => {
    const current = form.getValues("documents") || [];
    form.setValue("documents", current.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (index: number, file: File) => {
    setUploadingFiles(prev => ({ ...prev, [index]: true }));
    
    try {
      // Simulate file upload - in real implementation, this would upload to storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const formattedSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      
      form.setValue(`documents.${index}.name`, file.name);
      form.setValue(`documents.${index}.file_size`, formattedSize);
      form.setValue(`documents.${index}.file_path`, `/uploads/${clientId}/${file.name}`);
      form.setValue(`documents.${index}.upload_date`, new Date());
      
      // Auto-detect document type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      let docType = "other";
      if (["pdf"].includes(extension || "")) docType = "care_plan";
      else if (["jpg", "jpeg", "png"].includes(extension || "")) docType = "photo";
      else if (["doc", "docx"].includes(extension || "")) docType = "assessment";
      
      form.setValue(`documents.${index}.type`, docType);
      
    } catch (error) {
      console.error("File upload failed:", error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [index]: false }));
    }
  };

  const documents = form.watch("documents") || [];

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
                </h4>
                <Button
                  type="button"
                  onClick={() => removeDocument(index)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    {uploadingFiles[index] ? "Uploading..." : "Drag and drop your file here, or"}
                  </p>
                  <label className="cursor-pointer">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={uploadingFiles[index]}
                    >
                      {uploadingFiles[index] ? "Uploading..." : "Browse Files"}
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(index, file);
                        }
                      }}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    />
                  </label>
                </div>
                
                {form.watch(`documents.${index}.file_path`) && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {form.watch(`documents.${index}.name`)}
                        </p>
                        <p className="text-xs text-green-600">
                          {form.watch(`documents.${index}.file_size`)}
                        </p>
                      </div>
                      <div className="text-green-600">
                        <File className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Form>
    </div>
  );
}
