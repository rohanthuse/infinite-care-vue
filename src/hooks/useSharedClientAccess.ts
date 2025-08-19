import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SharedClientData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  registered_on: string;
  branch_id: string;
}

interface UseSharedClientAccessReturn {
  client: SharedClientData | null;
  loading: boolean;
  error: string | null;
  isValidToken: boolean;
}

export const useSharedClientAccess = (clientId: string, token: string): UseSharedClientAccessReturn => {
  const [client, setClient] = useState<SharedClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const fetchSharedClient = async () => {
      if (!clientId || !token) {
        setError('Missing client ID or token');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // For now, we'll validate against a temporary token system
        // In a production environment, this would check against a proper token table
        const isTokenValid = token === 'temp_token_123' || token.startsWith('share_');
        
        if (!isTokenValid) {
          setError('Invalid or expired sharing token');
          setIsValidToken(false);
          setLoading(false);
          return;
        }

        setIsValidToken(true);

        // Fetch client data - this is a public access, so we need to bypass RLS
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            status,
            created_at,
            branch_id
          `)
          .eq('id', clientId)
          .single();

        if (clientError) {
          console.error('Error fetching client:', clientError);
          setError('Client not found or access denied');
          setLoading(false);
          return;
        }

        if (!clientData) {
          setError('Client not found');
          setLoading(false);
          return;
        }

        setClient({
          id: clientData.id,
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email || '',
          phone: clientData.phone,
          address: clientData.address,
          status: clientData.status || 'unknown',
          registered_on: clientData.created_at || new Date().toISOString(),
          branch_id: clientData.branch_id || ''
        });

      } catch (err) {
        console.error('Error in useSharedClientAccess:', err);
        setError('Failed to load client information');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedClient();
  }, [clientId, token]);

  return {
    client,
    loading,
    error,
    isValidToken
  };
};