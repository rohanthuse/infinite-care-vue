
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StaffAttendanceTracker } from "@/components/events-logs/StaffAttendanceTracker";
import { OtherAttendees } from "@/components/events-logs/OtherAttendees";
import { CalendarDays, Clock, Download, Users } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceInfo } from "@/components/events-logs/AttendanceInfo";

interface AttendanceTabProps {
  branchId: string;
  branchName?: string;
}

// Mock data for staff members
const mockStaff = [
  { id: "staff-001", name: "Dr. James Wilson" },
  { id: "staff-002", name: "Nurse Sarah Johnson" },
  { id: "staff-003", name: "Dr. Emma Thompson" },
  { id: "staff-004", name: "Nurse David Wilson" },
  { id: "staff-005", name: "Dr. Michael Scott" },
  { id: "staff-006", name: "Nurse Pam Beesly" },
  { id: "staff-007", name: "Dr. Dwight Schrute" },
];

export function AttendanceTab({ branchId, branchName }: AttendanceTabProps) {
  const [activeTab, setActiveTab] = useState("today");
  const [date, setDate] = useState<Date>(new Date());
  const [staffAttendance, setStaffAttendance] = useState<Array<{
    staffId: string;
    name: string;
    status: "present" | "absent" | "late" | "unknown";
    timeIn?: string;
    timeOut?: string;
    notes?: string;
  }>>([]);
  
  const [otherAttendees, setOtherAttendees] = useState<Array<{
    id: string;
    name: string;
    relationship: string;
    timeIn?: string;
    timeOut?: string;
  }>>([]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDate(date);
    }
  };

  const handleStaffAttendanceChange = (attendance: any[]) => {
    setStaffAttendance(attendance);
  };
  
  const handleOtherAttendeesChange = (attendees: any[]) => {
    setOtherAttendees(attendees);
  };

  // Filter for present or late staff to show in the summary
  const staffPresent = staffAttendance
    .filter(staff => staff.status === "present" || staff.status === "late")
    .map(staff => ({
      id: staff.staffId,
      name: staff.name,
      timeIn: staff.timeIn,
      timeOut: staff.timeOut
    }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Attendance Tracker</h2>
          <div className="flex items-center gap-3">
            <DatePicker date={date} onDateChange={handleDateChange} />
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
            <span>Date: {format(date, "dd MMMM yyyy")}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>Current time: {format(new Date(), "HH:mm")}</span>
          </div>
          
          <Select defaultValue="all-day">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-day">All day</SelectItem>
              <SelectItem value="morning">Morning shift</SelectItem>
              <SelectItem value="afternoon">Afternoon shift</SelectItem>
              <SelectItem value="evening">Evening shift</SelectItem>
              <SelectItem value="night">Night shift</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary card */}
        <Card className="mt-6 p-4 bg-gray-50">
          <div className="text-sm font-medium mb-2">Today's attendance summary</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">
                Present: {staffAttendance.filter(s => s.status === "present").length}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
              <span className="text-sm">
                Late: {staffAttendance.filter(s => s.status === "late").length}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm">
                Absent: {staffAttendance.filter(s => s.status === "absent").length}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
              <span className="text-sm">
                Unknown: {staffAttendance.filter(s => s.status === "unknown").length}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm">
                Other attendees: {otherAttendees.length}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <AttendanceInfo 
              staffPresent={staffPresent} 
              otherAttendees={otherAttendees} 
            />
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="today">Manage Attendance</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today">
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Staff Attendance</h4>
              <Card className="p-4">
                <StaffAttendanceTracker 
                  staff={mockStaff}
                  value={staffAttendance}
                  onChange={handleStaffAttendanceChange}
                />
              </Card>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Other People Present</h4>
              <Card className="p-4">
                <OtherAttendees 
                  value={otherAttendees}
                  onChange={handleOtherAttendeesChange}
                />
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
              <p className="text-amber-800">The attendance history feature will be implemented soon.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
