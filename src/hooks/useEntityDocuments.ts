import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EntityDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  file_path?: string;
  file_size?: string;
  file_type?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  uploader_type: 'system' | 'staff' | 'client' | 'admin';
  created_at: string;
  updated_at: string;
}

// Fetch documents for a specific client from the documents table
export const useClientEntityDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-entity-documents', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useClientEntityDocuments] Error fetching documents:', error);
        throw error;
      }

      // Map and categorize documents by uploader type
      return (data || []).map(doc => {
        let uploaderType: 'system' | 'staff' | 'client' | 'admin' = 'system';
        
        // Categorize based on uploaded_by and uploaded_by_name
        if (doc.uploaded_by_name?.toLowerCase() === 'system') {
          // Explicitly marked as System upload
          uploaderType = 'system';
        } else if (doc.uploaded_by && (!doc.uploaded_by_name || doc.uploaded_by_name === '')) {
          // Has uploader ID but no name - Admin upload from Documents module
          uploaderType = 'admin';
        } else if (doc.uploaded_by_name) {
          const name = doc.uploaded_by_name.toLowerCase();
          if (name.includes('staff')) {
            uploaderType = 'staff';
          } else if (name.includes('admin')) {
            uploaderType = 'admin';
          } else {
            uploaderType = 'client';
          }
        }

        return {
          id: doc.id,
          name: doc.name || 'Untitled Document',
          type: doc.type || 'Unknown',
          category: doc.category || 'General',
          description: doc.description,
          file_path: doc.file_path,
          file_size: doc.file_size,
          file_type: doc.file_type,
          uploaded_by: doc.uploaded_by || '',
          uploaded_by_name: doc.uploaded_by_name,
          uploader_type: uploaderType,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        } as EntityDocument;
      });
    },
    enabled: !!clientId,
  });
};

// Fetch documents for a specific staff member from the documents table
export const useStaffEntityDocuments = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-entity-documents', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useStaffEntityDocuments] Error fetching documents:', error);
        throw error;
      }

      // Map and categorize documents by uploader type
      return (data || []).map(doc => {
        let uploaderType: 'system' | 'staff' | 'client' | 'admin' = 'system';
        
        // Categorize based on uploaded_by and uploaded_by_name
        if (doc.uploaded_by_name?.toLowerCase() === 'system') {
          // Explicitly marked as System upload
          uploaderType = 'system';
        } else if (doc.uploaded_by && (!doc.uploaded_by_name || doc.uploaded_by_name === '')) {
          // Has uploader ID but no name - Admin upload from Documents module
          uploaderType = 'admin';
        } else if (doc.uploaded_by_name) {
          const name = doc.uploaded_by_name.toLowerCase();
          if (name.includes('staff')) {
            uploaderType = 'staff';
          } else if (name.includes('admin')) {
            uploaderType = 'admin';
          } else {
            uploaderType = 'client';
          }
        }

        return {
          id: doc.id,
          name: doc.name || 'Untitled Document',
          type: doc.type || 'Unknown',
          category: doc.category || 'General',
          description: doc.description,
          file_path: doc.file_path,
          file_size: doc.file_size,
          file_type: doc.file_type,
          uploaded_by: doc.uploaded_by || '',
          uploaded_by_name: doc.uploaded_by_name,
          uploader_type: uploaderType,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        } as EntityDocument;
      });
    },
    enabled: !!staffId,
  });
};

// Helper function to download document with signed URL
export const downloadEntityDocument = async (filePath: string, fileName: string) => {
  try {
    if (!filePath || filePath.trim() === '') {
      throw new Error('Invalid file path');
    }

    // Create signed URL for secure download
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60); // 60 second expiry

    if (urlError || !urlData) {
      console.error('[downloadEntityDocument] Signed URL error:', urlError);
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
  } catch (error) {
    console.error('[downloadEntityDocument] Download failed:', error);
    throw error;
  }
};
