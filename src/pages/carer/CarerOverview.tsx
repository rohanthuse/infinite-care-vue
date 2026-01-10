import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, Users, AlertCircle, Briefcase, Calendar as CalendarIcon, User } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { AttendanceStatusWidget } from "@/components/attendance/AttendanceStatusWidget";
import { useCarerDashboard } from "@/hooks/useCarerDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useUnifiedCarerAuth } from "@/hooks/useUnifiedCarerAuth";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { CarePlanStatusWidget } from "@/components/carer/CarePlanStatusWidget";
import { ActiveVisitBanner } from "@/components/carer/ActiveVisitBanner";
import { ActiveVisitsSection } from "@/components/carer/ActiveVisitsSection";
import { ReadyToStartSection } from "@/components/carer/ReadyToStartSection";
import { ServiceReportsDashboardWidget } from "@/components/carer/ServiceReportsDashboardWidget";
import { ImprovementAreasCard } from "@/components/carer/ImprovementAreasCard";
import { useCarerPagePrefetch } from "@/hooks/useCarerPagePrefetch";

const CarerOverview: React.FC = () => {
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();
  const { user, isAuthenticated } = useUnifiedCarerAuth();
  
  // Prefetch data for common pages
  useCarerPagePrefetch();
  const {
    todayAppointments,
    readyToStartAppointments,
    upcomingAppointments,
    tasks,
    clientCount,
    weeklyHours,
    improvementAreas,
    improvementAreasError,
    isLoading,
    carerContext,
  } = useCarerDashboard();

  const carerProfile = carerContext?.staffProfile;

  // Debug logging for improvement areas
  console.log('[CarerOverview] Improvement areas count:', improvementAreas?.length || 0);
  console.log('[CarerOverview] Improvement areas error:', improvementAreasError);
  console.log('[CarerOverview] Improvement areas data:', improvementAreas);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'in-progress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'assigned':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'scheduled':
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'cancelled':
      case 'missed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Welcome back, {carerProfile?.first_name || 'Carer'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Active Visit Banner */}
      <ActiveVisitBanner />

      {/* Ready to Start Section */}
      <ReadyToStartSection appointments={readyToStartAppointments} isLoading={isLoading} />

      {/* Stats Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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

      <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Active Visits */}
        <div className="lg:col-span-1">
          <ActiveVisitsSection />
        </div>

        {/* Improvement Areas Card */}
        <div className="lg:col-span-1">
          {improvementAreasError ? (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Error Loading Improvement Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Unable to load improvement areas. Please refresh the page or contact support if the issue persists.
                </p>
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Technical Details</summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                    {JSON.stringify(improvementAreasError, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ) : improvementAreas && improvementAreas.length > 0 ? (
            <ImprovementAreasCard improvementAreas={improvementAreas} />
          ) : (
            !isLoading && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    No Improvement Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-sm text-muted-foreground">
                  Great work! You don't have any improvement areas at the moment. Keep up the excellent performance!
                </p>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Service Reports Widget */}
        <div className="lg:col-span-1">
          <ServiceReportsDashboardWidget />
        </div>

        {/* Attendance Widget */}
        <div className="lg:col-span-1">
          {user && carerProfile ? (
            <AttendanceStatusWidget
              personId={user.id}
              personType="staff"
              branchId={carerProfile.branch_id}
              personName={`${carerProfile.first_name} ${carerProfile.last_name}`}
              showActions={true}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Loading attendance data...</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Care Plan Status Widget */}
        <div className="lg:col-span-1">
          <CarePlanStatusWidget />
        </div>

        {/* Upcoming Appointments */}
        <Card className="lg:col-span-1">
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
                  <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 border border-border rounded-lg bg-card overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="text-sm flex-shrink-0 w-14 sm:w-16">
                        <div className="font-medium text-foreground">{appointment.time}</div>
                        <div className="text-muted-foreground">{appointment.date}</div>
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="font-medium text-foreground truncate" title={appointment.client}>
                          {appointment.client}
                        </div>
                        <div className="text-sm text-muted-foreground truncate" title={appointment.service}>
                          {appointment.service}
                        </div>
                        {(appointment.address || appointment.postcode) && (
                          <div className="text-xs text-muted-foreground truncate mt-1" title={`${appointment.address || ''} ${appointment.postcode ? `(${appointment.postcode})` : ''}`}>
                            {appointment.postcode ? (
                              <span className="font-medium">{appointment.postcode}</span>
                            ) : null}
                            {appointment.address && appointment.postcode && ' • '}
                            {appointment.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      {appointment.isToday && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">Today</Badge>
                      )}
                      {appointment.isTomorrow && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">Tomorrow</Badge>
                      )}
                      <Badge variant="custom" className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(createCarerPath('/appointments'))}
                >
                  View All Appointments
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <p className="text-sm text-muted-foreground">Your appointments will appear here</p>
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
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3 border rounded-lg">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
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
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 sm:gap-4">
                        {task.client && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{task.client}</span>
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            Due {task.dueDate}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {task.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge variant="custom" className={`${getPriorityColor(task.priority)} flex-shrink-0`}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(createCarerPath('/tasks'))}
              >
                View All Tasks
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No pending tasks</p>
              <p className="text-sm text-muted-foreground">Your tasks will appear here when assigned</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerOverview;
