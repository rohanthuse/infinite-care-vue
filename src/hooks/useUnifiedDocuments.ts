
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

  // Enhanced helper function to determine bucket and path from file_path with improved fallback logic
  const parseBucketAndPath = (filePath: string): { bucket: string; path: string } => {
    if (!filePath || filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
      console.log('Invalid file path:', filePath);
      return { bucket: '', path: '' };
    }
    
    console.log('Parsing file path:', filePath);
    
    // Check if the path includes bucket prefix
    if (filePath.startsWith('client-documents/')) {
      const path = filePath.substring('client-documents/'.length);
      console.log('Detected client-documents bucket, path:', path);
      return {
        bucket: 'client-documents',
        path: path
      };
    }
    
    if (filePath.startsWith('agreement-files/')) {
      const path = filePath.substring('agreement-files/'.length);
      console.log('Detected agreement-files bucket, path:', path);
      return {
        bucket: 'agreement-files',
        path: path
      };
    }
    
    if (filePath.startsWith('documents/')) {
      const path = filePath.substring('documents/'.length);
      console.log('Detected documents bucket, path:', path);
      return {
        bucket: 'documents',
        path: path
      };
    }
    
    // For legacy paths without bucket prefix, try to determine bucket from context
    // Default to documents bucket for unprefixed paths
    console.log('No bucket prefix detected, defaulting to documents bucket');
    return {
      bucket: 'documents',
      path: filePath
    };
  };

  // Enhanced file availability check with multiple bucket fallback logic
  const checkFileAvailability = async (filePath?: string, sourceTable?: string): Promise<boolean> => {
    if (!filePath || filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
      console.log('File availability check: Invalid file path');
      return false;
    }

    console.log('Checking file availability for:', { filePath, sourceTable });

    try {
      // Primary bucket based on path parsing
      const { bucket, path } = parseBucketAndPath(filePath);
      
      if (!bucket || !path) {
        console.log('Could not parse bucket and path');
        return false;
      }

      console.log(`Primary check: bucket=${bucket}, path=${path}`);

      // Try to get file info from the parsed bucket first
      const { data: primaryData, error: primaryError } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/') || '', {
          search: path.split('/').pop()
        });

      if (!primaryError && primaryData && primaryData.length > 0) {
        console.log(`File found in primary bucket ${bucket}:`, primaryData[0]);
        return true;
      }

      console.log(`File not found in primary bucket ${bucket}, trying fallback strategies`);

      // Fallback strategy 1: If we tried documents bucket, also try client-documents bucket
      if (bucket === 'documents' && sourceTable === 'client_documents') {
        console.log('Trying client-documents bucket as fallback');
        const clientPath = `client-documents/${path}`;
        const fallbackResult = await checkSingleBucket('client-documents', path);
        if (fallbackResult) {
          console.log('File found in client-documents bucket via fallback');
          return true;
        }
      }

      // Fallback strategy 2: For paths without bucket prefix, try multiple buckets based on source
      if (!filePath.includes('/') || !filePath.startsWith('client-documents/') && !filePath.startsWith('agreement-files/') && !filePath.startsWith('documents/')) {
        console.log('Trying multiple buckets for unprefixed path');
        
        const bucketsToTry = sourceTable === 'client_documents' 
          ? ['client-documents', 'documents'] 
          : sourceTable === 'agreement_files'
          ? ['agreement-files', 'documents']
          : ['documents', 'client-documents'];
        
        for (const tryBucket of bucketsToTry) {
          console.log(`Trying bucket: ${tryBucket}`);
          const result = await checkSingleBucket(tryBucket, path);
          if (result) {
            console.log(`File found in ${tryBucket} bucket`);
            return true;
          }
        }
      }

      console.log('File not found in any bucket');
      return false;
    } catch (error) {
      console.error('Error checking file availability:', error);
      return false;
    }
  };

  // Helper function to check a single bucket
  const checkSingleBucket = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const pathParts = path.split('/');
      const fileName = pathParts.pop();
      const folderPath = pathParts.join('/');
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folderPath || '', {
          search: fileName
        });

      const found = !error && data && data.length > 0;
      console.log(`Single bucket check ${bucket}/${path}:`, found ? 'found' : 'not found');
      return found;
    } catch (error) {
      console.error(`Error checking bucket ${bucket}:`, error);
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
      
      // Add file availability check to each document with enhanced logic
      const documentsWithFileStatus = await Promise.all(
        (data as UnifiedDocument[]).map(async (doc) => {
          console.log(`\n--- Processing document: ${doc.name} ---`);
          console.log(`Source table: ${doc.source_table}`);
          console.log(`File path: ${doc.file_path}`);
          
          const hasFile = await checkFileAvailability(doc.file_path, doc.source_table);
          console.log(`Final result for ${doc.name}: has_file=${hasFile}`);
          
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

  // Delete document mutation
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

  // Enhanced download document function with improved bucket resolution
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

      // Parse bucket and path with enhanced logic
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

      // Try to download from the parsed bucket
      let downloadData, downloadError;
      
      ({ data: downloadData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(path));

      // If download failed and we're using documents bucket, try client-documents as fallback
      if (downloadError && bucket === 'documents') {
        console.log('Primary download failed, trying client-documents bucket');
        ({ data: downloadData, error: downloadError } = await supabase.storage
          .from('client-documents')
          .download(path));
      }

      if (downloadError) {
        console.error('Supabase storage download error:', downloadError);
        
        // Provide specific error messages based on error type
        let errorMessage = "Failed to download document";
        if (downloadError.message.includes('not found') || downloadError.message.includes('does not exist')) {
          errorMessage = "Document file not found.";
        } else if (downloadError.message.includes('access') || downloadError.message.includes('permission')) {
          errorMessage = "Access denied.";
        } else if (downloadError.message.includes('network') || downloadError.message.includes('timeout')) {
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
      const url = window.URL.createObjectURL(downloadData);
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

  // Enhanced view document function with improved bucket resolution
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

      // Parse bucket and path with enhanced logic
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

      // Try to create signed URL from the parsed bucket
      let signedUrlData, signedUrlError;
      
      ({ data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600)); // 1 hour expiry

      // If signed URL creation failed and we're using documents bucket, try client-documents as fallback
      if (signedUrlError && bucket === 'documents') {
        console.log('Primary signed URL failed, trying client-documents bucket');
        ({ data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('client-documents')
          .createSignedUrl(path, 3600));
      }

      if (signedUrlError) {
        console.error('Supabase signed URL error:', signedUrlError);
        
        // Provide specific error messages
        let errorMessage = "Failed to open document for viewing";
        if (signedUrlError.message.includes('not found') || signedUrlError.message.includes('does not exist')) {
          errorMessage = "Document file not found.";
        } else if (signedUrlError.message.includes('access') || signedUrlError.message.includes('permission')) {
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
      window.open(signedUrlData.signedUrl, '_blank');
      
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
