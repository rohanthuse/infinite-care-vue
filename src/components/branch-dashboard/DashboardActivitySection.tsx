import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import { BookingItem } from "@/components/dashboard/BookingItem";
import { ReviewItem, ReviewItemSkeleton } from "@/components/dashboard/ReviewItem";
import { ActionItem } from "@/components/dashboard/ActionItem";
import { useBranchStatistics } from "@/data/hooks/useBranchStatistics";
import { useBookingNavigation } from "@/hooks/useBookingNavigation";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";
import { format, formatDistanceToNow } from "date-fns";

interface DashboardActivitySectionProps {
  branchId: string | undefined;
}

export const DashboardActivitySection: React.FC<DashboardActivitySectionProps> = ({ branchId }) => {
  const { data: branchStats, isLoading: isLoadingBranchStats, error: branchStatsError } = useBranchStatistics(branchId);
  const { navigateToBookings } = useBookingNavigation();
  const { branchName } = useBranchDashboardNavigation();

  const handleBookingClick = (clientId?: string) => {
    if (branchId && branchName) {
      navigateToBookings({
        branchId,
        branchName,
        date: new Date(), // Today's date
        clientId: clientId || undefined,
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold">Today's Bookings</CardTitle>
                <CardDescription>Appointments for today</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
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
                  <div key={i} className="py-2 border-b last:border-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))
              ) : branchStatsError ? (
                <p className="text-red-500 text-center py-4">Error loading bookings.</p>
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

                  return (
                    <BookingItem
                      key={booking.id}
                      number={`${index + 1}`}
                      staff={`${booking.staff?.first_name || 'N/A'} ${booking.staff?.last_name || ''}`}
                      client={`${booking.client?.first_name || 'N/A'} ${booking.client?.last_name || ''}`}
                      time={`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
                      status={status}
                      onClick={() => handleBookingClick(booking.client_id)}
                    />
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No bookings for today.</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg font-semibold">Recent Reviews</CardTitle>
            <CardDescription>Latest client feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {isLoadingBranchStats ? (
                Array.from({ length: 3 }).map((_, i) => <ReviewItemSkeleton key={i} />)
              ) : branchStatsError ? (
                <p className="text-red-500 text-center py-4">Error loading reviews.</p>
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
                <p className="text-gray-500 text-center py-4">No reviews yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold">Action Items</CardTitle>
                <CardDescription>Tasks requiring attention</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                View All Tasks
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <ActionItem
                title="Follow up with client"
                name="Wendy Smith"
                date="Today"
                priority="High"
              />
              <ActionItem
                title="Review care plan"
                name="John Michael"
                date="Tomorrow"
                priority="Medium"
              />
              <ActionItem
                title="Schedule assessment"
                name="Lisa Rodrigues"
                date="May 15"
                priority="Low"
              />
              <ActionItem
                title="Update medical records"
                name="Kate Williams"
                date="May 16"
                priority="Medium"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold">Expiry Alerts</CardTitle>
                <CardDescription>Staff documents requiring attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoadingBranchStats ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : branchStatsError ? (
                <p className="text-red-500 text-center py-4 col-span-full">Error loading action items.</p>
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
                <div className="col-span-full text-center py-8 text-gray-500">
                  <ClipboardCheck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
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
