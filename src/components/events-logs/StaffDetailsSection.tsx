
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { StaffAttendanceTracker } from "./StaffAttendanceTracker";
import { OtherAttendees } from "./OtherAttendees";

interface StaffMember {
  id: string;
  name: string;
}

interface StaffDetailsSectionProps {
  staff: Array<StaffMember>;
  form: UseFormReturn<any>;
}

export function StaffDetailsSection({ staff, form }: StaffDetailsSectionProps) {
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
  
  // Update form values when attendance changes
  const handleStaffAttendanceChange = (attendance: any[]) => {
    setStaffAttendance(attendance);
    
    // Update form field values if needed
    const staffPresent = attendance
      .filter(record => record.status === "present" || record.status === "late")
      .map(record => record.staffId);
      
    form.setValue("staffPresent", staffPresent);
  };
  
  // Update form values when other attendees change
  const handleOtherAttendeesChange = (attendees: any[]) => {
    setOtherAttendees(attendees);
    
    // Update form field values if needed
    form.setValue("peoplePresent", attendees);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Staff Attendance</h4>
        <Card className="p-4">
          <StaffAttendanceTracker 
            staff={staff}
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
  );
}
