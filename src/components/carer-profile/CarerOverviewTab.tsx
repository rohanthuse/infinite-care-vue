import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, BarChart3, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useCarerBookings } from "@/hooks/useCarerBookings";

interface CarerOverviewTabProps {
  carerId: string;
}

export const CarerOverviewTab: React.FC<CarerOverviewTabProps> = ({ carerId }) => {
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