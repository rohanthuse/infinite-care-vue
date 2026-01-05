
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, AlertCircle, RotateCcw } from "lucide-react";
import { useAutomaticAttendance, useTodayAttendance, AutoAttendanceData } from "@/hooks/useAutomaticAttendance";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const automaticAttendance = useAutomaticAttendance();
  const { data: attendanceStatus, isLoading, error, refetch } = useTodayAttendance(personId);
  const [showRecheckDialog, setShowRecheckDialog] = useState(false);

  const handleCheckIn = async () => {
    const attendanceData: AutoAttendanceData = {
      personId,
      personType,
      branchId,
      action: 'check_in'
    };

    try {
      await automaticAttendance.mutateAsync(attendanceData);
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
    } catch (error) {
      console.error('Check-out error:', error);
    }
  };

  const handleReCheckIn = async () => {
    const attendanceData: AutoAttendanceData = {
      personId,
      personType,
      branchId,
      action: 'recheck_in'
    };

    try {
      await automaticAttendance.mutateAsync(attendanceData);
      setShowRecheckDialog(false);
    } catch (error) {
      console.error('Re-check-in error:', error);
    }
  };

  const getStatusBadge = () => {
    if (!attendanceStatus) {
      return <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Not Checked In</Badge>;
    }

    if (attendanceStatus.check_in_time && !attendanceStatus.check_out_time) {
      return <Badge variant="outline" className="bg-green-50 text-green-700">Checked In</Badge>;
    }

    if (attendanceStatus.check_in_time && attendanceStatus.check_out_time) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Completed</Badge>;
    }

    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{attendanceStatus.status}</Badge>;
  };

  const isCompleted = attendanceStatus?.check_in_time && attendanceStatus?.check_out_time;
  const isCheckedIn = attendanceStatus?.check_in_time && !attendanceStatus?.check_out_time;

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
            {error.message || 'Failed to load attendance data'}
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => refetch()}
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
            
            {isCheckedIn && (
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

            {isCompleted && (
              <AlertDialog open={showRecheckDialog} onOpenChange={setShowRecheckDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    disabled={automaticAttendance.isPending}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Re-Check In
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Re-Check In Confirmation</AlertDialogTitle>
                    <AlertDialogDescription>
                      You have already checked out for today. Are you sure you want to re-check in? 
                      This will clear your checkout time and allow you to continue working.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleReCheckIn}
                      disabled={automaticAttendance.isPending}
                    >
                      Re-Check In
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
