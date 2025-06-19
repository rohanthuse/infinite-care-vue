
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ClientDocument {
  id: string;
  client_id: string;
  name: string;
  type: string;
  upload_date: string;
  uploaded_by: string;
  file_path?: string;
  file_size?: string;
  created_at: string;
  updated_at: string;
}

export const useClientDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ["client-documents", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("client_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("upload_date", { ascending: false });

      if (error) {
        console.error("Error fetching client documents:", error);
        throw error;
      }

      return data as ClientDocument[];
    },
    enabled: !!clientId,
  });
};

export const useCreateClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentData: Omit<ClientDocument, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("client_documents")
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error("Error creating client document:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch client documents
      queryClient.invalidateQueries({ queryKey: ["client-documents", data.client_id] });
      
      toast({
        title: "Document uploaded",
        description: "The document has been successfully uploaded.",
      });
    },
    onError: (error) => {
      console.error("Error creating client document:", error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUploadClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, file, name, type, uploaded_by }: {
      clientId: string;
      file: File;
      name: string;
      type: string;
      uploaded_by: string;
    }) => {
      // In a real implementation, this would upload the file to storage
      // For now, we'll just create a document record
      const documentData = {
        client_id: clientId,
        name,
        type,
        uploaded_by,
        upload_date: new Date().toISOString().split('T')[0],
        file_size: `${(file.size / 1024).toFixed(2)} KB`,
        file_path: `/documents/${clientId}/${file.name}`, // Mock path
      };

      const { data, error } = await supabase
        .from("client_documents")
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error("Error uploading client document:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", data.client_id] });
      
      toast({
        title: "Document uploaded",
        description: "The document has been successfully uploaded.",
      });
    },
    onError: (error) => {
      console.error("Error uploading client document:", error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, type, uploaded_by }: {
      id: string;
      name: string;
      type: string;
      uploaded_by: string;
    }) => {
      const { data, error } = await supabase
        .from("client_documents")
        .update({ name, type, uploaded_by })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating client document:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", data.client_id] });
      
      toast({
        title: "Document updated",
        description: "The document has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating client document:", error);
      toast({
        title: "Error",
        description: "Failed to update document. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("client_documents")
        .delete()
        .eq("id", documentId);

      if (error) {
        console.error("Error deleting client document:", error);
        throw error;
      }

      return documentId;
    },
    onSuccess: () => {
      // Invalidate all client documents queries
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
      
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error("Error deleting client document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useViewClientDocument = () => {
  return useMutation({
    mutationFn: async ({ filePath }: { filePath: string }) => {
      // In a real implementation, this would open/view the document
      // For now, we'll just show a toast
      toast({
        title: "Document View",
        description: "Document viewing functionality would be implemented here.",
      });
    },
  });
};

export const useDownloadClientDocument = () => {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      // In a real implementation, this would download the document
      // For now, we'll just show a toast
      toast({
        title: "Document Download",
        description: `Download for ${fileName} would start here.`,
      });
    },
  });
};
