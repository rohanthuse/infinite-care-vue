import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useAttendanceRecords } from "@/hooks/useAttendanceRecords";
import { useCarerProfileById } from "@/hooks/useCarerProfile";

interface CarerAttendanceTabProps {
  carerId: string;
}

export const CarerAttendanceTab: React.FC<CarerAttendanceTabProps> = ({ carerId }) => {
  const { data: carerProfile } = useCarerProfileById(carerId);
  const { data: attendanceRecords = [], isLoading, error } = useAttendanceRecords(
    carerProfile?.branch_id || "", 
    {
      attendanceType: 'staff',
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        to: new Date()
      }
    }
  );
  
  // Filter records for this specific carer and calculate stats
  const carerRecords = attendanceRecords.filter(record => 
    record.person_name === `${carerProfile?.first_name} ${carerProfile?.last_name}`
  );
  
  const stats = {
    attendanceRate: carerRecords.length > 0 ? Math.round((carerRecords.filter(r => r.status === 'present').length / carerRecords.length) * 100) : 0,
    totalHoursThisMonth: Math.round(carerRecords.reduce((sum, record) => sum + (record.hours_worked || 0), 0)),
    lateArrivals: carerRecords.filter(r => r.status === 'late').length,
    absentDays: carerRecords.filter(r => r.status === 'absent').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'late':
        return <Badge className="bg-amber-100 text-amber-800">Late</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'sick':
        return <Badge className="bg-blue-100 text-blue-800">Sick</Badge>;
      case 'holiday':
        return <Badge className="bg-purple-100 text-purple-800">Holiday</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading attendance records...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Error Loading Attendance Data</h3>
            <p className="text-muted-foreground">Unable to load attendance records. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</div>
              <div className="text-sm text-muted-foreground">Attendance Rate</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalHoursThisMonth}</div>
              <div className="text-sm text-muted-foreground">Hours This Month</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{stats.lateArrivals}</div>
              <div className="text-sm text-muted-foreground">Late Arrivals</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.absentDays}</div>
              <div className="text-sm text-muted-foreground">Absent Days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Attendance
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {carerRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No attendance records found</p>
              </div>
            ) : (
              attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-medium">{new Date(record.attendance_date).getDate()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium">{new Date(record.attendance_date).toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.status === 'absent' ? 'No attendance recorded' : 
                         record.check_in_time && record.check_out_time ?
                         `${record.check_in_time} - ${record.check_out_time}` : 
                         record.check_in_time ? `In: ${record.check_in_time}` : 'No time recorded'}
                      </div>
                      {record.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{record.notes}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">{record.hours_worked || 0}h</div>
                      <div className="text-xs text-muted-foreground">hours</div>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recent Leave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {carerRecords.filter(r => ['sick', 'holiday'].includes(r.status)).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent leave records</p>
              </div>
            ) : (
              carerRecords
                .filter(r => ['sick', 'holiday'].includes(r.status))
                .slice(0, 5)
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {record.status === 'sick' ? 'Sick Leave' : 'Holiday'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.attendance_date).toLocaleDateString()}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{record.notes}</p>
                      )}
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};