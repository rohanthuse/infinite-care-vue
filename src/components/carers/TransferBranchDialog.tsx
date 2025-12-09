import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { ArrowRightLeft, Calendar, Building2, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBranchesForOrganization } from "@/hooks/useBranchesForOrganization";
import { useTransferStaffBranch } from "@/hooks/useTransferStaffBranch";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface TransferBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: {
    id: string;
    first_name: string;
    last_name: string;
    branch_id: string;
  };
  currentBranchName: string;
  onTransferComplete?: () => void;
}

export function TransferBranchDialog({
  open,
  onOpenChange,
  staff,
  currentBranchName,
  onTransferComplete,
}: TransferBranchDialogProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [moveFutureBookings, setMoveFutureBookings] = useState(true);
  const [keepPastBookings, setKeepPastBookings] = useState(true);
  const [transferReason, setTransferReason] = useState("");
  
  const { data: branches = [], isLoading: branchesLoading } = useBranchesForOrganization(staff.branch_id);
  const transferMutation = useTransferStaffBranch();

  // Get count of future bookings for this staff member
  const { data: futureBookingsCount = 0 } = useQuery({
    queryKey: ['staff-future-bookings-count', staff.id, effectiveDate],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('staff_id', staff.id)
        .gte('start_time', effectiveDate.toISOString());
      
      if (error) {
        console.error('[TransferBranchDialog] Error fetching bookings count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: open,
  });

  // Get count of past bookings
  const { data: pastBookingsCount = 0 } = useQuery({
    queryKey: ['staff-past-bookings-count', staff.id, effectiveDate],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('staff_id', staff.id)
        .lt('start_time', effectiveDate.toISOString());
      
      if (error) {
        console.error('[TransferBranchDialog] Error fetching past bookings count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: open,
  });

  const selectedBranch = useMemo(() => 
    branches.find(b => b.id === selectedBranchId),
    [branches, selectedBranchId]
  );

  const handleTransfer = async () => {
    if (!selectedBranchId || !selectedBranch) return;

    await transferMutation.mutateAsync({
      staffId: staff.id,
      staffName: `${staff.first_name} ${staff.last_name}`,
      fromBranchId: staff.branch_id,
      fromBranchName: currentBranchName,
      toBranchId: selectedBranchId,
      toBranchName: selectedBranch.name,
      effectiveDate: format(effectiveDate, 'yyyy-MM-dd'),
      moveFutureBookings,
      transferReason: transferReason.trim() || undefined,
    });

    onOpenChange(false);
    onTransferComplete?.();
  };

  const isValid = selectedBranchId && effectiveDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transfer Staff to Another Branch
          </DialogTitle>
          <DialogDescription>
            Transfer {staff.first_name} {staff.last_name} to a different branch while preserving all historical data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Current Branch Display */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              Current Branch
            </div>
            <p className="font-medium">{currentBranchName}</p>
          </div>

          {/* Select New Branch */}
          <div className="space-y-2">
            <Label htmlFor="branch">Select New Branch *</Label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger id="branch">
                <SelectValue placeholder="Choose a branch..." />
              </SelectTrigger>
              <SelectContent>
                {branchesLoading ? (
                  <SelectItem value="loading" disabled>Loading branches...</SelectItem>
                ) : branches.length === 0 ? (
                  <SelectItem value="none" disabled>No other branches available</SelectItem>
                ) : (
                  branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Effective Transfer Date */}
          <div className="space-y-2">
            <Label>Effective Transfer Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !effectiveDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {effectiveDate ? format(effectiveDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={effectiveDate}
                  onSelect={(date) => date && setEffectiveDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Transfer Options */}
          <div className="space-y-4">
            <Label>Transfer Options</Label>
            <div className="space-y-3 p-4 border rounded-lg bg-background">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="moveFutureBookings"
                  checked={moveFutureBookings}
                  onCheckedChange={(checked) => setMoveFutureBookings(checked as boolean)}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="moveFutureBookings"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Move all future bookings to new branch
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {futureBookingsCount} future booking(s) will be reassigned
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="keepPastBookings"
                  checked={keepPastBookings}
                  onCheckedChange={(checked) => setKeepPastBookings(checked as boolean)}
                  disabled
                />
                <div className="space-y-1">
                  <label
                    htmlFor="keepPastBookings"
                    className="text-sm font-medium cursor-pointer text-muted-foreground"
                  >
                    Keep past bookings in old branch (read-only)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {pastBookingsCount} past booking(s) will remain unchanged
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Transfer Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Team restructuring, closer to home, branch staffing needs..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedBranch && (
            <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    This will:
                  </p>
                  <ul className="space-y-1 text-amber-700 dark:text-amber-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Transfer {staff.first_name} to {selectedBranch.name}
                    </li>
                    {moveFutureBookings && futureBookingsCount > 0 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Move {futureBookingsCount} future booking(s) to new branch
                      </li>
                    )}
                    {pastBookingsCount > 0 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Keep {pastBookingsCount} past booking(s) in {currentBranchName}
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Preserve all documents, skills, and compliance records
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transferMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!isValid || transferMutation.isPending}
          >
            {transferMutation.isPending ? 'Transferring...' : 'Transfer Staff Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
