import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, Building, Globe } from "lucide-react";
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
  const { data: annualLeave, isLoading } = useAnnualLeave(branchId);
  const createAnnualLeave = useCreateAnnualLeave();
  const deleteAnnualLeave = useDeleteAnnualLeave();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [leaveName, setLeaveName] = useState('');
  const [isCompanyWideLeave, setIsCompanyWideLeave] = useState(isCompanyWide);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleCreateLeave = async () => {
    if (!selectedDate || !leaveName.trim()) return;

    await createAnnualLeave.mutateAsync({
      branch_id: isCompanyWideLeave ? undefined : branchId,
      leave_date: selectedDate.toISOString().split('T')[0],
      leave_name: leaveName.trim(),
      is_company_wide: isCompanyWideLeave,
      is_recurring: isRecurring
    });

    // Reset form
    setSelectedDate(undefined);
    setLeaveName('');
    setIsCompanyWideLeave(isCompanyWide);
    setIsRecurring(false);
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
                      id="company-wide"
                      checked={isCompanyWideLeave}
                      onCheckedChange={(checked) => setIsCompanyWideLeave(checked as boolean)}
                    />
                    <label htmlFor="company-wide" className="text-sm font-medium">
                      Company-wide holiday
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recurring"
                      checked={isRecurring}
                      onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                    />
                    <label htmlFor="recurring" className="text-sm font-medium">
                      Recurring annually
                    </label>
                  </div>
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
                    <div className="flex gap-2">
                      {leave.is_company_wide && (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Company-wide
                        </Badge>
                      )}
                      {!leave.is_company_wide && (
                        <Badge variant="outline" className="text-xs">
                          <Building className="h-3 w-3 mr-1" />
                          Branch
                        </Badge>
                      )}
                      {leave.is_recurring && (
                        <Badge variant="outline" className="text-xs">
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(leave.leave_date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLeave(leave.id)}
                  disabled={deleteAnnualLeave.isPending}
                  className="text-red-600 hover:text-red-700"
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