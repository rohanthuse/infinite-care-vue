import React, { useState } from 'react';
import { Upload, FileText, Eye, Download, Plus, X, AlertCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCarerDocuments } from '@/hooks/useCarerDocuments';
import { EntityDocumentsSection } from '@/components/documents/EntityDocumentsSection';

interface CarerDocumentsTabProps {
  carerId: string;
}

// Document upload function
const uploadStaffDocument = async (file: File, carerId: string, documentType: string) => {
  console.log('[CarerDocumentsTab] Starting upload for:', file.name, 'Type:', documentType);
  
  // Get current session to verify auth
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session) {
    console.error('[CarerDocumentsTab] Authentication error:', authError);
    throw new Error('User not authenticated or session expired');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${carerId}/${fileName}`;
  
  console.log('[CarerDocumentsTab] Uploading to path:', filePath);
  
  try {
    // Upload to staff-documents storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('staff-documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('[CarerDocumentsTab] Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    console.log('[CarerDocumentsTab] File uploaded successfully to storage');

    const formattedSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

    // Use the bypass RLS function to create document record (pass all 7 params explicitly)
    const { data: result, error: docError } = await supabase.rpc('upload_staff_document_bypass_rls', {
      p_staff_id: carerId,
      p_document_type: documentType,
      p_file_path: filePath,
      p_file_size: formattedSize,
      p_expiry_date: null,
      p_file_name: file.name,
      p_description: null
    });
    
    if (docError) {
      console.error('[CarerDocumentsTab] Database function error:', docError);
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
    console.log('[CarerDocumentsTab] Document record created with ID:', documentId);
    return { id: documentId, file_path: filePath, document_type: documentType };
  } catch (error) {
    console.error('[CarerDocumentsTab] Upload failed:', error);
    throw error;
  }
};

// Check if user has permission to delete staff documents
const checkDeletePermission = async (staffId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if user is super admin
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  
  if (roles?.some(r => r.role === 'super_admin')) {
    return true;
  }

  // Check if user is branch admin for this staff member's branch
  const { data: staff } = await supabase
    .from('staff')
    .select('branch_id')
    .eq('id', staffId)
    .single();

  if (staff) {
    const { data: adminBranch } = await supabase
      .from('admin_branches')
      .select('branch_id')
      .eq('admin_id', user.id)
      .eq('branch_id', staff.branch_id)
      .single();
    
    if (adminBranch) return true;
  }

  // Check if user is the staff member themselves
  const { data: ownStaff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('id', staffId)
    .single();

  return !!ownStaff;
};

// Document delete function with better error handling
const deleteStaffDocument = async (documentId: string, filePath: string | undefined) => {
  console.log('[CarerDocumentsTab] Starting delete for document:', documentId);
  
  // Validate document ID format (should not be a training cert ID)
  if (documentId.includes('-cert-')) {
    throw new Error('Training certifications cannot be deleted from this screen');
  }

  try {
    // Try to delete file from storage, but don't fail if it doesn't exist
    if (filePath && filePath.trim() !== '') {
      console.log('[CarerDocumentsTab] Attempting to delete file from storage:', filePath);
      
      const { error: storageError } = await supabase.storage
        .from('staff-documents')
        .remove([filePath]);

      if (storageError) {
        // Log error but continue - file might already be deleted
        console.warn('[CarerDocumentsTab] Storage delete warning:', storageError.message);
      } else {
        console.log('[CarerDocumentsTab] File deleted from storage successfully');
      }
    }

    // Delete from database with better error messages
    console.log('[CarerDocumentsTab] Deleting database record for ID:', documentId);
    
    const { error: dbError, count } = await supabase
      .from('staff_documents')
      .delete({ count: 'exact' })
      .eq('id', documentId);

    if (dbError) {
      console.error('[CarerDocumentsTab] Database delete error:', dbError);
      throw new Error(`Failed to delete document from database: ${dbError.message}`);
    }

    if (count === 0) {
      console.error('[CarerDocumentsTab] No rows deleted - permission denied or document not found');
      throw new Error('Unable to delete document. You may not have permission or the document may not exist.');
    }

    console.log('[CarerDocumentsTab] Successfully deleted', count, 'database record(s)');

  } catch (error) {
    console.error('[CarerDocumentsTab] Delete operation failed:', error);
    throw error;
  }
};

// Document download function with signed URLs and better error handling
const downloadDocument = async (filePath: string, fileName: string, sourceType: 'document' | 'training_certification') => {
  try {
    console.log('[CarerDocumentsTab] Downloading file:', filePath);
    
    if (!filePath || filePath.trim() === '') {
      throw new Error('Invalid file path');
    }

    const bucketName = sourceType === 'training_certification' 
      ? 'staff-documents'
      : 'staff-documents';

    // First check if file exists
    const pathParts = filePath.split('/');
    const folder = pathParts.length > 1 ? pathParts[0] : '';
    const searchName = pathParts.length > 1 ? pathParts[pathParts.length - 1] : filePath;

    const { data: fileList, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folder, {
        search: searchName
      });

    if (listError || !fileList || fileList.length === 0) {
      throw new Error('File not found in storage. It may have been deleted or never uploaded.');
    }

    // Use signed URL for private buckets
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60); // 60 second expiry

    if (urlError || !urlData) {
      console.error('[CarerDocumentsTab] Signed URL error:', urlError);
      throw new Error(`Failed to generate download link: ${urlError?.message || 'Unknown error'}`);
    }

    // Download via signed URL
    const response = await fetch(urlData.signedUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[CarerDocumentsTab] Download successful');
  } catch (error) {
    console.error('[CarerDocumentsTab] Download failed:', error);
    throw error;
  }
};

export const CarerDocumentsTab: React.FC<CarerDocumentsTabProps> = ({ carerId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; filePath?: string; name: string } | null>(null);
  const [downloadingDocIds, setDownloadingDocIds] = useState<Set<string>>(new Set());
  const [activeDocTab, setActiveDocTab] = useState('staff-documents');

  // Fetch documents using existing hook
  const { data: documents = [], isLoading } = useCarerDocuments(carerId);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) => 
      uploadStaffDocument(file, carerId, documentType),
    onSuccess: async (data) => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['carer-documents', carerId] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentType('');
      
      // Trigger notification for Branch Admins
      try {
        const { data: staffData } = await supabase
          .from('staff')
          .select('branch_id, first_name, last_name')
          .eq('id', carerId)
          .single();

        if (staffData?.branch_id) {
          const staffName = `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim() || 'A staff member';
          
          await supabase.functions.invoke('create-document-notifications', {
            body: {
              document_id: data?.id || 'unknown',
              document_name: data?.document_type || documentType,
              branch_id: staffData.branch_id,
              notify_admins_staff: true,
              staff_id: carerId,
              staff_name: staffName,
              upload_timestamp: new Date().toISOString()
            }
          });
          console.log('[CarerDocumentsTab] Admin notification triggered for staff upload');
        }
      } catch (notifErr) {
        console.error('[CarerDocumentsTab] Failed to trigger notification:', notifErr);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Download mutation - now tracks individual documents
  const downloadMutation = useMutation({
    mutationFn: ({ filePath, fileName, sourceType }: { 
      filePath: string; 
      fileName: string;
      sourceType: 'document' | 'training_certification';
    }) => downloadDocument(filePath, fileName, sourceType),
    onSuccess: (_, variables) => {
      // Remove from downloading set
      setDownloadingDocIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.filePath);
        return newSet;
      });
      toast({
        title: "Download Started",
        description: "File download has begun",
      });
    },
    onError: (error: Error, variables) => {
      // Remove from downloading set
      setDownloadingDocIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.filePath);
        return newSet;
      });
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation with better cache handling
  const deleteMutation = useMutation({
    mutationFn: async ({ documentId, filePath }: { documentId: string; filePath?: string }) => {
      await deleteStaffDocument(documentId, filePath);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      
      // More aggressive cache invalidation
      await queryClient.invalidateQueries({ 
        queryKey: ['carer-documents', carerId],
        exact: true 
      });
      
      // Force refetch immediately
      await queryClient.refetchQueries({ 
        queryKey: ['carer-documents', carerId],
        exact: true 
      });
      
      // Small delay before closing dialog to ensure UI updates
      setTimeout(() => {
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
      }, 300);
    },
    onError: (error: Error) => {
      console.error('[CarerDocumentsTab] Delete failed:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  const handleUploadSubmit = () => {
    if (!selectedFile || !documentType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and document type",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, documentType });
  };

  const handleDownload = (doc: any) => {
    // Validate file path exists
    if (!doc.file_path || doc.file_path.trim() === '') {
      toast({
        title: "Download Error",
        description: "File path not available for this document",
        variant: "destructive",
      });
      return;
    }

    // Add to downloading set
    setDownloadingDocIds(prev => new Set(prev).add(doc.file_path));

    const fileName = doc.source_type === 'training_certification' 
      ? (doc.file_name || `${doc.training_course_name}_certificate`)
      : doc.document_type;

    downloadMutation.mutate({ 
      filePath: doc.file_path, 
      fileName,
      sourceType: doc.source_type
    });
  };

  const handleDeleteClick = async (doc: any) => {
    // Double-check that we can only delete regular documents
    if (doc.source_type !== 'document') {
      toast({
        title: "Cannot Delete",
        description: "Training certifications cannot be deleted from here. Manage them in the Training section.",
        variant: "destructive",
      });
      return;
    }

    // Check permission before showing delete dialog
    const hasPermission = await checkDeletePermission(doc.staff_id);
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete this staff member's documents.",
        variant: "destructive",
      });
      return;
    }

    setDocumentToDelete({
      id: doc.id,
      filePath: doc.file_path,
      name: doc.document_type
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!documentToDelete) return;
    deleteMutation.mutate({ 
      documentId: documentToDelete.id, 
      filePath: documentToDelete.filePath 
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'valid':
      case 'completed':
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'expired':
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const documentTypeOptions = [
    'DBS Certificate',
    'Professional Certification',
    'Training Certificate',
    'Personal ID',
    'Reference',
    'Medical Certificate',
    'Insurance Document',
    'Contract',
    'Other'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <Tabs value={activeDocTab} onValueChange={setActiveDocTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff-documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Staff Documents
          </TabsTrigger>
          <TabsTrigger value="admin-shared" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Shared Documents from Admin
          </TabsTrigger>
        </TabsList>

        {/* Staff Documents Tab */}
        <TabsContent value="staff-documents" className="mt-4">
          <div className="space-y-4">
            {/* Header with Upload Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Staff Documents & Certifications</h3>
                <p className="text-sm text-gray-600">Manage staff-specific documents and certifications</p>
              </div>
              <Button 
                onClick={() => setUploadDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Upload Document
              </Button>
            </div>

            {/* Documents List */}
            <Card>
              <CardContent className="p-6">
                {documents.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <p className="font-semibold text-gray-900">
                              {doc.source_type === 'training_certification' ? doc.file_name : doc.document_type}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={
                                doc.source_type === 'training_certification' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }
                            >
                              {doc.source_type === 'training_certification' ? 'Training Certification' : 'Document'}
                            </Badge>
                          </div>
                          {doc.source_type === 'training_certification' && doc.training_course_name && (
                            <p className="text-sm text-blue-600 font-medium">
                              Course: {doc.training_course_name}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {doc.source_type === 'training_certification' && doc.completion_date
                              ? `Completed: ${formatDate(doc.completion_date)}`
                              : doc.expiry_date 
                                ? `Expires: ${formatDate(doc.expiry_date)}` 
                                : `Created: ${formatDate(doc.created_at)}`
                            }
                          </p>
                          {doc.file_size && (
                            <p className="text-xs text-gray-500">Size: {doc.file_size}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(doc.status)}
                          >
                            {doc.status}
                          </Badge>
                          {doc.file_path && doc.file_path.trim() !== '' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              disabled={downloadingDocIds.has(doc.file_path)}
                              className="flex items-center gap-1"
                            >
                              {downloadingDocIds.has(doc.file_path) ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3" />
                                  Download
                                </>
                              )}
                            </Button>
                          )}
                          {doc.source_type === 'document' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(doc)}
                              disabled={deleteMutation.isPending}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No documents on file</p>
                    <Button 
                      onClick={() => setUploadDialogOpen(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Upload First Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shared Documents from Admin Tab */}
        <TabsContent value="admin-shared" className="mt-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Shared Documents from Admin</h3>
              <p className="text-sm text-gray-600">Documents uploaded through the main Documents tab</p>
            </div>
            <EntityDocumentsSection 
              entityType="staff"
              entityId={carerId}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Staff Document</DialogTitle>
            <DialogDescription>
              Upload a new document for this staff member's profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Click to select a file or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF
                  </p>
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadSubmit}
              disabled={!selectedFile || !documentType || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{documentToDelete?.name}</strong>?
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone.
              </p>
              <p className="text-sm text-muted-foreground">
                The file will be removed from storage and the document record will be deleted.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};