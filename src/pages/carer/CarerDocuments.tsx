import React, { useEffect, useState } from "react";
import { FileText, Search, Download, Eye, Clock, Filter, Loader2, Upload, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCarerSharedDocuments, useSharedDocumentActions } from "@/hooks/useAdminSharedDocuments";
import { useCarerDocuments } from "@/hooks/useCarerDocuments";
import { AdminSharedDocuments } from "@/components/documents/AdminSharedDocuments";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";


const CarerDocuments: React.FC = () => {
  const [carerId, setCarerId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, filePath: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const fetchCarerId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (staffData) {
          setCarerId(staffData.id);
        }
      }
    };
    
    fetchCarerId();
  }, []);

  // Fetch data using hooks
  const { data: sharedDocuments = [], isLoading: isLoadingShared } = useCarerSharedDocuments(carerId);
  const { data: carerDocuments = [], isLoading: isLoadingDocuments, refetch: refetchDocuments } = useCarerDocuments(carerId);
  const { viewDocument, downloadDocument } = useSharedDocumentActions();

  // Get documents uploaded by the carer (from staff_documents table)
  const myDocuments = carerDocuments.filter(doc => 
    doc.source_type === 'document' && doc.file_path
  );

  // Apply search and filter to documents
  const filteredMyDocuments = myDocuments.filter(doc => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        doc.file_name?.toLowerCase().includes(query) ||
        doc.document_type?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    // Type filter
    if (filterType !== 'all' && doc.document_type !== filterType) {
      return false;
    }
    return true;
  });

  // Get unique document types for filter dropdown
  const documentTypes = Array.from(new Set(myDocuments.map(doc => doc.document_type).filter(Boolean)));

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${carerId}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const formattedSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

      // Create document record
      const { error: docError } = await supabase.rpc('upload_staff_document_bypass_rls', {
        p_staff_id: carerId,
        p_document_type: documentType,
        p_file_path: filePath,
        p_file_size: formattedSize,
        p_file_name: documentName,
        p_description: description || null
      });
      
      if (docError) {
        await supabase.storage.from('staff-documents').remove([filePath]);
        throw docError;
      }

      return { filePath };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['carer-documents', carerId] });
      refetchDocuments();
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      handleCloseUploadDialog();
      
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
              document_id: data?.filePath || 'unknown',
              document_name: documentName || documentType,
              branch_id: staffData.branch_id,
              notify_admins_staff: true,
              staff_id: carerId,
              staff_name: staffName,
              upload_timestamp: new Date().toISOString()
            }
          });
          console.log('[CarerDocuments] Admin notification triggered for staff upload');
        }
      } catch (notifErr) {
        console.error('[CarerDocuments] Failed to trigger notification:', notifErr);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload document: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      if (filePath) {
        await supabase.storage.from('staff-documents').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('staff_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-documents', carerId] });
      refetchDocuments();
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete document: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // File handling functions
  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, JPG, or PNG files only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocumentType('');
    setDocumentName('');
    setDescription('');
    setDragActive(false);
  };

  const handleUploadSubmit = () => {
    if (selectedFile && documentType) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDeleteClick = (id: string, filePath: string) => {
    setDocumentToDelete({ id, filePath });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
    }
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('staff-documents')
        .createSignedUrl(filePath, 60);
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data } = await supabase.storage
        .from('staff-documents')
        .download(filePath);
      
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300', label: 'Completed' },
      'in-progress': { bg: 'bg-blue-600', text: 'text-white', label: 'In Progress' },
      'not-started': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'Not Started' },
      'expired': { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300', label: 'Expired' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap['not-started'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.text}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Documents</h1>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search documents..." 
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-initial gap-2"
            onClick={() => setFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            {filterType !== 'all' && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                1
              </span>
            )}
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)} className="flex-1 sm:flex-initial gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload Document</span>
            <span className="sm:hidden">Upload</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="my-documents" className="w-full">
        <TabsList className="w-full mb-6 grid grid-cols-2">
          <TabsTrigger value="my-documents">My Documents</TabsTrigger>
          <TabsTrigger value="admin-shared">Admin Shared</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-documents" className="w-full mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>My Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading documents...</span>
                </div>
              ) : filteredMyDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {myDocuments.length === 0 ? (
                    <>
                      <p>No documents uploaded yet.</p>
                      <p className="text-sm mt-2">Upload your first document to get started.</p>
                      <Button 
                        onClick={() => setUploadDialogOpen(true)} 
                        className="mt-4"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </>
                  ) : (
                    <>
                      <p>No documents match your search or filter criteria.</p>
                      <Button 
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                        }} 
                        className="mt-4"
                        variant="outline"
                      >
                        Clear Filters
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>File Size</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMyDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.file_name || doc.document_type}
                          </div>
                        </TableCell>
                        <TableCell>{doc.document_type}</TableCell>
                        <TableCell>{doc.file_size || 'N/A'}</TableCell>
                        <TableCell>{formatDate(doc.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => doc.file_path && handleViewDocument(doc.file_path)}
                              disabled={!doc.file_path}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => doc.file_path && handleDownloadDocument(doc.file_path, doc.file_name || 'document')}
                              disabled={!doc.file_path}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => doc.file_path && handleDeleteClick(doc.id, doc.file_path)}
                              disabled={!doc.file_path}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        <TabsContent value="admin-shared" className="w-full mt-0">
          <AdminSharedDocuments
            documents={sharedDocuments}
            isLoading={isLoadingShared}
            title="Documents Shared by Admin"
            emptyMessage="No documents have been shared with you by the admin."
          />
        </TabsContent>
      </Tabs>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Documents</DialogTitle>
            <DialogDescription>
              Filter documents by type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filter-type">Document Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setFilterType('all');
                setFilterDialogOpen(false);
              }}
            >
              Clear
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={handleCloseUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to your profile. Allowed formats: PDF, JPG, PNG (Max 10MB)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>Select File</Label>
              {!selectedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-border/80"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your file here, or click to browse
                  </p>
                  <input
                    type="file"
                    id="file-upload-carer"
                    className="hidden"
                    onChange={handleInputChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload-carer')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID Proof">ID Proof (Passport, License, etc.)</SelectItem>
                  <SelectItem value="DBS Certificate">DBS Certificate</SelectItem>
                  <SelectItem value="Professional Certificate">Professional Certificate</SelectItem>
                  <SelectItem value="Training Certificate">Training Certificate</SelectItem>
                  <SelectItem value="Insurance Document">Insurance Document</SelectItem>
                  <SelectItem value="Medical Certificate">Medical Certificate</SelectItem>
                  <SelectItem value="Other">Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Document Name Field */}
            <div className="space-y-2">
              <Label htmlFor="document-name">
                Document Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="document-name"
                placeholder="Enter document name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                required
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                placeholder="Add notes or description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseUploadDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadSubmit} 
              disabled={
                !selectedFile || 
                !documentType || 
                !documentName.trim() ||
                uploadMutation.isPending
              }
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CarerDocuments;
