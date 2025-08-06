
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CreditCard, Star, FileText, User, AlertCircle } from "lucide-react";
import { useClientAppointments } from "@/hooks/useClientAppointments";
import { useEnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";
import { useClientReviews } from "@/hooks/useClientReviews";
import { usePendingReviews } from "@/hooks/usePendingReviews";
import { formatCurrency } from "@/utils/currencyFormatter";
import { format, parseISO, isAfter, isSameDay } from "date-fns";
import { Link } from "react-router-dom";
import { ReviewPrompt } from "@/components/client/ReviewPrompt";
import { SubmitReviewDialog } from "@/components/client/SubmitReviewDialog";
import { useClientAuth } from "@/hooks/useClientAuth";

const ClientOverview = () => {
  // Get authenticated client ID using centralized auth
  const { clientId, isAuthenticated } = useClientAuth();

  // State for review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const { data: appointments } = useClientAppointments(clientId || undefined);
  const { data: invoices } = useEnhancedClientBilling(clientId || undefined);
  const { data: reviews } = useClientReviews(clientId || undefined);
  const { data: pendingReviews, count: pendingReviewsCount } = usePendingReviews(clientId || undefined);

  if (!isAuthenticated || !clientId) {
    return <div>Please log in to view your overview.</div>;
  }

  // Calculate summaries with proper date filtering
  const now = new Date();
  const upcomingAppointments = appointments?.filter(app => {
    const appointmentDate = parseISO(app.appointment_date);
    const isFutureOrToday = isAfter(appointmentDate, now) || isSameDay(appointmentDate, now);
    return (app.status === 'confirmed' || app.status === 'scheduled') && isFutureOrToday;
  }) || [];
  
  const pendingInvoices = invoices?.filter(inv => 
    inv.status === 'pending' || inv.status === 'sent'
  ) || [];
  
  const totalOutstanding = pendingInvoices.reduce((sum, inv) => 
    sum + (inv.total_amount || inv.amount), 0
  );

  const nextAppointment = upcomingAppointments.sort((a, b) => 
    new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  )[0];

  // Handler for opening review dialog
  const handleLeaveReview = (appointment: any) => {
    // Convert pending review format to appointment format expected by dialog
    const appointmentForDialog = {
      id: appointment.id,
      type: appointment.type,
      provider: appointment.provider,
      date: appointment.date,
      time: appointment.time,
      staff_id: appointment.staff_id || '',
      client_id: clientId
    };
    setSelectedAppointment(appointmentForDialog);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedAppointment(null);
  };

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-blue-100">Here's an overview of your care services and recent activity.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold">{pendingReviewsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Invoices</p>
                <p className="text-2xl font-bold">{invoices?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment */}
      {nextAppointment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{nextAppointment.appointment_type}</h3>
                <div className="flex items-center text-gray-600 mt-1">
                  <User className="h-4 w-4 mr-1" />
                  <span className="text-sm">{nextAppointment.provider_name}</span>
                </div>
                <div className="flex items-center text-gray-600 mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {format(parseISO(nextAppointment.appointment_date), 'MMM d, yyyy')} at {nextAppointment.appointment_time}
                  </span>
                </div>
              </div>
              <Link to="/client-dashboard/appointments">
                <Button>View All</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outstanding Payments */}
      {pendingInvoices.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <CreditCard className="h-5 w-5 mr-2" />
              Outstanding Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-800">{formatCurrency(totalOutstanding)}</p>
                <p className="text-orange-600 text-sm">
                  {pendingInvoices.length} pending {pendingInvoices.length === 1 ? 'invoice' : 'invoices'}
                </p>
              </div>
              <Link to="/client-dashboard/payments">
                <Button>Pay Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Care Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Care Plan Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Current Care Plan</div>
                  <div className="text-sm text-gray-600">Active and up to date</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last updated: {format(new Date(), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Leave Reviews
            </CardTitle>
            <Link to="/client-dashboard/reviews">
              <Button variant="outline" size="sm">View All Reviews</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingReviews && pendingReviews.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Please share your feedback on these completed appointments:
              </p>
              {pendingReviews.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{appointment.type}</div>
                      <div className="text-sm text-gray-600">{appointment.provider}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {appointment.date} at {appointment.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-gray-300" />
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      className="ml-2"
                      onClick={() => handleLeaveReview(appointment)}
                    >
                      Leave Review
                    </Button>
                  </div>
                </div>
              ))}
              {pendingReviews.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  +{pendingReviews.length - 3} more appointment{pendingReviews.length - 3 > 1 ? 's' : ''} awaiting review
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">You don't have any completed appointments that need reviews right now.</p>
              <Link to="/client-dashboard/reviews">
                <Button variant="outline" className="mt-3">View Your Reviews</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Prompt Component */}
      <ReviewPrompt completedAppointments={pendingReviews || []} />

      {/* Submit Review Dialog */}
      <SubmitReviewDialog
        open={reviewDialogOpen}
        onOpenChange={handleCloseReviewDialog}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default ClientOverview;
