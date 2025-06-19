
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
