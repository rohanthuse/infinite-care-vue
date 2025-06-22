
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, AlertCircle } from "lucide-react";
import { useAutomaticAttendance, useGetTodayAttendance, AutoAttendanceData } from "@/hooks/useAutomaticAttendance";
import { format } from "date-fns";

interface AttendanceStatusWidgetProps {
  personId: string;
  personType: 'staff' | 'client';
  branchId: string;
  personName: string;
  showActions?: boolean;
}

export function AttendanceStatusWidget({ 
  personId, 
  personType, 
  branchId, 
  personName,
  showActions = true 
}: AttendanceStatusWidgetProps) {
  const [attendanceStatus, setAttendanceStatus] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  
  const automaticAttendance = useAutomaticAttendance();
  const getTodayAttendance = useGetTodayAttendance(personId);

  const loadTodayAttendance = React.useCallback(async () => {
    try {
      console.log('[AttendanceStatusWidget] Loading attendance for:', personId);
      setIsLoading(true);
      setError(null);
      
      const today = await getTodayAttendance();
      console.log('[AttendanceStatusWidget] Attendance data:', today);
      setAttendanceStatus(today);
      setRetryCount(0);
    } catch (error: any) {
      console.error('[AttendanceStatusWidget] Error loading attendance:', error);
      setError(error.message || 'Failed to load attendance data');
      
      // Retry with exponential backoff (max 3 retries)
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadTodayAttendance();
        }, delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getTodayAttendance, retryCount, personId]);

  React.useEffect(() => {
    if (personId && branchId) {
      loadTodayAttendance();
    }
  }, [loadTodayAttendance, personId, branchId]);

  // Add loading timeout
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[AttendanceStatusWidget] Loading timeout reached');
        setIsLoading(false);
        setError('Loading timeout - please try refreshing');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleCheckIn = async () => {
    const attendanceData: AutoAttendanceData = {
      personId,
      personType,
      branchId,
      action: 'check_in'
    };

    try {
      await automaticAttendance.mutateAsync(attendanceData);
      await loadTodayAttendance();
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleCheckOut = async () => {
    const attendanceData: AutoAttendanceData = {
      personId,
      personType,
      branchId,
      action: 'check_out'
    };

    try {
      await automaticAttendance.mutateAsync(attendanceData);
      await loadTodayAttendance();
    } catch (error) {
      console.error('Check-out error:', error);
    }
  };

  const getStatusBadge = () => {
    if (!attendanceStatus) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700">Not Checked In</Badge>;
    }

    if (attendanceStatus.check_in_time && !attendanceStatus.check_out_time) {
      return <Badge variant="outline" className="bg-green-50 text-green-700">Checked In</Badge>;
    }

    if (attendanceStatus.check_in_time && attendanceStatus.check_out_time) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Completed</Badge>;
    }

    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{attendanceStatus.status}</Badge>;
  };

  if (error) {
    return (
      <Card className="border-red-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Attendance Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-red-600">
            {error}
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setRetryCount(0);
              loadTodayAttendance();
            }}
            className="w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Loading attendance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{personName}</span>
          {getStatusBadge()}
        </div>

        {attendanceStatus && (
          <div className="space-y-2 text-sm">
            {attendanceStatus.check_in_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-green-600" />
                <span>Check-in: {attendanceStatus.check_in_time}</span>
              </div>
            )}
            {attendanceStatus.check_out_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-blue-600" />
                <span>Check-out: {attendanceStatus.check_out_time}</span>
              </div>
            )}
            {attendanceStatus.hours_worked > 0 && (
              <div className="text-xs text-gray-500">
                Hours worked: {attendanceStatus.hours_worked}
              </div>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            {(!attendanceStatus || !attendanceStatus.check_in_time) && (
              <Button 
                size="sm" 
                onClick={handleCheckIn}
                disabled={automaticAttendance.isPending}
                className="flex-1"
              >
                <Clock className="h-3 w-3 mr-1" />
                Check In
              </Button>
            )}
            
            {attendanceStatus?.check_in_time && !attendanceStatus?.check_out_time && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCheckOut}
                disabled={automaticAttendance.isPending}
                className="flex-1"
              >
                <Clock className="h-3 w-3 mr-1" />
                Check Out
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </CardContent>
    </Card>
  );
}
