import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";

interface CarerAttendanceTabProps {
  carerId: string;
}

export const CarerAttendanceTab: React.FC<CarerAttendanceTabProps> = ({ carerId }) => {
  const mockAttendanceData = [
    { date: '2024-01-15', status: 'Present', hours: 8, clockIn: '09:00', clockOut: '17:00' },
    { date: '2024-01-14', status: 'Present', hours: 8, clockIn: '09:05', clockOut: '17:00' },
    { date: '2024-01-13', status: 'Late', hours: 7.5, clockIn: '09:30', clockOut: '17:00' },
    { date: '2024-01-12', status: 'Absent', hours: 0, clockIn: '-', clockOut: '-' },
    { date: '2024-01-11', status: 'Present', hours: 8, clockIn: '08:55', clockOut: '16:55' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'Late':
        return <Badge className="bg-amber-100 text-amber-800">Late</Badge>;
      case 'Absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-muted-foreground">Attendance Rate</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">160</div>
              <div className="text-sm text-muted-foreground">Hours This Month</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">2</div>
              <div className="text-sm text-muted-foreground">Late Arrivals</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">1</div>
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
            {mockAttendanceData.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-medium">{new Date(record.date).getDate()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{new Date(record.date).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.status === 'Absent' ? 'No attendance recorded' : `${record.clockIn} - ${record.clockOut}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium">{record.hours}h</div>
                    <div className="text-xs text-muted-foreground">hours</div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Annual Leave</p>
                <p className="text-sm text-muted-foreground">March 15-19, 2024</p>
              </div>
              <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Sick Leave</p>
                <p className="text-sm text-muted-foreground">January 12, 2024</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Approved</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};