import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface MessageFollowUpSectionProps {
  followUpAssignedTo: string;
  followUpDate: Date | undefined;
  followUpNotes: string;
  onAssignedToChange: (value: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onNotesChange: (notes: string) => void;
  staffList: StaffMember[];
  isLoadingStaff?: boolean;
}

export const MessageFollowUpSection: React.FC<MessageFollowUpSectionProps> = ({
  followUpAssignedTo,
  followUpDate,
  followUpNotes,
  onAssignedToChange,
  onDateChange,
  onNotesChange,
  staffList,
  isLoadingStaff = false
}) => {
  return (
    <div className="border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
        <FileText className="h-4 w-4" />
        Follow-up Assignment
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assigned To */}
        <div className="space-y-2">
          <Label htmlFor="followUpAssignedTo" className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            Assign To
          </Label>
          <Select value={followUpAssignedTo} onValueChange={onAssignedToChange}>
            <SelectTrigger id="followUpAssignedTo">
              <SelectValue placeholder={isLoadingStaff ? "Loading staff..." : "Select staff member"} />
            </SelectTrigger>
            <SelectContent>
              {staffList.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.first_name} {staff.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Follow-up Date */}
        <div className="space-y-2">
          <Label htmlFor="followUpDate" className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Follow-up Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="followUpDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !followUpDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {followUpDate ? format(followUpDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={followUpDate}
                onSelect={onDateChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Follow-up Notes */}
      <div className="space-y-2">
        <Label htmlFor="followUpNotes" className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Follow-up Notes
        </Label>
        <Textarea
          id="followUpNotes"
          placeholder="Describe the required follow-up action..."
          value={followUpNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );
};
