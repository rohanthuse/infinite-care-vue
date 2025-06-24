
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CreditCard, Star, FileText, User, AlertCircle } from "lucide-react";
import { useClientAppointments } from "@/hooks/useClientAppointments";
import { useEnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";
import { useClientReviews } from "@/hooks/useClientReviews";
import { formatCurrency } from "@/utils/currencyFormatter";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

const ClientOverview = () => {
  // Get authenticated client ID from localStorage
  const getClientId = () => {
    const clientId = localStorage.getItem("clientId");
    return clientId || '';
  };

  const clientId = getClientId();
  const { data: appointments } = useClientAppointments(clientId);
  const { data: invoices } = useEnhancedClientBilling(clientId);
  const { data: reviews } = useClientReviews(clientId);

  // Calculate summaries
  const upcomingAppointments = appointments?.filter(app => 
    app.status === 'confirmed' || app.status === 'scheduled'
  ) || [];
  
  const pendingInvoices = invoices?.filter(inv => 
    inv.status === 'pending' || inv.status === 'sent'
  ) || [];
  
  const totalOutstanding = pendingInvoices.reduce((sum, inv) => 
    sum + (inv.total_amount || inv.amount), 0
  );

  const nextAppointment = upcomingAppointments.sort((a, b) => 
    new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  )[0];

  const recentReviews = reviews?.slice(0, 3) || [];

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
                <p className="text-sm font-medium text-gray-600">Reviews</p>
                <p className="text-2xl font-bold">{reviews?.length || 0}</p>
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

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Recent Reviews
            </CardTitle>
            <Link to="/client-dashboard/reviews">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentReviews.length > 0 ? (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="flex items-center">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {review.service_type || 'Care Service'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {review.comment ? review.comment.substring(0, 100) + (review.comment.length > 100 ? '...' : '') : 'No comment provided'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(review.created_at), 'MMM d')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Your feedback on completed services will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientOverview;
