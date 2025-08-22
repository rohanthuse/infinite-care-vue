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
}

// Hook for clients to see documents shared by admin
export const useClientSharedDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-shared-documents', clientId],
    queryFn: async (): Promise<AdminSharedDocument[]> => {
      console.log('[useClientSharedDocuments] Fetching admin-shared documents for client:', clientId);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
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
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('staff_id', carerId)
        .eq('status', 'active')
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
      const bucket = getBucketName(filePath);
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
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