
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCarePlanDetailDialog } from "@/components/client/ClientCarePlanDetailDialog";
import { RescheduleAppointmentDialog } from "@/components/client/RescheduleAppointmentDialog";
import { useClient } from "@/contexts/ClientContext";
import { useClientAppointments } from "@/hooks/useClientAppointments";
import { useClientCarePlans } from "@/hooks/useClientCarePlans";
import { useClientBilling } from "@/hooks/useClientBilling";

const ClientOverview = () => {
  const [carePlanDialogOpen, setCarePlanDialogOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  const { client } = useClient();
  const { upcomingAppointments, loading: appointmentsLoading } = useClientAppointments();
  const { carePlans, loading: carePlansLoading } = useClientCarePlans();
  const { invoices, loading: billingLoading } = useClientBilling();

  // Calculate stats from real data
  const upcomingCount = upcomingAppointments.length;
  const activeCarePlansCount = carePlans.filter(plan => plan.status === 'active').length;
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending');
  const totalDue = pendingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const nextReviewDate = carePlans
    .filter(plan => plan.review_date)
    .sort((a, b) => new Date(a.review_date!).getTime() - new Date(b.review_date!).getTime())[0]?.review_date;

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment({
      id: appointment.id,
      type: appointment.appointment_type,
      provider: appointment.provider_name,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      location: appointment.location,
      status: appointment.status
    });
    setIsRescheduling(true);
  };

  if (appointmentsLoading || carePlansLoading || billingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold">
          Welcome back, {client?.preferred_name || client?.first_name}
        </h2>
        <p className="mt-2 text-blue-100">
          Welcome to your personal health dashboard. Here's a summary of your care plan and upcoming appointments.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{upcomingCount}</div>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            {upcomingAppointments[0] && (
              <p className="text-xs text-gray-500 mt-2">
                Next: {upcomingAppointments[0].appointment_type}, {upcomingAppointments[0].appointment_date}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Care Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{activeCarePlansCount}</div>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            {carePlans[0] && (
              <p className="text-xs text-gray-500 mt-2">
                Updated: {new Date(carePlans[0].created_at).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">£{totalDue.toFixed(2)}</div>
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            {pendingInvoices[0] && (
              <p className="text-xs text-gray-500 mt-2">
                Due: {pendingInvoices[0].due_date}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Next Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {nextReviewDate ? 
                  Math.max(0, Math.ceil((new Date(nextReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
                  : '-'
                } Days
              </div>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            {nextReviewDate && (
              <p className="text-xs text-gray-500 mt-2">
                Care Plan Review: {nextReviewDate}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold">Upcoming Appointments</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {upcomingAppointments.slice(0, 3).map((appointment) => (
            <div key={appointment.id} className="p-6 flex justify-between items-center">
              <div>
                <p className="font-medium">{appointment.appointment_type}</p>
                <p className="text-sm text-gray-500">{appointment.provider_name}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{appointment.appointment_date} • {appointment.appointment_time}</span>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleReschedule(appointment)}
              >
                Reschedule
              </Button>
            </div>
          ))}
          {upcomingAppointments.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No upcoming appointments scheduled.
            </div>
          )}
        </div>
      </div>
      
      {/* Care Plan Summary */}
      {carePlans[0] && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold">Care Plan Summary</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCarePlanDialogOpen(true)}
            >
              View Full Plan
            </Button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Current Goals</h4>
                <ul className="mt-2 space-y-2">
                  {carePlans[0].goals?.slice(0, 3).map((goal, index) => (
                    <li key={goal.id} className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">
                        {index + 1}
                      </div>
                      <span>{goal.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Next Steps</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Your next care plan review is scheduled for {carePlans[0].review_date}. 
                  Please complete your weekly self-assessment forms before this date.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {carePlans[0] && (
        <ClientCarePlanDetailDialog
          open={carePlanDialogOpen}
          onOpenChange={setCarePlanDialogOpen}
          carePlan={carePlans[0]}
        />
      )}

      {selectedAppointment && (
        <RescheduleAppointmentDialog
          open={isRescheduling}
          onOpenChange={setIsRescheduling}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
};

export default ClientOverview;
