
import React, { useState } from "react";
import { Calendar, Check, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isToday } from "date-fns";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useCarerBranch } from "@/hooks/useCarerBranch";
import { useAttendanceRecords } from "@/hooks/useAttendanceRecords";
import { AttendanceStatusWidget } from "@/components/attendance/AttendanceStatusWidget";

const CarerAttendance: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user } = useCarerAuth();
  const { data: carerBranch } = useCarerBranch();
  
  // Get attendance records for the carer
  const { data: attendanceRecords = [], isLoading } = useAttendanceRecords(
    carerBranch?.branch_id || "",
    {
      attendanceType: 'staff',
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        to: new Date()
      }
    }
  );

  // Filter records for current user
  const myAttendanceRecords = attendanceRecords.filter(
    record => record.person_id === user?.id
  );

  if (isLoading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Attendance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Today's Attendance Widget */}
        <div className="md:col-span-2">
          {user && carerBranch ? (
            <AttendanceStatusWidget
              personId={user.id}
              personType="staff"
              branchId={carerBranch.branch_id}
              personName={`${carerBranch.first_name} ${carerBranch.last_name}`}
              showActions={true}
            />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading your attendance status...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-2 border rounded-md">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Your recent attendance records</CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Filter by Date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <CalendarComponent
                  mode="range"
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {myAttendanceRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAttendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(new Date(record.attendance_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>{record.check_in_time || '-'}</TableCell>
                    <TableCell>{record.check_out_time || '-'}</TableCell>
                    <TableCell>{record.hours_worked || '0'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          : record.status === 'late'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                          : record.status === 'absent'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {record.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attendance records found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your attendance will appear here once you start checking in.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerAttendance;
