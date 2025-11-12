import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  type: 'client' | 'staff' | 'booking' | 'document';
  title: string;
  subtitle: string;
  details: string;
  status?: string;
  metadata?: Record<string, any>;
}

export function useBranchSearch(branchId: string | null, searchTerm: string) {
  const enabled = !!branchId && searchTerm.trim().length >= 2;
  const term = searchTerm.trim().toLowerCase();

  // Search clients directly
  const clientsQuery = useQuery({
    queryKey: ['branch-clients-search', branchId, term],
    queryFn: async () => {
      if (!branchId) return [];
      
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, pin_code, status')
        .eq('branch_id', branchId)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,pin_code.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled,
  });

  // Search staff directly
  const staffQuery = useQuery({
    queryKey: ['branch-staff-search', branchId, term],
    queryFn: async () => {
      if (!branchId) return [];
      
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, specialization, status')
        .eq('branch_id', branchId)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,specialization.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled,
  });

  // Fetch and filter bookings
  const bookingsSearch = useBranchBookings(branchId || '');

  // Fetch and filter documents
  const documentsQuery = useQuery({
    queryKey: ['branch-documents-search', branchId, term],
    queryFn: async () => {
      if (!branchId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, type, category, description, file_size, uploaded_by_name, created_at')
        .eq('branch_id', branchId)
        .or(`name.ilike.%${term}%,type.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled,
  });

  // Transform results
  const clientResults: SearchResult[] = enabled && clientsQuery.data
    ? clientsQuery.data.map(client => ({
        id: client.id,
        type: 'client' as const,
        title: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed Client',
        subtitle: client.email || '',
        details: `PIN: ${client.pin_code || 'N/A'}`,
        status: client.status || 'active',
        metadata: client,
      }))
    : [];

  const staffResults: SearchResult[] = enabled && staffQuery.data
    ? staffQuery.data.map(staff => ({
        id: staff.id,
        type: 'staff' as const,
        title: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unnamed Staff',
        subtitle: staff.email || '',
        details: staff.specialization || '',
        status: staff.status || 'active',
        metadata: staff,
      }))
    : [];

  const bookingResults: SearchResult[] = enabled && bookingsSearch.data
    ? bookingsSearch.data
        .filter(booking => {
          const searchableText = [
            booking.id,
            booking.status,
            booking.notes,
          ].filter(Boolean).join(' ').toLowerCase();
          return searchableText.includes(term);
        })
        .slice(0, 10)
        .map(booking => ({
          id: booking.id,
          type: 'booking' as const,
          title: `Booking #${booking.id.slice(0, 8)}`,
          subtitle: new Date(booking.start_time).toLocaleDateString(),
          details: `${new Date(booking.start_time).toLocaleTimeString()} - ${new Date(booking.end_time).toLocaleTimeString()}`,
          status: booking.status || 'scheduled',
          metadata: booking,
        }))
    : [];

  const documentResults: SearchResult[] = enabled && documentsQuery.data
    ? documentsQuery.data.map(doc => ({
        id: doc.id,
        type: 'document' as const,
        title: doc.name || 'Unnamed Document',
        subtitle: doc.type || 'Document',
        details: doc.category || (doc.file_size ? `${doc.file_size}` : ''),
        metadata: doc,
      }))
    : [];

  const isLoading = 
    clientsQuery.isLoading || 
    staffQuery.isLoading || 
    bookingsSearch.isLoading || 
    documentsQuery.isLoading;

  const totalResults = 
    clientResults.length + 
    staffResults.length + 
    bookingResults.length + 
    documentResults.length;

  return {
    clientResults,
    staffResults,
    bookingResults,
    documentResults,
    isLoading,
    totalResults,
    clientCount: clientResults.length,
    staffCount: staffResults.length,
    bookingCount: bookingResults.length,
    documentCount: documentResults.length,
  };
}
