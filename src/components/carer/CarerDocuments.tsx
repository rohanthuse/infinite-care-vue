
import React, { useState } from "react";
import { Upload, FileText, Eye, Download, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CarerDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  file_path: string;
  file_size: string;
  status: string;
  created_at: string;
  expiry_date?: string;
}

// Fetch carer documents
const fetchCarerDocuments = async (carerId: string): Promise<CarerDocument[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('staff_id', carerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Upload document
const uploadDocument = async (file: File, carerId: string, category: string, type: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${carerId}/${Date.now()}.${fileExt}`;
  
  // Upload to storage (assuming storage bucket exists)
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Save document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      name: file.name,
      type: type,
      category: category,
      file_path: fileName,
      file_size: (file.size / 1024).toFixed(2) + ' KB',
      staff_id: carerId,
      uploaded_by_name: 'Self-uploaded',
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const CarerDocuments: React.FC = () => {
  const { data: carerProfile } = useCarerProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState('');
  const [documentType, setDocumentType] = useState('');

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['carer-documents', carerProfile?.id],
    queryFn: () => fetchCarerDocuments(carerProfile!.id),
    enabled: !!carerProfile?.id,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, category, type }: { file: File; category: string; type: string }) =>
      uploadDocument(file, carerProfile!.id, category, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-documents', carerProfile?.id] });
      toast({ title: "Document uploaded successfully" });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentCategory('');
      setDocumentType('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !documentCategory || !documentType) {
      toast({ 
        title: "Missing information", 
        description: "Please select a file, category, and type",
        variant: "destructive" 
      });
      return;
    }

    uploadMutation.mutate({ 
      file: selectedFile, 
      category: documentCategory, 
      type: documentType 
    });
  };

  const documentCategories = [
    'Personal ID',
    'Professional Certification',
    'Training Certificate',
    'DBS Certificate',
    'Reference',
    'Medical Certificate',
    'Other'
  ];

  const documentTypes = [
    'PDF',
    'Image',
    'Word Document',
    'Excel Spreadsheet',
    'Other'
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Documents</CardTitle>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents uploaded yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload your first document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">{doc.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span>{doc.file_size}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={documentCategory} onValueChange={setDocumentCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {documentCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || !documentCategory || !documentType || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
