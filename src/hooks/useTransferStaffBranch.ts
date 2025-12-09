import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TransferStaffParams {
  staffId: string;
  staffName: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  effectiveDate: string;
  moveFutureBookings: boolean;
  transferReason?: string;
  transferNotes?: string;
}

export interface TransferResult {
  success: boolean;
  futureBookingsMoved: number;
}

export const useTransferStaffBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TransferStaffParams): Promise<TransferResult> => {
      const {
        staffId,
        staffName,
        fromBranchId,
        toBranchId,
        toBranchName,
        effectiveDate,
        moveFutureBookings,
        transferReason,
        transferNotes,
      } = params;

      console.log('[useTransferStaffBranch] Starting transfer:', params);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 1. Update staff branch_id
      const { error: staffError } = await supabase
        .from('staff')
        .update({ 
          branch_id: toBranchId, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', staffId);

      if (staffError) {
        console.error('[useTransferStaffBranch] Error updating staff:', staffError);
        throw new Error(`Failed to update staff branch: ${staffError.message}`);
      }

      // 2. Move future bookings if option selected
      let futureBookingsMoved = 0;
      if (moveFutureBookings) {
        const effectiveDateISO = new Date(effectiveDate).toISOString();
        
        const { data: movedBookings, error: bookingsError } = await supabase
          .from('bookings')
          .update({ branch_id: toBranchId })
          .eq('staff_id', staffId)
          .gte('start_time', effectiveDateISO)
          .select('id');

        if (bookingsError) {
          console.error('[useTransferStaffBranch] Error moving bookings:', bookingsError);
          // Don't throw - staff was already transferred, bookings are secondary
        } else {
          futureBookingsMoved = movedBookings?.length || 0;
        }
      }

      // 3. Create transfer record
      const { error: transferError } = await supabase
        .from('staff_branch_transfers')
        .insert({
          staff_id: staffId,
          from_branch_id: fromBranchId,
          to_branch_id: toBranchId,
          effective_date: effectiveDate,
          transfer_reason: transferReason || null,
          move_future_bookings: moveFutureBookings,
          future_bookings_moved: futureBookingsMoved,
          transferred_by: user.id,
          transfer_notes: transferNotes || null,
        });

      if (transferError) {
        console.error('[useTransferStaffBranch] Error creating transfer record:', transferError);
        // Don't throw - transfer completed, logging is secondary
      }

      // 4. Create audit log entry
      const { error: auditError } = await supabase
        .from('system_audit_logs')
        .insert({
          action: 'STAFF_BRANCH_TRANSFER',
          resource_type: 'staff',
          resource_id: staffId,
          organization_id: null, // Will be filled by trigger if needed
          branch_id: toBranchId,
          user_id: user.id,
          details: {
            staff_name: staffName,
            from_branch_id: fromBranchId,
            from_branch_name: params.fromBranchName,
            to_branch_id: toBranchId,
            to_branch_name: toBranchName,
            effective_date: effectiveDate,
            future_bookings_moved: futureBookingsMoved,
            reason: transferReason,
          },
        });

      if (auditError) {
        console.error('[useTransferStaffBranch] Error creating audit log:', auditError);
        // Don't throw - transfer completed, audit is secondary
      }

      console.log('[useTransferStaffBranch] Transfer completed successfully');
      
      return {
        success: true,
        futureBookingsMoved,
      };
    },
    onSuccess: (result, params) => {
      toast.success(`Staff transferred successfully`, {
        description: `${params.staffName} has been transferred to ${params.toBranchName}${result.futureBookingsMoved > 0 ? `. ${result.futureBookingsMoved} future booking(s) moved.` : ''}`,
      });

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['branch-carers'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: Error) => {
      console.error('[useTransferStaffBranch] Transfer failed:', error);
      toast.error('Failed to transfer staff', {
        description: error.message,
      });
    },
  });
};
