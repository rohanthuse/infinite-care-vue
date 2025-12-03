import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminSharedDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  file_path: string;
  file_size?: string;
  file_type?: string;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  access_level?: string;
}

// Hook for clients to see documents shared by admin
export const useClientSharedDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-shared-documents', clientId],
    queryFn: async (): Promise<AdminSharedDocument[]> => {
      console.log('[useClientSharedDocuments] Fetching admin-shared documents for client:', clientId);
      
      // First get client's branch_id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('branch_id')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('[useClientSharedDocuments] Error fetching client branch:', clientError);
        throw clientError;
      }

      const branchId = clientData?.branch_id;
      console.log('[useClientSharedDocuments] Client branch_id:', branchId);

      // Build query with OR conditions for visibility:
      // 1. Direct sharing (client_id matches)
      // 2. Branch-level (access_level = 'branch' AND same branch)
      // 3. Public (access_level = 'public')
      let orConditions = `client_id.eq.${clientId}`;
      
      if (branchId) {
        orConditions += `,and(access_level.eq.branch,branch_id.eq.${branchId})`;
      }
      orConditions += `,access_level.eq.public`;

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('status', 'active')
        .or(orConditions)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useClientSharedDocuments] Error:', error);
        throw error;
      }

      console.log('[useClientSharedDocuments] Found documents:', data?.length || 0);
      return data as AdminSharedDocument[];
    },
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for carers to see documents shared by admin
export const useCarerSharedDocuments = (carerId: string) => {
  return useQuery({
    queryKey: ['carer-shared-documents', carerId],
    queryFn: async (): Promise<AdminSharedDocument[]> => {
      console.log('[useCarerSharedDocuments] Fetching admin-shared documents for carer:', carerId);
      
      // First get staff's branch_id
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('branch_id')
        .eq('id', carerId)
        .single();

      if (staffError) {
        console.error('[useCarerSharedDocuments] Error fetching staff branch:', staffError);
        throw staffError;
      }

      const branchId = staffData?.branch_id;
      console.log('[useCarerSharedDocuments] Staff branch_id:', branchId);

      // Build query with OR conditions for visibility:
      // 1. Direct sharing (staff_id matches)
      // 2. Branch-level (access_level = 'branch' AND same branch)
      // 3. Public (access_level = 'public')
      let orConditions = `staff_id.eq.${carerId}`;
      
      if (branchId) {
        orConditions += `,and(access_level.eq.branch,branch_id.eq.${branchId})`;
      }
      orConditions += `,access_level.eq.public`;

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('status', 'active')
        .or(orConditions)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useCarerSharedDocuments] Error:', error);
        throw error;
      }

      console.log('[useCarerSharedDocuments] Found documents:', data?.length || 0);
      return data as AdminSharedDocument[];
    },
    enabled: Boolean(carerId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Shared hook for document actions
export const useSharedDocumentActions = () => {
  // Determine bucket based on file path prefix
  const getBucketName = (filePath: string) => {
    if (filePath.startsWith('client-documents/')) return 'client-documents';
    if (filePath.startsWith('agreement-files/')) return 'agreement-files';
    return 'documents'; // default
  };

  const viewDocument = async (filePath: string) => {
    try {
      console.log('Viewing shared document:', filePath);
      
      const bucket = getBucketName(filePath);
      
      // Open a blank tab immediately to avoid popup blockers
      const newTab = window.open('about:blank', '_blank');
      
      if (!newTab) {
        throw new Error('Could not open new tab. Please check your popup blocker settings.');
      }

      try {
        // First try to download as blob to avoid ERR_BLOCKED_BY_CLIENT
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (!downloadError && fileData) {
          // Create blob URL and navigate to it
          const blobUrl = URL.createObjectURL(fileData);
          newTab.location.href = blobUrl;
          
          // Clean up the blob URL after a delay
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 30000); // 30 seconds
          
          return;
        }
      } catch (blobError) {
        console.warn('Blob download failed, falling back to signed URL:', blobError);
      }

      // Fallback to signed URL if blob download fails
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        newTab.close();
        throw new Error(`Failed to create document URL: ${error.message}`);
      }

      if (data?.signedUrl) {
        newTab.location.href = data.signedUrl;
      } else {
        newTab.close();
        throw new Error('Could not generate file URL');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      // Re-throw to let calling components handle the error display
      throw error;
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const bucket = getBucketName(filePath);
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  return {
    viewDocument,
    downloadDocument,
  };
};
