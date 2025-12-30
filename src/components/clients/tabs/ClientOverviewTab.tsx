import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { formatCurrency } from "@/utils/currencyFormatter";
import { useClientRateAssignments } from "@/hooks/useClientRateAssignments";
import { useClientReviews } from "@/hooks/useClientReviews";
import { useMedicationsByClient } from "@/hooks/useMedications";
import { useClientEvents } from "@/hooks/useClientEvents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Mail, Phone, Smartphone, Star, Activity, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { SuspensionAlertBanner } from "../SuspensionAlertBanner";

interface ClientOverviewTabProps {
  client: any;
  branchId: string;
}

export const ClientOverviewTab: React.FC<ClientOverviewTabProps> = ({ client, branchId }) => {
  const { data: clientRateAssignments, isLoading: isLoadingRates } = useClientRateAssignments(client.id);
  const { data: reviews = [] } = useClientReviews(client.id);
  const { data: medications = [] } = useMedicationsByClient(client.id);
  const { data: clientEvents = [] } = useClientEvents(client.id);

  // Fetch recent bookings for activity timeline
  const { data: recentBookings = [] } = useQuery({
    queryKey: ['client-recent-bookings', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          services(title),
          staff(first_name, last_name)
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!client.id,
  });

  const registeredDate = client.registered_on || client.registeredOn;
  const lengthOfRegistration = registeredDate 
    ? formatDistance(new Date(registeredDate), new Date(), { addSuffix: false })
    : 'N/A';

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, text: "Active" },
      inactive: { variant: "secondary" as const, text: "Inactive" },
      expired: { variant: "destructive" as const, text: "Expired" },
    };
    
    const config = statusConfig[status?.toLowerCase() as keyof typeof statusConfig] || 
                   { variant: "secondary" as const, text: status || "Unknown" };
    
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const activeMedications = medications.filter(med => med.status === 'active').length;
  const recentEvents = clientEvents.filter(event => {
    const eventDate = new Date(event.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return eventDate > weekAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Joined On</p>
                <p className="text-lg font-bold">{formatDate(registeredDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Avg Rating</p>
                <p className="text-lg font-bold">{averageRating.toFixed(1)} / 5</p>
                <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active Meds</p>
                <p className="text-lg font-bold">{activeMedications}</p>
                <p className="text-xs text-muted-foreground">medications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Recent Events</p>
                <p className="text-lg font-bold">{recentEvents}</p>
                <p className="text-xs text-muted-foreground">last 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{client.location || client.address || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground truncate">{client.email || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Mobile</p>
                <p className="text-sm text-muted-foreground">{client.mobile || client.phone || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Telephone</p>
                <p className="text-sm text-muted-foreground">{client.telephone || client.landline || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center space-x-3 border-l-2 border-primary pl-4 pb-2">
                  <div className="w-2 h-2 bg-primary rounded-full -ml-5"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{booking.services?.title || 'Service'}</span>
                      <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.staff?.first_name} {booking.staff?.last_name} • 
                      {format(new Date(booking.start_time), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Length of Registration:</span>
              <span>{lengthOfRegistration}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Reviews:</span>
              <span>{reviews.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span>{getStatusBadge(client.status)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Rates Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRates ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : clientRateAssignments && clientRateAssignments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {clientRateAssignments.length} service rate{clientRateAssignments.length !== 1 ? 's' : ''} assigned
                </p>
                <div className="space-y-1">
                  {clientRateAssignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex justify-between text-sm">
                      <span>{assignment.service_rate?.service_name || 'Unknown Service'}</span>
                      <span className="font-medium">{formatCurrency(assignment.service_rate?.amount || 0)}</span>
                    </div>
                  ))}
                  {clientRateAssignments.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{clientRateAssignments.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No service rates assigned to this client</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Rates Table */}
      {clientRateAssignments && clientRateAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Service Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientRateAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.service_rate?.service_name || 'Unknown'}</TableCell>
                    <TableCell>{assignment.service_rate?.rate_type || '-'}</TableCell>
                    <TableCell>{formatCurrency(assignment.service_rate?.amount || 0)}</TableCell>
                    <TableCell>{formatDate(assignment.start_date)}</TableCell>
                    <TableCell>{assignment.end_date ? formatDate(assignment.end_date) : 'Ongoing'}</TableCell>
                    <TableCell>{getStatusBadge(assignment.is_active ? 'active' : 'inactive')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};