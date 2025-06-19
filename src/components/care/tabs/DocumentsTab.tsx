import React, { useState, useCallback } from "react";
import { format } from "date-fns";
import { File, FileText, FilePlus, Clock, Download, Eye, Edit, Trash2, Upload, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  useClientDocuments, 
  useUploadClientDocument, 
  useUpdateClientDocument, 
  useDeleteClientDocument,
  useViewClientDocument,
  useDownloadClientDocument,
  type ClientDocument 
} from "@/hooks/useClientDocuments";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DocumentsTabProps {
  clientId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingDocument, setEditingDocument] = useState<ClientDocument | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '',
    type: ''
  });
  
  const { data: documents = [], isLoading, error } = useClientDocuments(clientId);
  const uploadDocumentMutation = useUploadClientDocument();
  const updateDocumentMutation = useUpdateClientDocument();
  const deleteDocumentMutation = useDeleteClientDocument();
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();
  const { user } = useAuth();

  const documentTypes = [
    'General Document',
    'Medical Report',
    'Care Plan',
    'Assessment',
    'Legal Document',
    'Insurance',
    'Prescription',
    'Photo/Image'
  ];

  console.log('[DocumentsTab] Render:', { 
    clientId, 
    documentsCount: documents.length, 
    isLoading, 
    error: error?.message,
    uploadDialogOpen: isUploadDialogOpen,
    selectedFileName: selectedFile?.name,
    uploadDataName: uploadData.name,
    uploadDataType: uploadData.type
  });

  const resetUploadState = useCallback(() => {
    console.log('[DocumentsTab] Resetting upload state');
    setSelectedFile(null);
    setUploadData({ name: '', type: '' });
    setIsUploading(false);
    setDragActive(false);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      console.log('[DocumentsTab] File dropped:', file.name);
      setSelectedFile(file);
      setUploadData({
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        type: documentTypes[0] // Default to first type
      });
      setIsUploadDialogOpen(true);
    }
  }, [documentTypes]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('[DocumentsTab] File selected:', file.name);
      setSelectedFile(file);
      setUploadData({
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        type: documentTypes[0] // Default to first type
      });
      setIsUploadDialogOpen(true);
    }
  }, [documentTypes]);

  const handleUpload = async () => {
    if (!selectedFile || isUploading) {
      console.warn('[DocumentsTab] Cannot upload: missing file or already uploading');
      return;
    }
    
    // Validate required fields
    if (!uploadData.name.trim()) {
      toast.error('Please enter a document name');
      return;
    }
    
    if (!uploadData.type.trim()) {
      toast.error('Please select a document type');
      return;
    }
    
    console.log('[DocumentsTab] Starting upload:', uploadData);
    setIsUploading(true);
    
    try {
      await uploadDocumentMutation.mutateAsync({
        clientId,
        file: selectedFile,
        name: uploadData.name.trim(),
        type: uploadData.type.trim(),
        uploaded_by: user?.email || 'Current User',
      });
      
      console.log('[DocumentsTab] Upload completed successfully');
      setIsUploadDialogOpen(false);
      resetUploadState();
    } catch (error) {
      console.error('[DocumentsTab] Upload failed:', error);
      // Error is handled by the mutation
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseUploadDialog = useCallback(() => {
    if (isUploading) {
      toast.warning('Please wait for the upload to complete');
      return;
    }
    console.log('[DocumentsTab] Closing upload dialog');
    setIsUploadDialogOpen(false);
    resetUploadState();
  }, [isUploading, resetUploadState]);

  const handleEdit = (document: ClientDocument) => {
    setEditingDocument(document);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingDocument) return;
    
    try {
      await updateDocumentMutation.mutateAsync({
        id: editingDocument.id,
        name: editingDocument.name,
        type: editingDocument.type,
        uploaded_by: editingDocument.uploaded_by,
      });
      setIsEditDialogOpen(false);
      setEditingDocument(null);
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update document');
    }
  };

  const handleDelete = async (document: ClientDocument) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteDocumentMutation.mutateAsync(document.id);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleViewDocument = (document: ClientDocument) => {
    if (document.file_path) {
      viewDocumentMutation.mutate({ filePath: document.file_path });
    } else {
      toast.error('Document file path not available');
    }
  };

  const handleDownloadDocument = (document: ClientDocument) => {
    if (document.file_path) {
      downloadDocumentMutation.mutate({ 
        filePath: document.file_path, 
        fileName: document.name 
      });
    } else {
      toast.error('Document file path not available');
    }
  };

  const getDocIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'medical report': 
      case 'care plan': 
      case 'assessment': 
        return <File className="h-4 w-4 text-red-500" />;
      case 'legal document': 
      case 'insurance': 
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'photo/image':
        return <File className="h-4 w-4 text-green-500" />;
      default: 
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const canEditDelete = (document: ClientDocument) => {
    return user?.email === document.uploaded_by;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('[DocumentsTab] Error loading documents:', error);
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load documents</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Documents</span>
            </CardTitle>
            <CardDescription>Manage client documents and files</CardDescription>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </span>
              </Button>
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Enhanced Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FilePlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop files here or{' '}
            <label htmlFor="file-upload" className="text-blue-600 cursor-pointer hover:underline font-medium">
              browse to upload
            </label>
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">No documents have been uploaded for this client yet.</p>
            <label htmlFor="file-upload">
              <Button asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow group"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                    {getDocIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span>Uploaded by {doc.uploaded_by}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{format(new Date(doc.upload_date), 'MMM dd, yyyy')}</span>
                      {doc.file_size && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{doc.file_size}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{doc.type}</Badge>
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="View Document"
                    onClick={() => handleViewDocument(doc)}
                    disabled={viewDocumentMutation.isPending}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="Download Document"
                    onClick={() => handleDownloadDocument(doc)}
                    disabled={downloadDocumentMutation.isPending}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canEditDelete(doc) && (
                    <>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Edit Document"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Delete Document"
                        onClick={() => handleDelete(doc)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={handleCloseUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="filename" className="text-sm font-medium">
                  Document Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="filename"
                  value={uploadData.name}
                  onChange={(e) => {
                    console.log('[DocumentsTab] Name changed:', e.target.value);
                    setUploadData(prev => ({ ...prev, name: e.target.value }));
                  }}
                  placeholder="Enter document name"
                  className="mt-1"
                  disabled={isUploading}
                />
              </div>
              <div>
                <Label htmlFor="doctype" className="text-sm font-medium">
                  Document Type <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={uploadData.type} 
                  onValueChange={(value) => {
                    console.log('[DocumentsTab] Type changed:', value);
                    setUploadData(prev => ({ ...prev, type: value }));
                  }}
                  disabled={isUploading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedFile && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleCloseUploadDialog}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || !uploadData.name.trim() || !uploadData.type.trim()}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
            </DialogHeader>
            {editingDocument && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-filename">Document Name</Label>
                  <Input
                    id="edit-filename"
                    value={editingDocument.name}
                    onChange={(e) => setEditingDocument({...editingDocument, name: e.target.value})}
                    placeholder="Enter document name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-doctype">Document Type</Label>
                  <Select 
                    value={editingDocument.type} 
                    onValueChange={(value) => setEditingDocument({...editingDocument, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingDocument(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateDocumentMutation.isPending || !editingDocument?.name.trim()}
              >
                {updateDocumentMutation.isPending ? "Updating..." : "Update Document"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
