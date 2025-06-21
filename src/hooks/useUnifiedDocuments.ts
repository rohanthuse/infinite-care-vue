
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

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: UploadDocumentData) => {
      const { file, ...metadata } = documentData;
      
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${branchId}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get current user for uploaded_by
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: metadata.name,
          type: metadata.type,
          category: metadata.category,
          description: metadata.description,
          file_path: uploadData.path,
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

      if (error) throw error;
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
      toast({
        title: "Error",
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
        await supabase.storage
          .from('documents')
          .remove([document.file_path]);
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

  // Download document mutation
  const downloadDocumentMutation = useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to download document: " + error.message,
        variant: "destructive",
      });
    },
  });

  // View document mutation
  const viewDocumentMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to view document: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    documents,
    isLoading,
    error,
    uploadDocument: uploadDocumentMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    downloadDocument: downloadDocumentMutation.mutate,
    viewDocument: viewDocumentMutation.mutate,
    isUploading: uploadDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
    isDownloading: downloadDocumentMutation.isPending,
    isViewing: viewDocumentMutation.isPending,
  };
};
