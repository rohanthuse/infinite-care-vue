
import React from "react";
import { CarerHeader } from "@/components/carer/CarerHeader";
import { CarerSidebar } from "@/components/carer/CarerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, Users, AlertCircle, Briefcase, Calendar as CalendarIcon, User } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { AttendanceStatusWidget } from "@/components/attendance/AttendanceStatusWidget";
import { useCarerDashboard } from "@/hooks/useCarerDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const CarerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    todayAppointments,
    upcomingAppointments,
    tasks,
    clientCount,
    weeklyHours,
    isLoading,
    user,
    carerBranch,
  } = useCarerDashboard();

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'scheduled':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CarerHeader />
        <div className="flex">
          <CarerSidebar />
          <main className="flex-1 p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CarerHeader />
      <div className="flex">
        <CarerSidebar />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {carerBranch?.first_name || 'Carer'}
                </h1>
                <p className="text-gray-600">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {todayAppointments.length === 1 ? 'appointment' : 'appointments'} scheduled
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {tasks.length === 1 ? 'task' : 'tasks'} to complete
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weeklyHours}h</div>
                  <p className="text-xs text-muted-foreground">this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clientCount}</div>
                  <p className="text-xs text-muted-foreground">in your branch</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Attendance Widget */}
              <div className="lg:col-span-1">
                {user && carerBranch ? (
                  <AttendanceStatusWidget
                    personId={user.id}
                    personType="staff"
                    branchId={carerBranch.branch_id}
                    personName={`${carerBranch.first_name} ${carerBranch.last_name}`}
                    showActions={true}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500">Loading attendance data...</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Upcoming Appointments */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Upcoming Appointments
                  </CardTitle>
                  <CardDescription>Your next appointments this week</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-sm">
                              <div className="font-medium">{appointment.time}</div>
                              <div className="text-gray-500">{appointment.date}</div>
                            </div>
                            <div>
                              <div className="font-medium">{appointment.client}</div>
                              <div className="text-sm text-gray-500">{appointment.service}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {appointment.isToday && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">Today</Badge>
                            )}
                            {appointment.isTomorrow && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">Tomorrow</Badge>
                            )}
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/carer-dashboard/appointments')}
                      >
                        View All Appointments
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No upcoming appointments</p>
                      <p className="text-sm text-gray-400">Your appointments will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tasks Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Tasks
                </CardTitle>
                <CardDescription>Tasks assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 border mt-1 ${
                            task.priority === 'high' || task.priority === 'urgent'
                              ? "border-red-300 bg-red-50" 
                              : task.priority === 'medium'
                              ? "border-yellow-300 bg-yellow-50" 
                              : "border-green-300 bg-green-50"
                          }`}>
                            {(task.priority === 'high' || task.priority === 'urgent') && (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-4">
                              {task.client && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {task.client}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due {task.dueDate}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {task.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/carer-dashboard/tasks')}
                    >
                      View All Tasks
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No pending tasks</p>
                    <p className="text-sm text-gray-400">Your tasks will appear here when assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CarerDashboard;
