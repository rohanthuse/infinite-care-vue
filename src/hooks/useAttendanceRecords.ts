import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AttendanceRecord {
  id: string;
  person_id: string;
  person_type: 'staff' | 'client';
  branch_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day';
  check_in_time?: string;
  check_out_time?: string;
  hours_worked: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined data
  person_name?: string;
  person_role?: string;
}

export interface CreateAttendanceData {
  person_id: string;
  person_type: 'staff' | 'client';
  branch_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day';
  check_in_time?: string;
  check_out_time?: string;
  hours_worked?: number;
  notes?: string;
}

export interface AttendanceFilters {
  searchQuery?: string;
  attendanceType?: string;
  status?: string;
  selectedRoles?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export const useAttendanceRecords = (branchId: string, filters?: AttendanceFilters) => {
  return useQuery({
    queryKey: ['attendance-records', branchId, filters],
    queryFn: async () => {
      console.log('Fetching attendance records with filters:', { branchId, filters });
      
      let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('branch_id', branchId);

      // Apply date range filter
      if (filters?.dateRange) {
        query = query
          .gte('attendance_date', filters.dateRange.from.toISOString().split('T')[0])
          .lte('attendance_date', filters.dateRange.to.toISOString().split('T')[0]);
      }

      // Apply attendance type filter
      if (filters?.attendanceType && filters.attendanceType !== 'all') {
        query = query.eq('person_type', filters.attendanceType);
      }

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: attendanceRecords, error } = await query.order('attendance_date', { ascending: false });

      if (error) {
        console.error('Error fetching attendance records:', error);
        throw error;
      }

      if (!attendanceRecords || attendanceRecords.length === 0) {
        console.log('No attendance records found');
        return [];
      }

      // Separate staff and client IDs
      const staffIds = attendanceRecords
        .filter(record => record.person_type === 'staff')
        .map(record => record.person_id);
      
      const clientIds = attendanceRecords
        .filter(record => record.person_type === 'client')
        .map(record => record.person_id);

      // Fetch staff data
      let staffData: any[] = [];
      if (staffIds.length > 0) {
        const { data, error: staffError } = await supabase
          .from('staff')
          .select('id, first_name, last_name, specialization')
          .in('id', staffIds);
        
        if (staffError) {
          console.error('Error fetching staff data:', staffError);
        } else {
          staffData = data || [];
        }
      }

      // Fetch client data
      let clientData: any[] = [];
      if (clientIds.length > 0) {
        const { data, error: clientError } = await supabase
          .from('clients')
          .select('id, first_name, last_name')
          .in('id', clientIds);
        
        if (clientError) {
          console.error('Error fetching client data:', clientError);
        } else {
          clientData = data || [];
        }
      }

      // Create lookup maps for better performance
      const staffMap = new Map(staffData.map(staff => [staff.id, staff]));
      const clientMap = new Map(clientData.map(client => [client.id, client]));

      // Process the data to add person names and roles
      const processedData = attendanceRecords.map(record => {
        let personName = 'Unknown';
        let personRole = 'Unknown';

        if (record.person_type === 'staff') {
          const staff = staffMap.get(record.person_id);
          if (staff) {
            personName = `${staff.first_name} ${staff.last_name}`;
            personRole = staff.specialization || 'Staff';
          }
        } else if (record.person_type === 'client') {
          const client = clientMap.get(record.person_id);
          if (client) {
            personName = `${client.first_name} ${client.last_name}`;
            personRole = 'Client';
          }
        }

        return {
          ...record,
          person_name: personName,
          person_role: personRole,
        };
      });

      // Apply client-side filters
      let filteredData = processedData;

      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        filteredData = filteredData.filter(record => 
          record.person_name?.toLowerCase().includes(searchLower) ||
          record.person_role?.toLowerCase().includes(searchLower) ||
          record.notes?.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.selectedRoles && filters.selectedRoles.length > 0) {
        filteredData = filteredData.filter(record => 
          filters.selectedRoles!.includes(record.person_role || '')
        );
      }

      console.log('Processed attendance records:', filteredData.length, 'records');
      return filteredData;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCreateAttendanceRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attendanceData: CreateAttendanceData) => {
      console.log('Creating attendance record:', attendanceData);
      
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([attendanceData])
        .select()
        .single();

      if (error) {
        console.error('Error creating attendance record:', error);
        throw error;
      }
      
      console.log('Created attendance record:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success("Attendance recorded successfully");
    },
    onError: (error: any) => {
      console.error('Error creating attendance record:', error);
      toast.error('Failed to record attendance: ' + (error.message || 'Unknown error'));
    },
  });
};

export const useBulkCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attendanceRecords: CreateAttendanceData[]) => {
      console.log('Creating bulk attendance records:', attendanceRecords.length, 'records');
      
      const { data, error } = await supabase
        .from('attendance_records')
        .insert(attendanceRecords)
        .select();

      if (error) {
        console.error('Error creating bulk attendance records:', error);
        throw error;
      }
      
      console.log('Created bulk attendance records:', data?.length, 'records');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success(`${data?.length || 0} attendance records created successfully`);
    },
    onError: (error: any) => {
      console.error('Error creating bulk attendance records:', error);
      toast.error('Failed to record bulk attendance: ' + (error.message || 'Unknown error'));
    },
  });
};

export const useUpdateAttendanceRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateAttendanceData> }) => {
      console.log('Updating attendance record:', id, updates);
      
      const { data, error } = await supabase
        .from('attendance_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating attendance record:', error);
        throw error;
      }
      
      console.log('Updated attendance record:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success("Attendance updated successfully");
    },
    onError: (error: any) => {
      console.error('Error updating attendance record:', error);
      toast.error('Failed to update attendance: ' + (error.message || 'Unknown error'));
    },
  });
};

export const useDeleteAttendanceRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting attendance record:', id);
      
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting attendance record:', error);
        throw error;
      }
      
      console.log('Deleted attendance record:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success("Attendance record deleted successfully");
    },
    onError: (error: any) => {
      console.error('Error deleting attendance record:', error);
      toast.error('Failed to delete attendance record: ' + (error.message || 'Unknown error'));
    },
  });
};
