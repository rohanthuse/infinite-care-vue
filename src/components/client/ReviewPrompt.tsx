
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Calendar, User } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface ReviewPromptProps {
  completedAppointments: Array<{
    id: string;
    type: string;
    provider: string;
    date: string;
    time: string;
    staff_id?: string;
    client_id?: string;
    completed_at?: string;
  }>;
}

export function ReviewPrompt({ completedAppointments }: ReviewPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingReviews, setPendingReviews] = useState([]);
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  // Check for appointments that need reviews
  useEffect(() => {
    if (!completedAppointments || completedAppointments.length === 0) return;

    // Filter appointments completed in the last 7 days that don't have reviews
    const recentCompletedAppointments = completedAppointments.filter(appointment => {
      const completedDate = new Date(appointment.completed_at || appointment.date);
      const daysSinceCompletion = Math.floor((Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCompletion <= 7 && daysSinceCompletion >= 0;
    });

    setPendingReviews(recentCompletedAppointments);
    setShowPrompt(recentCompletedAppointments.length > 0);
  }, [completedAppointments]);

  const handleReviewAppointment = (appointment: any) => {
    setShowPrompt(false);
    const targetPath = tenantSlug 
      ? `/${tenantSlug}/client-dashboard/reviews`
      : '/client-dashboard/reviews';
    
    // Pass appointment data via navigation state
    navigate(targetPath, { 
      state: { 
        appointment: {
          id: appointment.id,
          type: appointment.type,
          provider: appointment.provider,
          date: appointment.date,
          time: appointment.time,
          client_id: appointment.client_id,
          staff_id: appointment.staff_id
        }
      }
    });
  };

  const handleSkipReviews = () => {
    setShowPrompt(false);
    // Store in localStorage to avoid showing again for a while
    localStorage.setItem('reviewPromptDismissed', Date.now().toString());
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Set reminder for 24 hours later
    const reminderTime = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('reviewPromptReminder', reminderTime.toString());
  };

  // Check if we should show the prompt based on previous dismissals
  useEffect(() => {
    const dismissed = localStorage.getItem('reviewPromptDismissed');
    const reminder = localStorage.getItem('reviewPromptReminder');
    
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = Math.floor((Date.now() - dismissedTime) / (1000 * 60 * 60 * 24));
      if (daysSinceDismissed < 3) { // Don't show for 3 days after dismissal
        setShowPrompt(false);
        return;
      }
    }
    
    if (reminder) {
      const reminderTime = parseInt(reminder);
      if (Date.now() < reminderTime) {
        setShowPrompt(false);
        return;
      } else {
        localStorage.removeItem('reviewPromptReminder');
      }
    }
  }, []);

  if (!showPrompt || pendingReviews.length === 0) return null;

  return (
    <>
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Star className="h-5 w-5" />
              Share Your Experience
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground">
              We'd love to hear about your recent care experience! Your feedback helps us improve our services.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Recent Appointments:</h4>
              {pendingReviews.slice(0, 3).map((appointment: any, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded border border-border">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-950/30 p-2 rounded-full">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{appointment.provider}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {appointment.date} at {appointment.time}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleReviewAppointment(appointment)}
                  >
                    Feedback
                  </Button>
                </div>
              ))}
              {pendingReviews.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{pendingReviews.length - 3} more appointment{pendingReviews.length - 3 > 1 ? 's' : ''} awaiting feedback
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleSkipReviews} className="flex-1">
              Skip for Now
            </Button>
            <Button variant="outline" onClick={handleRemindLater} className="flex-1">
              Remind Me Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
