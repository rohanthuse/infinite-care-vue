
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { useToast } from '@/components/ui/use-toast';

export interface ClientDocument {
  id: string;
  name: string;
  type: string;
  upload_date: string;
  uploaded_by: string;
  file_size?: string;
  file_path?: string;
}

export const useClientDocuments = () => {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { client } = useClient();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', client.id)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive"
        });
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [client]);

  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.type.toLowerCase().includes(type.toLowerCase()));
  };

  return {
    documents,
    loading,
    refetch: fetchDocuments,
    getDocumentsByType
  };
};
