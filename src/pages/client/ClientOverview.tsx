
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CreditCard, Star, FileText, User, AlertCircle } from "lucide-react";
import { useClientAllAppointments } from "@/hooks/useClientAppointments";
import { useEnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";
import { useClientReviews } from "@/hooks/useClientReviews";
import { usePendingReviews } from "@/hooks/usePendingReviews";
import { formatCurrency } from "@/utils/currencyFormatter";
import { format, parseISO, isAfter, isSameDay } from "date-fns";
import { Link } from "react-router-dom";
import { ReviewPrompt } from "@/components/client/ReviewPrompt";
import { SubmitReviewDialog } from "@/components/client/SubmitReviewDialog";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useClientCarePlans } from "@/hooks/useClientData";
import { useClientNavigation } from "@/hooks/useClientNavigation";

const ClientOverview = () => {
  // Use the simple auth hook for better performance
  const { data: authData, isLoading: authLoading } = useSimpleClientAuth();
  const { tenantSlug } = useTenant();
  const { createClientPath } = useClientNavigation();

  // State for review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const clientId = authData?.client?.id;

  // TEMPORARY DEBUG PANEL - Remove after issue is resolved
  const debugInfo = {
    pathname: window.location.pathname,
    expectedPath: createClientPath(""),
    sessionData: {
      clientId: sessionStorage.getItem('client_id'),
      clientName: sessionStorage.getItem('client_name'),
      clientAuthConfirmed: sessionStorage.getItem('client_auth_confirmed'),
      redirectTimestamp: sessionStorage.getItem('client_redirect_timestamp')
    },
    authState: {
      isLoading: authLoading,
      hasClient: !!authData?.client,
      clientId: authData?.client?.id
    }
  };

  // Display debug info in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('[CLIENT DASHBOARD] Debug info:', debugInfo);
  }

  const { data: appointments, isLoading: appointmentsLoading } = useClientAllAppointments(clientId || undefined);
  const { data: invoices, isLoading: invoicesLoading } = useEnhancedClientBilling(clientId || undefined);
  const { data: reviews, isLoading: reviewsLoading } = useClientReviews(clientId);
  const { data: pendingReviews, count: pendingReviewsCount, isLoading: pendingReviewsLoading } = usePendingReviews(clientId);
  const { data: carePlans, isLoading: carePlansLoading } = useClientCarePlans(clientId || undefined);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authData?.isClient || !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // Calculate summaries with proper date filtering
  const now = new Date();
  const upcomingAppointments = appointments?.filter(app => {
    const appointmentDate = parseISO(app.appointment_date);
    const isFutureOrToday = isAfter(appointmentDate, now) || isSameDay(appointmentDate, now);
    return (app.status === 'assigned' || app.status === 'confirmed' || app.status === 'scheduled') && isFutureOrToday;
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
      staff_id: appointment.staff_id || null,
      client_id: clientId
    };
    setSelectedAppointment(appointmentForDialog);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedAppointment(null);
  };

  const isLoadingAnyData = appointmentsLoading || invoicesLoading || carePlansLoading;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {authData.client.first_name}!</h1>
        <p className="text-blue-100">Here's an overview of your care services and recent activity.</p>
        {isLoadingAnyData && (
          <div className="flex items-center mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            <span className="text-sm text-blue-100">Loading your data...</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-foreground">{upcomingAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold text-foreground">{pendingReviewsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Invoices</p>
                <p className="text-2xl font-bold text-foreground">{invoices?.length || 0}</p>
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
                <h3 className="font-semibold text-foreground">{nextAppointment.appointment_type}</h3>
                <div className="flex items-center text-muted-foreground mt-1">
                  <User className="h-4 w-4 mr-1" />
                  <span className="text-sm">{nextAppointment.provider_name}</span>
                </div>
                <div className="flex items-center text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {format(parseISO(nextAppointment.appointment_date), 'MMM d, yyyy')} at {nextAppointment.appointment_time}
                  </span>
                </div>
              </div>
              <Link to={tenantSlug ? `/${tenantSlug}/client-dashboard/appointments` : "/client-dashboard/appointments"}>
                <Button>View All</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outstanding Payments */}
      {pendingInvoices.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800 dark:text-orange-300">
              <CreditCard className="h-5 w-5 mr-2" />
              Outstanding Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">{formatCurrency(totalOutstanding)}</p>
                <p className="text-orange-600 dark:text-orange-400 text-sm">
                  {pendingInvoices.length} pending {pendingInvoices.length === 1 ? 'invoice' : 'invoices'}
                </p>
              </div>
              <Link to={tenantSlug ? `/${tenantSlug}/client-dashboard/payments` : "/client-dashboard/payments"}>
                <Button>Pay Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Care Plan Status - Dynamic */}
      {carePlans && carePlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Care Plan Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {carePlans.slice(0, 2).map((carePlan) => (
                <div key={carePlan.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{carePlan.title}</div>
                      <div className="text-sm text-muted-foreground">{carePlan.provider_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Started: {format(parseISO(carePlan.start_date), 'MMM d, yyyy')}
                        {carePlan.review_date && (
                          <span> • Review: {format(parseISO(carePlan.review_date), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      carePlan.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : carePlan.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {carePlan.status.charAt(0).toUpperCase() + carePlan.status.slice(1)}
                    </span>
                    <Link to={tenantSlug ? `/${tenantSlug}/client-dashboard/care-plans` : "/client-dashboard/care-plans"}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {carePlans.length > 2 && (
                <div className="text-center">
                  <Link to={tenantSlug ? `/${tenantSlug}/client-dashboard/care-plans` : "/client-dashboard/care-plans"}>
                    <Button variant="outline" size="sm">
                      View All Care Plans ({carePlans.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Leave Reviews
            </CardTitle>
            <Link to={tenantSlug ? `/${tenantSlug}/client-dashboard/reviews` : "/client-dashboard/reviews"}>
              <Button variant="outline" size="sm">View All Reviews</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingReviewsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading pending reviews...</p>
            </div>
          ) : pendingReviews && pendingReviews.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Please share your feedback on these completed appointments:
              </p>
              {pendingReviews.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{appointment.type}</div>
                      <div className="text-sm text-muted-foreground">{appointment.provider}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {appointment.date} at {appointment.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
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
                <p className="text-sm text-muted-foreground text-center">
                  +{pendingReviews.length - 3} more appointment{pendingReviews.length - 3 > 1 ? 's' : ''} awaiting review
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
              <p className="text-muted-foreground">You don't have any completed appointments that need reviews right now.</p>
              <Link to={tenantSlug ? `/${tenantSlug}/client-dashboard/reviews` : "/client-dashboard/reviews"}>
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
