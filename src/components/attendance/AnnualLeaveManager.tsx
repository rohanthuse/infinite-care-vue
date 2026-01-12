import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, Trash2, CalendarDays, Clock, Repeat } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAnnualLeave, useCreateAnnualLeave, useDeleteAnnualLeave } from "@/hooks/useLeaveManagement";
import { TimePickerField } from "@/components/care/forms/TimePickerField";
import { EnhancedStaffSelector } from "@/components/ui/enhanced-staff-selector";
import { EnhancedStaff } from "@/hooks/useSearchableStaff";

interface AnnualLeaveManagerProps {
  branchId: string;
}

export function AnnualLeaveManager({ branchId }: AnnualLeaveManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [leaveName, setLeaveName] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedCarerId, setSelectedCarerId] = useState<string>('');
  const [selectedCarerData, setSelectedCarerData] = useState<EnhancedStaff | null>(null);
  const [isWeeklyRecurring, setIsWeeklyRecurring] = useState(false);

  const { data: annualLeave = [], isLoading } = useAnnualLeave(branchId);
  const createAnnualLeave = useCreateAnnualLeave();
  const deleteAnnualLeave = useDeleteAnnualLeave();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCarerId) {
      toast.error("Please select a carer");
      return;
    }
    
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    
    if (!leaveName.trim()) {
      toast.error("Please enter a holiday name");
      return;
    }

    // Validate time fields when not full day
    if (!isFullDay) {
      if (!startTime || !endTime) {
        toast.error("Please select both start and end times");
        return;
      }
      if (startTime >= endTime) {
        toast.error("End time must be later than start time");
        return;
      }
    }

    const leaveData = {
      branch_id: branchId,
      staff_id: selectedCarerId,
      leave_date: format(selectedDate, 'yyyy-MM-dd'),
      leave_name: leaveName.trim(),
      is_company_wide: false,
      is_recurring: false,
      is_weekly_recurring: isWeeklyRecurring,
      start_time: isFullDay ? null : startTime,
      end_time: isFullDay ? null : endTime
    };

    createAnnualLeave.mutate(leaveData, {
      onSuccess: () => {
        setSelectedDate(undefined);
        setLeaveName("");
        setIsFullDay(true);
        setStartTime("09:00");
        setEndTime("17:00");
        setSelectedCarerId('');
        setSelectedCarerData(null);
        setIsWeeklyRecurring(false);
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteAnnualLeave.mutate(id);
    }
  };

  const sortedLeave = annualLeave.sort((a, b) =>
    new Date(a.leave_date).getTime() - new Date(b.leave_date).getTime()
  );

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading annual leave calendar...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Holiday */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Add Holiday / Annual Leave Date
            </h3>
            <p className="text-gray-500 mt-1">Add holiday for carer</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Carer Selection */}
            <div>
              <Label>Select Carer *</Label>
              <div className="mt-1">
                <EnhancedStaffSelector
                  branchId={branchId}
                  selectedStaffId={selectedCarerId}
                  onStaffSelect={(id, data) => {
                    setSelectedCarerId(id);
                    setSelectedCarerData(data);
                  }}
                  placeholder="Search and select a carer..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="leaveName">Holiday Name *</Label>
                <Input
                  id="leaveName"
                  placeholder="e.g., Christmas Day, Summer Holiday"
                  value={leaveName}
                  onChange={(e) => setLeaveName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Full Day Toggle and Time Pickers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="fullDay" className="font-medium cursor-pointer">
                      Full Day Leave
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle off to specify custom start and end times
                    </p>
                  </div>
                </div>
                <Switch
                  id="fullDay"
                  checked={isFullDay}
                  onCheckedChange={setIsFullDay}
                />
              </div>

              {!isFullDay && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                  <TimePickerField
                    label="Start Time"
                    value={startTime}
                    onChange={setStartTime}
                    required
                  />
                  <TimePickerField
                    label="End Time"
                    value={endTime}
                    onChange={setEndTime}
                    required
                  />
                </div>
              )}

              {/* Weekly Recurring Option */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Repeat className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="weeklyRecurring" className="font-medium cursor-pointer">
                      Repeat Every Week
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      This holiday will repeat on the same day every week for one year (52 weeks)
                    </p>
                  </div>
                </div>
                <Switch
                  id="weeklyRecurring"
                  checked={isWeeklyRecurring}
                  onCheckedChange={setIsWeeklyRecurring}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedDate(undefined);
                  setLeaveName("");
                  setIsFullDay(true);
                  setStartTime("09:00");
                  setEndTime("17:00");
                  setSelectedCarerId('');
                  setSelectedCarerData(null);
                  setIsWeeklyRecurring(false);
                }}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={createAnnualLeave.isPending || !selectedDate || !leaveName.trim() || !selectedCarerId}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {createAnnualLeave.isPending ? 'Adding...' : 'Add Holiday'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Annual Leave Calendar */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Annual Leave Calendar ({sortedLeave.length})</h3>
          </div>

          {sortedLeave.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No holidays or annual leave dates scheduled</p>
              <p className="text-gray-400 text-sm mt-1">Add your first holiday above to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Carer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLeave.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.leave_name}</TableCell>
                      <TableCell>
                        {holiday.staff_name || (
                          <span className="text-muted-foreground italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(holiday.leave_date), 'EEEE, MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {holiday.start_time && holiday.end_time ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <Clock className="h-3 w-3 mr-1" />
                            {holiday.start_time.slice(0, 5)} - {holiday.end_time.slice(0, 5)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            All Day
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {holiday.is_weekly_recurring ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Repeat className="h-3 w-3 mr-1" />
                            Weekly
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            One-time
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(holiday.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(holiday.id, holiday.leave_name)}
                          disabled={deleteAnnualLeave.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
