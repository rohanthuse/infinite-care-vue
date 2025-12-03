import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle } from "lucide-react";
import { useAutomaticAttendance, useTodayAttendance } from "@/hooks/useAutomaticAttendance";
import { useUnifiedCarerAuth } from "@/hooks/useUnifiedCarerAuth";
import { toast } from "sonner";
import { format } from "date-fns";

export const CarerAttendanceCheckInModal: React.FC = () => {
  const { user, carerProfile } = useUnifiedCarerAuth();
  const { data: todayAttendance, isLoading: isLoadingAttendance } = useTodayAttendance(user?.id || '');
  const automaticAttendance = useAutomaticAttendance();
  const [open, setOpen] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  // Determine if popup should show
  useEffect(() => {
    if (isLoadingAttendance || hasShownPopup) return;
    
    // Check sessionStorage to prevent showing multiple times in same session
    const shownKey = `attendance_popup_shown_${format(new Date(), 'yyyy-MM-dd')}`;
    if (sessionStorage.getItem(shownKey)) {
      setHasShownPopup(true);
      return;
    }

    // Show popup if no attendance record exists for today or no check-in time
    if (!todayAttendance || !todayAttendance.check_in_time) {
      setOpen(true);
      setHasShownPopup(true);
      sessionStorage.setItem(shownKey, 'true');
    } else {
      setHasShownPopup(true);
    }
  }, [todayAttendance, isLoadingAttendance, hasShownPopup]);

  const handleCheckIn = async () => {
    if (!user || !carerProfile) return;

    try {
      await automaticAttendance.mutateAsync({
        personId: user.id,
        personType: 'staff',
        branchId: carerProfile.branch_id,
        action: 'check_in'
      });
      
      toast.success("Checked in successfully!", {
        description: `Welcome back, ${carerProfile.first_name}! Your attendance has been recorded.`
      });
      
      setOpen(false);
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast.error("Failed to check in", {
        description: error.message || "Please try again or contact support."
      });
    }
  };

  const handleDismiss = () => {
    setOpen(false);
  };

  // Don't render if user/profile not available or still loading
  if (!user || !carerProfile || isLoadingAttendance) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <AlertDialogTitle className="text-xl">
            Complete Today's Attendance
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Please complete Today's Attendance.
          </AlertDialogDescription>
          <p className="text-sm text-muted-foreground mt-2">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full sm:w-auto"
          >
            Later
          </Button>
          <Button
            onClick={handleCheckIn}
            disabled={automaticAttendance.isPending}
            className="w-full sm:w-auto"
          >
            {automaticAttendance.isPending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check In
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
