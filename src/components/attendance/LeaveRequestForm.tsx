import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarIcon, Send } from "lucide-react";
import { format, differenceInBusinessDays, addDays } from "date-fns";
import { toast } from "sonner";
import { useCreateLeaveRequest } from "@/hooks/useLeaveManagement";
import { useUserRole } from "@/hooks/useUserRole";

interface LeaveRequestFormProps {
  branchId: string;
}

export function LeaveRequestForm({ branchId }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");
  
  const { data: userRole } = useUserRole();
  const createLeaveRequest = useCreateLeaveRequest();

  const calculateBusinessDays = () => {
    if (!startDate || !endDate) return 0;
    return differenceInBusinessDays(addDays(endDate, 1), startDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveType) {
      toast.error("Please select a leave type");
      return;
    }
    
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    
    if (startDate > endDate) {
      toast.error("End date must be after start date");
      return;
    }

    // Validate business days
    if (businessDays <= 0) {
      toast.error("Leave request must be for at least 1 business day");
      return;
    }
    
    if (!userRole?.staffId) {
      toast.error("Unable to identify staff member");
      return;
    }

    const requestData = {
      staff_id: userRole.staffId,
      branch_id: branchId,
      leave_type: leaveType,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      reason: reason.trim() || undefined
    };

    createLeaveRequest.mutate(requestData, {
      onSuccess: () => {
        setLeaveType("");
        setStartDate(undefined);
        setEndDate(undefined);
        setReason("");
      }
    });
  };

  const businessDays = calculateBusinessDays();

  return (
    <Card className="border-gray-200 dark:border-border shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Submit Leave Request
          </h3>
          <p className="text-gray-500 dark:text-muted-foreground mt-1">Request time off for personal, medical, or other reasons</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger id="leaveType" className="mt-1">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                  <SelectItem value="maternity">Maternity Leave</SelectItem>
                  <SelectItem value="paternity">Paternity Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Duration</Label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-muted rounded-md border border-gray-200 dark:border-border">
                <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                  {businessDays > 0 ? `${businessDays} business day${businessDays !== 1 ? 's' : ''}` : 'Select dates to calculate'}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  Excludes weekends and public holidays
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date && endDate && date > endDate) {
                        setEndDate(undefined);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => {
                      if (!startDate) return date < new Date();
                      return date < startDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              className="mt-1"
              placeholder="Provide additional details about your leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLeaveType("");
                setStartDate(undefined);
                setEndDate(undefined);
                setReason("");
              }}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={createLeaveRequest.isPending || !leaveType || !startDate || !endDate}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {createLeaveRequest.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}