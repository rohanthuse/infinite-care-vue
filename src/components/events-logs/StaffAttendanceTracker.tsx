
import React, { useState } from "react";
import { Clock, Search, Plus, X, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: string;
  name: string;
}

interface StaffAttendance {
  staffId: string;
  name: string;
  status: "present" | "absent" | "late" | "unknown";
  timeIn?: string;
  timeOut?: string;
  notes?: string;
}

interface StaffAttendanceTrackerProps {
  staff: Array<StaffMember>;
  value: Array<StaffAttendance>;
  onChange: (attendance: Array<StaffAttendance>) => void;
}

export function StaffAttendanceTracker({ 
  staff, 
  value = [], 
  onChange 
}: StaffAttendanceTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllStaff, setShowAllStaff] = useState(false);
  
  // Initialize attendance records for all staff members
  const allStaffAttendance = staff.map(staffMember => {
    const existingRecord = value.find(record => record.staffId === staffMember.id);
    return existingRecord || {
      staffId: staffMember.id,
      name: staffMember.name,
      status: "unknown" as const,
    };
  });
  
  // Filter staff based on search and display settings
  const filteredAttendance = allStaffAttendance.filter(staffAttendance => {
    const matchesSearch = searchTerm ? 
      staffAttendance.name.toLowerCase().includes(searchTerm.toLowerCase()) : 
      true;
    
    const shouldShow = showAllStaff || 
      staffAttendance.status === "present" || 
      staffAttendance.status === "late";
      
    return matchesSearch && shouldShow;
  });
  
  // Handle status change
  const handleStatusChange = (staffId: string, status: "present" | "absent" | "late" | "unknown") => {
    const updatedAttendance = allStaffAttendance.map(record => {
      if (record.staffId === staffId) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        return {
          ...record,
          status,
          timeIn: status === "present" || status === "late" ? record.timeIn || currentTime : undefined,
        };
      }
      return record;
    });
    
    onChange(updatedAttendance);
  };
  
  // Handle time change
  const handleTimeChange = (staffId: string, field: "timeIn" | "timeOut", time: string) => {
    const updatedAttendance = allStaffAttendance.map(record => {
      if (record.staffId === staffId) {
        return { ...record, [field]: time };
      }
      return record;
    });
    
    onChange(updatedAttendance);
  };
  
  // Handle notes change
  const handleNotesChange = (staffId: string, notes: string) => {
    const updatedAttendance = allStaffAttendance.map(record => {
      if (record.staffId === staffId) {
        return { ...record, notes };
      }
      return record;
    });
    
    onChange(updatedAttendance);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "late":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search staff members..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show-all" 
            checked={showAllStaff} 
            onCheckedChange={(checked) => setShowAllStaff(!!checked)} 
          />
          <Label htmlFor="show-all" className="text-sm cursor-pointer">
            Show all staff
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredAttendance.length > 0 ? (
          filteredAttendance.map((staffAttendance) => (
            <Card key={staffAttendance.staffId} className={cn(
              "border",
              staffAttendance.status === "present" && "border-l-4 border-l-green-500",
              staffAttendance.status === "absent" && "border-l-4 border-l-red-500",
              staffAttendance.status === "late" && "border-l-4 border-l-amber-500",
            )}>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(staffAttendance.status)}
                      <span className="font-medium">{staffAttendance.name}</span>
                    </div>
                    <Select
                      value={staffAttendance.status}
                      onValueChange={(value: "present" | "absent" | "late" | "unknown") => 
                        handleStatusChange(staffAttendance.staffId, value)
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(staffAttendance.status === "present" || staffAttendance.status === "late") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`time-in-${staffAttendance.staffId}`} className="text-xs mb-1">
                          Time In
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id={`time-in-${staffAttendance.staffId}`}
                            type="time"
                            className="pl-10"
                            value={staffAttendance.timeIn || ""}
                            onChange={(e) => handleTimeChange(staffAttendance.staffId, "timeIn", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`time-out-${staffAttendance.staffId}`} className="text-xs mb-1">
                          Time Out
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id={`time-out-${staffAttendance.staffId}`}
                            type="time"
                            className="pl-10"
                            value={staffAttendance.timeOut || ""}
                            onChange={(e) => handleTimeChange(staffAttendance.staffId, "timeOut", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(staffAttendance.status === "present" || staffAttendance.status === "late") && (
                    <div>
                      <Label htmlFor={`notes-${staffAttendance.staffId}`} className="text-xs mb-1">
                        Notes
                      </Label>
                      <Input
                        id={`notes-${staffAttendance.staffId}`}
                        placeholder="Add attendance notes"
                        value={staffAttendance.notes || ""}
                        onChange={(e) => handleNotesChange(staffAttendance.staffId, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-6 border border-dashed border-gray-300 rounded-md">
            <p className="text-gray-500">No staff members match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
