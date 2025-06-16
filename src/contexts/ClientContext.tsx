
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ClientData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  pronouns?: string;
  preferred_name?: string;
}

interface ClientContextType {
  client: ClientData | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<ClientData>) => Promise<boolean>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if client is already logged in
    const clientData = localStorage.getItem('clientData');
    if (clientData) {
      try {
        const parsedClient = JSON.parse(clientData);
        setClient(parsedClient);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing client data:', error);
        localStorage.removeItem('clientData');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // In a real implementation, you would authenticate with Supabase Auth
      // For now, we'll simulate by fetching client data by email
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !clientData) {
        toast({
          title: "Login Failed",
          description: "Invalid email or client not found",
          variant: "destructive"
        });
        return false;
      }

      const client: ClientData = {
        id: clientData.id,
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        date_of_birth: clientData.date_of_birth,
        gender: clientData.gender,
        pronouns: clientData.pronouns,
        preferred_name: clientData.preferred_name,
      };

      setClient(client);
      setIsAuthenticated(true);
      localStorage.setItem('clientData', JSON.stringify(client));
      localStorage.setItem('clientName', `${client.first_name} ${client.last_name}`);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = () => {
    setClient(null);
    setIsAuthenticated(false);
    localStorage.removeItem('clientData');
    localStorage.removeItem('clientName');
    localStorage.removeItem('userType');
  };

  const updateProfile = async (data: Partial<ClientData>): Promise<boolean> => {
    if (!client) return false;

    try {
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', client.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update profile",
          variant: "destructive"
        });
        return false;
      }

      const updatedClient = { ...client, ...data };
      setClient(updatedClient);
      localStorage.setItem('clientData', JSON.stringify(updatedClient));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  return (
    <ClientContext.Provider value={{
      client,
      loading,
      isAuthenticated,
      login,
      logout,
      updateProfile
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};
