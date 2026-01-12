import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAnnualLeave, useCreateAnnualLeave, useDeleteAnnualLeave } from "@/hooks/useLeaveManagement";

interface AnnualLeaveManagerProps {
  branchId?: string;
  isCompanyWide?: boolean;
}

const AnnualLeaveManager: React.FC<AnnualLeaveManagerProps> = ({
  branchId,
  isCompanyWide = false
}) => {
  const { data: allAnnualLeave, isLoading } = useAnnualLeave(branchId);
  const createAnnualLeave = useCreateAnnualLeave();
  const deleteAnnualLeave = useDeleteAnnualLeave();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [leaveName, setLeaveName] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  
  // Filter states
  const [searchFilter, setSearchFilter] = useState("");

  // Filter holidays based on current filter settings
  const annualLeave = allAnnualLeave?.filter(holiday => {
    // Search filter
    if (searchFilter && !holiday.leave_name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    
    return true;
  }) || [];

  const handleCreateLeave = async () => {
    if (!selectedDate || !leaveName.trim()) return;

    await createAnnualLeave.mutateAsync({
      branch_id: branchId,
      leave_date: selectedDate.toISOString().split('T')[0],
      leave_name: leaveName.trim(),
      is_company_wide: false,
      is_recurring: false,
      start_time: isAllDay ? null : startTime,
      end_time: isAllDay ? null : endTime
    });

    // Reset form
    setSelectedDate(undefined);
    setLeaveName('');
    setIsAllDay(true);
    setStartTime('09:00');
    setEndTime('17:00');
    setIsDialogOpen(false);
  };

  const handleDeleteLeave = async (id: string) => {
    if (confirm('Are you sure you want to delete this annual leave date?')) {
      await deleteAnnualLeave.mutateAsync(id);
    }
  };

  const sortedLeave = annualLeave?.sort((a, b) => 
    new Date(a.leave_date).getTime() - new Date(b.leave_date).getTime()
  );

  const totalHolidays = allAnnualLeave?.length || 0;
  const filteredCount = annualLeave.length;

  const resetFilters = () => {
    setSearchFilter("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Annual Leave Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Annual Leave Calendar
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Leave Date
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Annual Leave Date</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Leave Name
                  </label>
                  <Input
                    value={leaveName}
                    onChange={(e) => setLeaveName(e.target.value)}
                    placeholder="e.g., Christmas Day, New Year's Day"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-day"
                      checked={isAllDay}
                      onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
                    />
                    <label htmlFor="all-day" className="text-sm font-medium">
                      All Day
                    </label>
                  </div>

                  {!isAllDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Time</label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">End Time</label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                </div>

                <Button
                  onClick={handleCreateLeave}
                  disabled={!selectedDate || !leaveName.trim() || createAnnualLeave.isPending}
                  className="w-full"
                >
                  {createAnnualLeave.isPending ? 'Adding...' : 'Add Leave Date'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <label className="text-sm font-medium">Search:</label>
              <Input
                placeholder="Search holidays..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="max-w-60"
              />
            </div>
            
            {searchFilter && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalHolidays} holidays
            {searchFilter && " (filtered)"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!sortedLeave || sortedLeave.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No annual leave dates configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLeave.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium">{leave.leave_name}</h4>
                    </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(leave.leave_date), 'EEEE, MMMM dd, yyyy')}
                    {leave.start_time && leave.end_time ? (
                      <span className="ml-2 text-primary">
                        ({leave.start_time.slice(0, 5)} - {leave.end_time.slice(0, 5)})
                      </span>
                    ) : (
                      <span className="ml-2 text-muted-foreground">(All Day)</span>
                    )}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLeave(leave.id)}
                  disabled={deleteAnnualLeave.isPending}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnualLeaveManager;