
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { FileUp, Upload, File, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadFormProps {
  branchId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long" }),
  category: z.string().min(1, { message: "Please select a category" }),
  description: z.string().optional(),
  file: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "Please select a file to upload",
  }).refine(files => files[0].size <= MAX_FILE_SIZE, {
    message: `File size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
  }),
  accessRoles: z.array(z.string()).optional(),
  isPrivate: z.boolean().default(false),
  expiryDate: z.string().optional(),
});

const categories = [
  { id: "policies", name: "Policies & Procedures" },
  { id: "forms", name: "Forms" },
  { id: "training", name: "Training Materials" },
  { id: "reports", name: "Reports" },
  { id: "templates", name: "Templates" },
  { id: "guides", name: "User Guides" },
  { id: "legal", name: "Legal Documents" },
  { id: "other", name: "Other Resources" },
];

const roles = [
  { id: "admin", label: "Admin" },
  { id: "branch-manager", label: "Branch Manager" },
  { id: "staff", label: "Staff" },
  { id: "carer", label: "Carer" },
  { id: "client", label: "Client" },
];

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ branchId }) => {
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: '',
      description: '',
      isPrivate: false,
      accessRoles: ['admin', 'branch-manager'],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files[0].size > MAX_FILE_SIZE) {
        toast.error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
        return;
      }
      setFileSelected(files[0]);
      form.setValue('file', files);
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > MAX_FILE_SIZE) {
        toast.error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
        return;
      }
      setFileSelected(droppedFile);
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        form.setValue('file', dataTransfer.files);
      }
    }
  };

  const simulateUploadProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress > 100) progress = 100;
      setUploadProgress(progress);
      
      if (progress === 100) {
        clearInterval(interval);
      }
    }, 300);
    
    return () => clearInterval(interval);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      setUploadProgress(0);
      
      // Start the upload progress animation
      const clearProgressInterval = simulateUploadProgress();
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Prepare document metadata for storage
      const documentData = {
        id: `doc-${Date.now()}`,
        title: values.title,
        category: values.category,
        description: values.description || '',
        branchId,
        fileName: fileSelected?.name,
        fileType: fileSelected?.type || '',
        fileSize: fileSelected?.size || 0,
        uploadedBy: 'Current User', // In a real app, this would be the logged-in user
        uploadDate: new Date().toISOString(),
        isPrivate: values.isPrivate,
        accessRoles: values.accessRoles || [],
        expiryDate: values.expiryDate || null,
        path: `documents/${branchId}/${Date.now()}_${fileSelected?.name}`
      };
      
      console.log('Document upload data:', documentData);
      
      // In a real implementation, we would upload the file to storage here
      // and save the document metadata in a database
      
      clearProgressInterval();
      setUploadProgress(100);
      
      // Show success message after a short delay to ensure progress bar reaches 100%
      setTimeout(() => {
        toast.success('Document uploaded successfully', {
          description: `${values.title} has been uploaded`,
        });
        form.reset();
        setFileSelected(null);
        setUploadProgress(0);
        setSubmitting(false);
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document', {
        description: 'Please try again later',
      });
      setSubmitting(false);
    }
  };
  
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return "pdf";
    if (type.includes('doc') || type.includes('word')) return "doc";
    if (type.includes('xls') || type.includes('sheet')) return "excel";
    if (type.includes('ppt') || type.includes('presentation')) return "ppt";
    if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('image')) return "image";
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return "archive";
    return "generic";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter document title" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a descriptive title for your document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the category that best describes this document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a brief description of the document"
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide additional context about this document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel>Document File</FormLabel>
                  <FormControl>
                    <div 
                      className={`
                        border-2 ${dragActive ? 'border-blue-400 bg-blue-50' : fileSelected ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 hover:border-blue-200'}
                        border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer
                      `}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.ppt,.pptx,.zip"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {fileSelected ? (
                          <div className="flex flex-col items-center">
                            <File className="h-8 w-8 text-blue-500 mb-2" />
                            <p className="font-medium text-blue-700 mb-1">{fileSelected.name}</p>
                            <p className="text-xs text-gray-500">
                              {(fileSelected.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="font-medium text-gray-700">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">
                              PDF, Word, Excel, CSV, Images up to 10MB
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="access-settings">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Access Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="isPrivate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Private Document</FormLabel>
                            <FormDescription>
                              Only accessible to specific roles and users
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accessRoles"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-base">Access Roles</FormLabel>
                            <FormDescription>
                              Select roles that can access this document
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {roles.map((role) => (
                              <FormField
                                key={role.id}
                                control={form.control}
                                name="accessRoles"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={role.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(role.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), role.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== role.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {role.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormDescription>
                            Set an expiration date for this document
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {submitting && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Uploading document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              setFileSelected(null);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>Uploading...</>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
