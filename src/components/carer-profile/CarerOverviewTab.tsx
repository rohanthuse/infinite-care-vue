import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, BarChart3, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useCarerBookings } from "@/hooks/useCarerBookings";

interface CarerOverviewTabProps {
  carerId: string;
  branchName?: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not available';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}

export const CarerOverviewTab: React.FC<CarerOverviewTabProps> = ({ carerId, branchName }) => {
  const { data: carer } = useCarerProfileById(carerId);
  const { data: bookings = [] } = useCarerBookings(carerId);

  const totalHoursThisMonth = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.start_time);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && 
             bookingDate.getFullYear() === now.getFullYear();
    })
    .reduce((total, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

  const uniqueClients = new Set(bookings.map(b => b.client_id)).size;
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.start_time) > new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Staff Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Staff Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Staff Name:</p>
              <p className="text-base mt-1">
                {carer?.first_name} {carer?.last_name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Email Address:</p>
              <p className="text-base mt-1">{carer?.email || 'Not available'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Employee ID / Staff Code:</p>
              <p className="text-base mt-1 font-mono text-sm">{carer?.id}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone Number:</p>
              <p className="text-base mt-1">{carer?.phone || 'Not provided'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Designation / Role:</p>
              <p className="text-base mt-1">{carer?.specialization || 'Not specified'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Joining Date:</p>
              <p className="text-base mt-1">{formatDate(carer?.hire_date)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Department / Team:</p>
              <p className="text-base mt-1">{branchName || 'Not available'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Status:</p>
              <div className="mt-1">
                <Badge variant={carer?.status === 'Active' ? 'default' : 'secondary'}>
                  {carer?.status || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">{uniqueClients}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours This Month</p>
                <p className="text-2xl font-bold">{Math.round(totalHoursThisMonth)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Visits</p>
                <p className="text-2xl font-bold">{upcomingBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={carer?.status === 'Active' ? 'default' : 'secondary'}>
                  {carer?.status || 'Unknown'}
                </Badge>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{booking.client_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.start_time).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">{booking.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Profile Complete</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm">Training Due</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};