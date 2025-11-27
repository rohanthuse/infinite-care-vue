import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StaffSummary {
  id: string;
  name: string;
  attendanceRate: number;
  totalHours: number;
  absentDays: number;
}

interface AttendanceStaffSidebarProps {
  staff: StaffSummary[];
  selectedStaffId: string | null;
  onSelectStaff: (staffId: string | null) => void;
}

export const AttendanceStaffSidebar: React.FC<AttendanceStaffSidebarProps> = ({
  staff,
  selectedStaffId,
  onSelectStaff,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Staff Members</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-1 p-4">
            <button
              onClick={() => onSelectStaff(null)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                selectedStaffId === null
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>All</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">All Staff</p>
                <p className="text-xs opacity-80">View combined data</p>
              </div>
            </button>

            {staff.map((member) => (
              <button
                key={member.id}
                onClick={() => onSelectStaff(member.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  selectedStaffId === member.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <div className="flex gap-2 text-xs opacity-80">
                    <span>{member.attendanceRate.toFixed(0)}%</span>
                    <span>•</span>
                    <span>{member.totalHours.toFixed(1)}h</span>
                    {member.absentDays > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-destructive">{member.absentDays} absent</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
