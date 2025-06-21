
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
      
      // For now, return mock data until the Supabase types are updated
      // This will be replaced with real data once the migration is processed
      const mockData: AttendanceRecord[] = [
        {
          id: '1',
          person_id: 'staff-1',
          person_type: 'staff',
          branch_id: branchId,
          attendance_date: '2024-01-15',
          status: 'present',
          check_in_time: '09:00',
          check_out_time: '17:00',
          hours_worked: 8,
          notes: 'On time',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          person_name: 'John Doe',
          person_role: 'Nurse'
        },
        {
          id: '2',
          person_id: 'client-1',
          person_type: 'client',
          branch_id: branchId,
          attendance_date: '2024-01-15',
          status: 'present',
          check_in_time: '10:00',
          check_out_time: '16:00',
          hours_worked: 6,
          notes: 'Attended therapy session',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          person_name: 'Jane Smith',
          person_role: 'Client'
        }
      ];

      // Apply filters
      let filteredData = mockData;

      if (filters?.attendanceType && filters.attendanceType !== 'all') {
        filteredData = filteredData.filter(record => record.person_type === filters.attendanceType);
      }

      if (filters?.status && filters.status !== 'all') {
        filteredData = filteredData.filter(record => record.status === filters.status);
      }

      if (filters?.dateRange) {
        filteredData = filteredData.filter(record => {
          const recordDate = new Date(record.attendance_date);
          return recordDate >= filters.dateRange!.from && recordDate <= filters.dateRange!.to;
        });
      }

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

      console.log('Fetched attendance records:', filteredData.length, 'records');
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
      
      // For now, simulate success until the database is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Created attendance record:', attendanceData);
      return { id: Math.random().toString(), ...attendanceData };
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
      
      // For now, simulate success until the database is ready
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const results = attendanceRecords.map(record => ({ id: Math.random().toString(), ...record }));
      
      console.log('Created bulk attendance records:', results.length, 'records');
      return results;
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
      
      // For now, simulate success until the database is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Updated attendance record:', { id, ...updates });
      return { id, ...updates };
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
      
      // For now, simulate success until the database is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
