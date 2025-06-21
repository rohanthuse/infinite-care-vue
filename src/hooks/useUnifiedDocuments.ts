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
  has_file?: boolean;
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

  // Enhanced helper function to determine bucket and path from file_path
  const parseBucketAndPath = (filePath: string): { bucket: string; path: string } => {
    if (!filePath || filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
      return { bucket: '', path: '' };
    }
    
    // Check if the path includes bucket prefix
    if (filePath.startsWith('client-documents/')) {
      return {
        bucket: 'client-documents',
        path: filePath.substring('client-documents/'.length)
      };
    }
    
    if (filePath.startsWith('agreement-files/')) {
      return {
        bucket: 'agreement-files',
        path: filePath.substring('agreement-files/'.length)
      };
    }
    
    if (filePath.startsWith('documents/')) {
      return {
        bucket: 'documents',
        path: filePath.substring('documents/'.length)
      };
    }
    
    // Default to documents bucket for unprefixed paths
    return {
      bucket: 'documents',
      path: filePath
    };
  };

  // Check if a file is available in storage across multiple buckets
  const checkFileAvailability = async (filePath?: string): Promise<boolean> => {
    if (!filePath || filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
      return false;
    }

    try {
      const { bucket, path } = parseBucketAndPath(filePath);
      
      if (!bucket || !path) return false;

      console.log(`Checking file availability: bucket=${bucket}, path=${path}`);

      // Try to get file info from storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });

      const fileExists = !error && data && data.length > 0;
      console.log(`File exists check: ${fileExists} for ${bucket}/${path}`);
      
      return fileExists;
    } catch (error) {
      console.error('Error checking file availability:', error);
      return false;
    }
  };

  // Fetch all documents for a branch using the database function
  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['unified-documents', branchId],
    queryFn: async () => {
      console.log('Fetching unified documents for branch:', branchId);
      
      const { data, error } = await supabase.rpc('get_branch_documents', {
        p_branch_id: branchId
      });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      
      console.log('Raw documents from database:', data);
      
      // Add file availability check to each document
      const documentsWithFileStatus = await Promise.all(
        (data as UnifiedDocument[]).map(async (doc) => {
          const hasFile = await checkFileAvailability(doc.file_path);
          console.log(`Document ${doc.name}: has_file=${hasFile}, file_path=${doc.file_path}`);
          return { ...doc, has_file: hasFile };
        })
      );
      
      console.log('Documents with file status:', documentsWithFileStatus);
      return documentsWithFileStatus;
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

      // Upload file to the main documents storage bucket
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

  // Delete document mutation with cross-bucket support
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Delete document record directly since we can only delete from documents table
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

  // Enhanced download document function with cross-bucket support
  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      console.log('Download attempt:', { filePath, fileName });
      
      // Validate inputs
      if (!filePath || !fileName) {
        toast({
          title: "Download Error",
          description: "Document information is incomplete.",
          variant: "destructive",
        });
        return;
      }

      // Check for invalid file paths
      if (filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
        toast({
          title: "File Not Available",
          description: "This document file is no longer available.",
          variant: "destructive",
        });
        return;
      }

      // Parse bucket and path
      const { bucket, path } = parseBucketAndPath(filePath);
      
      if (!bucket || !path) {
        toast({
          title: "Download Error",
          description: "Invalid file path format.",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting to download file:', {
        originalPath: filePath,
        bucket: bucket,
        path: path,
        fileName: fileName
      });

      // Check if file exists before attempting download
      const fileExists = await checkFileAvailability(filePath);
      if (!fileExists) {
        toast({
          title: "File Not Found",
          description: "The document file could not be found in storage.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Supabase storage download error:', error);
        
        // Provide specific error messages based on error type
        let errorMessage = "Failed to download document";
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          errorMessage = "Document file not found.";
        } else if (error.message.includes('access') || error.message.includes('permission')) {
          errorMessage = "Access denied.";
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMessage = "Network error. Please try again.";
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
        description: "An unexpected error occurred while downloading the document.",
        variant: "destructive",
      });
    }
  };

  // Enhanced view document function with cross-bucket support
  const viewDocument = async (filePath: string) => {
    try {
      console.log('View attempt:', { filePath });
      
      // Validate input
      if (!filePath) {
        toast({
          title: "View Error",
          description: "Document path is missing.",
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

      // Parse bucket and path
      const { bucket, path } = parseBucketAndPath(filePath);
      
      if (!bucket || !path) {
        toast({
          title: "View Error",
          description: "Invalid file path format.",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting to view file:', {
        originalPath: filePath,
        bucket: bucket,
        path: path
      });

      // Check if file exists before attempting to view
      const fileExists = await checkFileAvailability(filePath);
      if (!fileExists) {
        toast({
          title: "File Not Found",
          description: "The document file could not be found for viewing.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        console.error('Supabase signed URL error:', error);
        
        // Provide specific error messages
        let errorMessage = "Failed to open document for viewing";
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          errorMessage = "Document file not found.";
        } else if (error.message.includes('access') || error.message.includes('permission')) {
          errorMessage = "Access denied.";
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
        description: "An unexpected error occurred while opening the document.",
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
