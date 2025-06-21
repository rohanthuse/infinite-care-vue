
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface UnifiedDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  file_path?: string;
  file_size?: string;
  file_type?: string;
  uploaded_by_name?: string;
  client_name?: string;
  staff_name?: string;
  tags?: string[];
  status: string;
  created_at: string;
  updated_at: string;
  source_table: string;
  related_entity: string;
}

export interface UploadDocumentData {
  name: string;
  type: string;
  category: string;
  description?: string;
  file: File;
  client_id?: string;
  staff_id?: string;
  form_id?: string;
  agreement_id?: string;
  care_plan_id?: string;
  tags?: string[];
  access_level?: string;
}

export const useUnifiedDocuments = (branchId: string) => {
  const queryClient = useQueryClient();

  // Fetch all documents for a branch using the database function
  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['unified-documents', branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_branch_documents', {
        p_branch_id: branchId
      });

      if (error) throw error;
      return data as UnifiedDocument[];
    },
    enabled: !!branchId,
  });

  // Upload document mutation with improved path handling
  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: UploadDocumentData) => {
      const { file, ...metadata } = documentData;
      
      // Generate unique file path with consistent format
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      
      // Use consistent path format: branchId/fileName (no leading slash)
      const filePath = `${branchId}/${fileName}`;

      console.log('Uploading file with path:', filePath);

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get current user for uploaded_by
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert document record with consistent path
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: metadata.name,
          type: metadata.type,
          category: metadata.category,
          description: metadata.description,
          file_path: uploadData.path, // This will be the consistent format
          file_size: `${(file.size / 1024).toFixed(2)} KB`,
          file_type: file.type,
          uploaded_by: user?.id,
          uploaded_by_name: user?.user_metadata?.full_name || user?.email || 'Unknown',
          branch_id: branchId,
          client_id: metadata.client_id,
          staff_id: metadata.staff_id,
          form_id: metadata.form_id,
          agreement_id: metadata.agreement_id,
          care_plan_id: metadata.care_plan_id,
          tags: metadata.tags || [],
          access_level: metadata.access_level || 'branch',
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log('Successfully uploaded and recorded document:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-documents', branchId] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error) => {
      console.error('Upload mutation error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedDocument> }) => {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-documents', branchId] });
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update document: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Get document to find file path
      const { data: document } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      // Delete from storage if file exists
      if (document?.file_path) {
        const normalizedPath = normalizeFilePath(document.file_path);
        if (normalizedPath) {
          await supabase.storage
            .from('documents')
            .remove([normalizedPath]);
        }
      }

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-documents', branchId] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete document: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Enhanced helper function to normalize file paths
  const normalizeFilePath = (filePath: string): string => {
    if (!filePath || filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
      console.warn('Invalid file path detected:', filePath);
      return '';
    }
    
    let normalizedPath = filePath.trim();
    
    // Remove any leading slashes
    normalizedPath = normalizedPath.replace(/^\/+/, '');
    
    // Remove common prefixes that might be incorrectly included
    const prefixesToRemove = [
      'documents/',
      'storage/v1/object/public/documents/',
      'https://vcrjntfjsmpoupgairep.supabase.co/storage/v1/object/public/documents/',
      'public/documents/',
      '/documents/',
    ];
    
    for (const prefix of prefixesToRemove) {
      if (normalizedPath.startsWith(prefix)) {
        normalizedPath = normalizedPath.substring(prefix.length);
        break;
      }
    }
    
    // Handle edge cases where path might just be the filename without branch folder
    if (normalizedPath && !normalizedPath.includes('/') && normalizedPath.length > 0) {
      // If it's just a filename, we can't determine which branch folder it belongs to
      console.warn('File path missing branch folder structure:', normalizedPath);
      return normalizedPath; // Return as-is and let storage handle the error
    }
    
    console.log('Normalized path:', filePath, '->', normalizedPath);
    return normalizedPath;
  };

  // Check if file exists in storage
  const checkFileExists = async (filePath: string): Promise<boolean> => {
    try {
      const normalizedPath = normalizeFilePath(filePath);
      if (!normalizedPath) return false;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .list(normalizedPath.split('/').slice(0, -1).join('/'), {
          search: normalizedPath.split('/').pop()
        });
      
      if (error) {
        console.error('Error checking file existence:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error in checkFileExists:', error);
      return false;
    }
  };

  // Enhanced download document function
  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      console.log('Download attempt:', { filePath, fileName });
      
      // Validate inputs
      if (!filePath || !fileName) {
        toast({
          title: "Download Error",
          description: "Document information is incomplete. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Check for invalid file paths
      if (filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
        toast({
          title: "File Not Available",
          description: "This document file is no longer available. It may have been moved or deleted.",
          variant: "destructive",
        });
        return;
      }

      // Normalize the file path
      const normalizedPath = normalizeFilePath(filePath);
      
      if (!normalizedPath) {
        toast({
          title: "Download Error",
          description: "Invalid file path format. Please contact support if this persists.",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting to download file:', {
        originalPath: filePath,
        normalizedPath: normalizedPath,
        fileName: fileName
      });

      // Check if file exists before attempting download
      const fileExists = await checkFileExists(filePath);
      if (!fileExists) {
        toast({
          title: "File Not Found",
          description: "The document file could not be found in storage. It may have been moved or deleted.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(normalizedPath);

      if (error) {
        console.error('Supabase storage download error:', error);
        
        // Provide specific error messages based on error type
        let errorMessage = "Failed to download document";
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          errorMessage = "Document file not found. It may have been moved or deleted.";
        } else if (error.message.includes('access') || error.message.includes('permission')) {
          errorMessage = "Access denied. You don't have permission to download this file.";
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('bucket')) {
          errorMessage = "Storage configuration error. Please contact support.";
        }
        
        toast({
          title: "Download Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
      
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "An unexpected error occurred while downloading the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enhanced view document function
  const viewDocument = async (filePath: string) => {
    try {
      console.log('View attempt:', { filePath });
      
      // Validate input
      if (!filePath) {
        toast({
          title: "View Error",
          description: "Document path is missing. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Check for invalid file paths
      if (filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
        toast({
          title: "File Not Available",
          description: "This document file is no longer available for viewing.",
          variant: "destructive",
        });
        return;
      }

      // Normalize the file path
      const normalizedPath = normalizeFilePath(filePath);
      
      if (!normalizedPath) {
        toast({
          title: "View Error",
          description: "Invalid file path format. Please contact support if this persists.",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting to view file:', {
        originalPath: filePath,
        normalizedPath: normalizedPath
      });

      // Check if file exists before attempting to view
      const fileExists = await checkFileExists(filePath);
      if (!fileExists) {
        toast({
          title: "File Not Found",
          description: "The document file could not be found for viewing. It may have been moved or deleted.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(normalizedPath, 3600); // 1 hour expiry

      if (error) {
        console.error('Supabase signed URL error:', error);
        
        // Provide specific error messages
        let errorMessage = "Failed to open document for viewing";
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          errorMessage = "Document file not found. It may have been moved or deleted.";
        } else if (error.message.includes('access') || error.message.includes('permission')) {
          errorMessage = "Access denied. You don't have permission to view this file.";
        } else if (error.message.includes('bucket')) {
          errorMessage = "Storage configuration error. Please contact support.";
        }
        
        toast({
          title: "View Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Open in new tab
      window.open(data.signedUrl, '_blank');
      
    } catch (error: any) {
      console.error('View error:', error);
      toast({
        title: "View Failed",
        description: "An unexpected error occurred while opening the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    documents,
    isLoading,
    error,
    uploadDocument: uploadDocumentMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    downloadDocument,
    viewDocument,
    isUploading: uploadDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
};
