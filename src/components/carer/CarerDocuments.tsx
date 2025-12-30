
import React, { useState } from "react";
import { Upload, FileText, Eye, Download, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
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
  staff_id: string;
  document_type: string;
  file_path?: string;
  file_size?: string;
  status: string;
  created_at: string;
  expiry_date?: string;
}

// Fetch carer documents from staff_documents table
const fetchCarerDocuments = async (carerId: string): Promise<CarerDocument[]> => {
  console.log('[CarerDocuments] Fetching documents for carer:', carerId);
  
  // Get current user to check auth
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[CarerDocuments] Current user:', user?.id);
  
  const { data, error } = await supabase
    .from('staff_documents')
    .select('*')
    .eq('staff_id', carerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CarerDocuments] Error fetching documents:', error);
    throw error;
  }
  
  console.log('[CarerDocuments] Retrieved documents:', data?.length);
  return data || [];
};

// Upload document using secure function to bypass RLS issues
const uploadDocument = async (file: File, carerId: string, category: string, type: string) => {
  console.log('[CarerDocuments] Starting upload for:', file.name, 'Category:', category, 'Type:', type);
  
  // Get current session to verify auth
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session) {
    console.error('[CarerDocuments] Authentication error:', authError);
    throw new Error('User not authenticated or session expired');
  }
  
  const user = session.user;
  if (!user) {
    throw new Error('No user in session');
  }
  
  console.log('[CarerDocuments] Authenticated user ID:', user.id);
  console.log('[CarerDocuments] Staff profile ID (carerId):', carerId);
  console.log('[CarerDocuments] Session valid:', !!session.access_token);
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${carerId}/${fileName}`;
  
  console.log('[CarerDocuments] Uploading to path:', filePath);
  
  try {
    // Upload to staff-documents storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('staff-documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('[CarerDocuments] Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    console.log('[CarerDocuments] File uploaded successfully to storage');

    const formattedSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

    // Use the bypass RLS function to create document record (pass all 7 params explicitly)
    const { data: result, error: docError } = await supabase.rpc('upload_staff_document_bypass_rls', {
      p_staff_id: carerId,
      p_document_type: category,
      p_file_path: filePath,
      p_file_size: formattedSize,
      p_expiry_date: null,
      p_file_name: file.name,
      p_description: null
    });
    
    if (docError) {
      console.error('[CarerDocuments] Database function error:', docError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('staff-documents').remove([filePath]);
      throw new Error(`Failed to save document: ${docError.message}`);
    }
    
    // Check if the function returned an error result
    const resultObj = result as { success: boolean; error?: string; document_id?: string };
    if (resultObj && !resultObj.success) {
      // Clean up uploaded file if document creation fails
      await supabase.storage.from('staff-documents').remove([filePath]);
      throw new Error(resultObj.error || 'Unknown error from upload function');
    }

    const documentId = resultObj?.document_id || 'unknown';
    console.log('[CarerDocuments] Document record created with ID:', documentId);
    return { id: documentId, file_path: filePath, document_type: category };
  } catch (error) {
    console.error('[CarerDocuments] Upload failed:', error);
    throw error;
  }
};

export const CarerDocuments: React.FC = () => {
  const { carerProfile, isAuthenticated, loading } = useCarerAuthSafe();
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

  // Upload mutation with authentication verification
  const uploadMutation = useMutation({
    mutationFn: async ({ file, category, type }: { file: File; category: string; type: string }) => {
      if (!isAuthenticated || !carerProfile?.id) {
        throw new Error('Not authenticated or missing carer profile');
      }
      return uploadDocument(file, carerProfile.id, category, type);
    },
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

  // Handle view document
  const handleViewDocument = async (document: CarerDocument) => {
    try {
      if (!document.file_path) {
        throw new Error('File path not available');
      }

      console.log('[CarerDocuments] Viewing document:', document.file_path);

      // Use signed URL for private bucket access
      const { data, error } = await supabase.storage
        .from('staff-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('[CarerDocuments] Signed URL error:', error);
        throw new Error(`Failed to create secure URL: ${error.message}`);
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        throw new Error('Could not generate secure file URL');
      }
    } catch (error: any) {
      console.error('[CarerDocuments] View error:', error);
      toast({
        title: "View failed",
        description: error.message || "Failed to view document",
        variant: "destructive"
      });
    }
  };

  // Handle download document
  const handleDownloadDocument = async (document: CarerDocument) => {
    try {
      if (!document.file_path) {
        throw new Error('File path not available');
      }

      console.log('[CarerDocuments] Downloading document:', document.file_path);

      const { data, error } = await supabase.storage
        .from('staff-documents')
        .download(document.file_path);

      if (error) {
        console.error('[CarerDocuments] Download error:', error);
        throw new Error(`Failed to download file: ${error.message}`);
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_path.split('/').pop() || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Document download has started.",
      });
    } catch (error: any) {
      console.error('[CarerDocuments] Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document",
        variant: "destructive"
      });
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

  if (loading || isLoading) {
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
                      <h3 className="font-medium">{doc.document_type || 'Document'}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{doc.file_size || 'Unknown size'}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        {doc.expiry_date && (
                          <>
                            <span>•</span>
                            <span>Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="custom" className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                      disabled={!doc.file_path}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                      disabled={!doc.file_path}
                    >
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
