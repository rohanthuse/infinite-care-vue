import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ClipboardCheck, Calendar, Star, AlertTriangle } from "lucide-react";
import { BookingItem } from "@/components/dashboard/BookingItem";
import { ReviewItem, ReviewItemSkeleton } from "@/components/dashboard/ReviewItem";
import { ActionItem } from "@/components/dashboard/ActionItem";
import { UnavailabilityRequestsCard } from "@/components/admin/UnavailabilityRequestsCard";
import { useBranchStatistics } from "@/data/hooks/useBranchStatistics";
import { useBookingNavigation } from "@/hooks/useBookingNavigation";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";
import { useTasks } from "@/hooks/useTasks";
import { format, formatDistanceToNow } from "date-fns";

interface DashboardActivitySectionProps {
  branchId: string | undefined;
}

export const DashboardActivitySection: React.FC<DashboardActivitySectionProps> = ({ branchId }) => {
  const { data: branchStats, isLoading: isLoadingBranchStats, error: branchStatsError } = useBranchStatistics(branchId);
  const { navigateToBookings } = useBookingNavigation();
  const { branchName, handleTabChange } = useBranchDashboardNavigation();
  const { tasks, isLoading: isLoadingTasks, error: tasksError } = useTasks(branchId || "");

  const handleBookingClick = (clientName?: string) => {
    if (branchId && branchName && clientName) {
      // For individual booking clicks, we'll navigate to today's bookings
      // Since we don't have client_id in BookingWithDetails, we'll just navigate to today's view
      navigateToBookings({
        branchId,
        branchName,
        date: new Date(), // Today's date
      });
    }
  };

  const handleViewAllBookings = () => {
    if (branchId && branchName) {
      navigateToBookings({
        branchId,
        branchName,
        date: new Date(),
      });
    }
  };

  const handleViewAllTasks = () => {
    handleTabChange('task-matrix');
  };

  const handleReassignClick = (bookingId: string, requestId: string) => {
    // Navigate to bookings tab to handle reassignment
    handleTabChange('bookings');
  };

  // Filter and prepare urgent tasks for display
  const urgentTasks = tasks
    .filter(task => task.status !== 'done' && (task.priority === 'high' || task.priority === 'urgent'))
    .slice(0, 4);  // Show maximum 4 tasks

  return (
    <>
      {/* Unavailability Requests - Priority Alert Card */}
      <div className="mb-6">
        <UnavailabilityRequestsCard 
          branchId={branchId}
          onReassignClick={handleReassignClick}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  Today's Bookings
                </CardTitle>
                <CardDescription>Appointments for today</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-primary border-primary/20 hover:bg-primary/10"
                onClick={handleViewAllBookings}
              >
                View All
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="space-y-1 min-w-[400px]">
              {isLoadingBranchStats ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-2 border-b border-border last:border-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-14 bg-muted rounded-full animate-pulse" />
                    </div>
                  </div>
                ))
              ) : branchStatsError ? (
                <p className="text-destructive text-center py-4">Error loading bookings.</p>
              ) : branchStats?.todaysBookings && branchStats.todaysBookings.length > 0 ? (
                branchStats.todaysBookings.map((booking, index) => {
                  const now = new Date();
                  const startTime = new Date(booking.start_time);
                  const endTime = new Date(booking.end_time);
                  let status = "Booked";
                  if (now > endTime) {
                    status = "Done";
                  } else if (now >= startTime) {
                    status = "Waiting";
                  }

                  const clientName = booking.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'N/A';

                  return (
                    <BookingItem
                      key={booking.id}
                      number={`${index + 1}`}
                      staff={`${booking.staff?.first_name || 'N/A'} ${booking.staff?.last_name || ''}`}
                      client={clientName}
                      time={`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
                      status={status}
                      onClick={() => handleBookingClick(clientName)}
                    />
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">No bookings for today.</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-600" />
              Recent Feedbacks
            </CardTitle>
            <CardDescription>Latest client feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {isLoadingBranchStats ? (
                Array.from({ length: 3 }).map((_, i) => <ReviewItemSkeleton key={i} />)
              ) : branchStatsError ? (
                <p className="text-destructive text-center py-4">Error loading feedbacks.</p>
              ) : branchStats?.latestReviews && branchStats.latestReviews.length > 0 ? (
                branchStats.latestReviews.map((review) => {
                  const clientName = review.client ? `${review.client.first_name} ${review.client.last_name.charAt(0)}.` : 'Anonymous';
                  const staffName = review.staff ? `for ${review.staff.first_name} ${review.staff.last_name}` : '';
                  const dateText = review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : 'some time ago';
                  
                  return (
                    <ReviewItem
                      key={review.id}
                      client={clientName}
                      staff={staffName}
                      date={dateText}
                      rating={review.rating}
                      comment={review.comment || ''}
                    />
                  )
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">No feedbacks yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-rose-600" />
                  Action Items
                </CardTitle>
                <CardDescription>Tasks requiring attention</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-primary border-primary/20 hover:bg-primary/10"
                onClick={handleViewAllTasks}
              >
                View All Tasks
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {isLoadingTasks ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-card shadow-sm">
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : tasksError ? (
                <p className="text-destructive text-center py-4 col-span-full">Error loading tasks.</p>
              ) : urgentTasks.length > 0 ? (
                urgentTasks.map((task) => {
                  const assigneeName = task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Unassigned';
                  const clientName = task.client ? `${task.client.first_name} ${task.client.last_name}` : assigneeName;
                  const dueDate = task.due_date ? format(new Date(task.due_date), 'MMM dd') : 'No due date';
                  
                  return (
                    <ActionItem
                      key={task.id}
                      title={task.title}
                      name={clientName}
                      date={dueDate}
                      priority={task.priority === 'urgent' ? 'High' : task.priority === 'high' ? 'High' : 'Medium'}
                    />
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p>No urgent tasks found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Expiry Alerts
                </CardTitle>
                <CardDescription>Staff documents requiring attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoadingBranchStats ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="h-6 w-6 bg-muted rounded animate-pulse mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : branchStatsError ? (
                <p className="text-destructive text-center py-4 col-span-full">Error loading action items.</p>
              ) : branchStats?.expiryAlerts && branchStats.expiryAlerts.length > 0 ? (
                branchStats.expiryAlerts.map((alert) => (
                  <ActionItem
                    key={alert.id}
                    title={`Renew ${alert.document_type}`}
                    name={alert.staff ? `${alert.staff.first_name} ${alert.staff.last_name}` : 'N/A'}
                    date={alert.expiry_date ? `Expired: ${format(new Date(alert.expiry_date), 'dd MMM yyyy')}` : 'Expired'}
                    priority="High"
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p>No urgent action items found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
