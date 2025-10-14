import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useAttendanceRecords } from "@/hooks/useAttendanceRecords";

interface CarerViewAttendanceTabProps {
  carerId: string;
}

export const CarerViewAttendanceTab: React.FC<CarerViewAttendanceTabProps> = ({ carerId }) => {
  const { data: carerProfile, isLoading: isProfileLoading } = useCarerProfileById(carerId);
  const { data: attendanceRecords = [], isLoading: isAttendanceLoading } = useAttendanceRecords(
    carerProfile?.branch_id || "", 
    {
      attendanceType: 'staff',
      dateRange: {
        from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        to: new Date()
      }
    }
  );
  
  const isLoading = isProfileLoading || isAttendanceLoading;
  
  // Filter records for this specific carer
  const carerRecords = attendanceRecords.filter(record => 
    record.person_id === carerId
  );

  // Calculate statistics
  const totalRecords = carerRecords.length;
  const presentCount = carerRecords.filter(r => 
    r.status === 'present' || r.status === 'late'
  ).length;
  const lateCount = carerRecords.filter(r => r.status === 'late').length;
  const absentCount = carerRecords.filter(r => r.status === 'absent').length;
  const totalHours = carerRecords.reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0);
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0.0';

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return <Badge variant="success">Present</Badge>;
      case 'late':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100/80">Late</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'sick':
        return <Badge variant="info">Sick Leave</Badge>;
      case 'holiday':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100/80">Holiday</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDayOfWeek = (dateString: string) => {
    return format(new Date(dateString), 'EEEE');
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  if (isLoading || !carerProfile?.branch_id) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Attendance Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late Arrivals</p>
                <p className="text-2xl font-bold">{lateCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent Days</p>
                <p className="text-2xl font-bold">{absentCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carerRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No attendance records found</p>
              <p className="text-sm mt-2">Attendance records will appear here once logged</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-muted/50 grid grid-cols-7 gap-4 p-4 font-medium text-sm border-b">
                <div>Date</div>
                <div>Day</div>
                <div>Check-in</div>
                <div>Check-out</div>
                <div>Hours</div>
                <div>Status</div>
                <div>Notes</div>
              </div>

              {/* Table Body */}
              <div className="divide-y">
                {carerRecords
                  .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime())
                  .map((record) => (
                    <div
                      key={record.id}
                      className="grid grid-cols-7 gap-4 p-4 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <div className="font-medium">
                        {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-muted-foreground">
                        {getDayOfWeek(record.attendance_date)}
                      </div>
                      <div>{formatTime(record.check_in_time)}</div>
                      <div>{formatTime(record.check_out_time)}</div>
                      <div className="font-medium">
                        {record.hours_worked ? `${Number(record.hours_worked).toFixed(1)}h` : '-'}
                      </div>
                      <div>{getStatusBadge(record.status)}</div>
                      <div className="text-muted-foreground truncate" title={record.notes || ''}>
                        {record.notes || '-'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
