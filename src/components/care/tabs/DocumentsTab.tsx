
import React, { useState } from "react";
import { format } from "date-fns";
import { FileText, Download, Eye, FileBox, Calendar, User, Plus, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientDocuments, useViewClientDocument, useDownloadClientDocument, useUploadClientDocument } from "@/hooks/useClientDocuments";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const uploadFormSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  uploaded_by: z.string().min(1, "Uploader name is required"),
  file: z.any().refine((file) => file instanceof File, "Please select a file"),
});

interface DocumentsTabProps {
  clientId: string;
  onUploadDocument?: () => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId, onUploadDocument }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { data: documents = [], isLoading } = useClientDocuments(clientId);
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();
  const uploadDocumentMutation = useUploadClientDocument();

  const uploadForm = useForm<z.infer<typeof uploadFormSchema>>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      name: "",
      type: "",
      uploaded_by: "",
    },
  });

  const handleViewDocument = (document: any) => {
    if (document.file_path) {
      viewDocumentMutation.mutate({ filePath: document.file_path });
    } else {
      console.error('Document has no file path');
    }
  };

  const handleDownloadDocument = (document: any) => {
    if (document.file_path) {
      downloadDocumentMutation.mutate({ 
        filePath: document.file_path, 
        fileName: document.name 
      });
    } else {
      console.error('Document has no file path');
    }
  };

  const handleUploadDocument = async (values: z.infer<typeof uploadFormSchema>) => {
    try {
      await uploadDocumentMutation.mutateAsync({
        clientId,
        file: values.file,
        name: values.name,
        type: values.type,
        uploaded_by: values.uploaded_by,
      });
      setIsUploadDialogOpen(false);
      uploadForm.reset();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
      case "Medical Report":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "DOCX":
      case "Care Plan":
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <FileBox className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    switch (type) {
      case "PDF":
      case "Medical Report":
        return "bg-red-50 text-red-700 border-red-200";
      case "DOCX":
      case "Care Plan":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Documents</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Upload Document</span>
            </Button>
          </div>
          <CardDescription>Medical reports and care plan documents</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileBox className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No documents available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDocumentTypeIcon(doc.type)}
                        <span className="font-medium">{doc.name}</span>
                        <Badge variant="outline" className={`${getDocumentTypeBadge(doc.type)} text-xs`}>
                          {doc.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(doc.upload_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="h-3.5 w-3.5" />
                        <span>{doc.uploaded_by}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewDocument(doc)}
                          disabled={viewDocumentMutation.isPending}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownloadDocument(doc)}
                          disabled={downloadDocumentMutation.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          <Form {...uploadForm}>
            <form onSubmit={uploadForm.handleSubmit(handleUploadDocument)} className="space-y-4">
              <FormField
                control={uploadForm.control}
                name="name"
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
                control={uploadForm.control}
                name="type"
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
                        <SelectItem value="Medical Report">Medical Report</SelectItem>
                        <SelectItem value="Care Plan">Care Plan</SelectItem>
                        <SelectItem value="Assessment">Assessment</SelectItem>
                        <SelectItem value="Legal Document">Legal Document</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={uploadForm.control}
                name="uploaded_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uploaded By</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={uploadForm.control}
                name="file"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadDocumentMutation.isPending}>
                  {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
