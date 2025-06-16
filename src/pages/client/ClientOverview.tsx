
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCarePlanDetailDialog } from "@/components/client/ClientCarePlanDetailDialog";
import { RescheduleAppointmentDialog } from "@/components/client/RescheduleAppointmentDialog";

const ClientOverview = () => {
  const [carePlanDialogOpen, setCarePlanDialogOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  // Mock care plan data (this would be fetched from an API in a real application)
  const carePlan = {
    id: 1,
    title: "Rehabilitation Care Plan",
    createdAt: "March 15, 2025",
    updatedAt: "April 25, 2025",
    reviewDate: "May 25, 2025",
    provider: "Dr. Emily Smith",
    goalsProgress: 65,
    goals: [
      {
        id: 1,
        description: "Improve mobility in left leg",
        status: "in-progress",
        progress: 70,
        notes: "Making good progress with physical therapy exercises"
      },
      {
        id: 2,
        description: "Complete daily exercises",
        status: "in-progress",
        progress: 85,
        notes: "Consistent with morning exercises, sometimes missing evening routine"
      },
      {
        id: 3,
        description: "Maintain healthy diet",
        status: "in-progress",
        progress: 60,
        notes: "Following meal plan with occasional deviations"
      },
      {
        id: 4,
        description: "Reduce pain medication",
        status: "not-started",
        progress: 0,
        notes: "Will begin after consultation with pain specialist"
      }
    ],
    medications: [
      {
        id: 1,
        name: "Ibuprofen",
        dosage: "400mg",
        frequency: "Twice daily",
        startDate: "March 20, 2025",
        endDate: "Ongoing"
      },
      {
        id: 2,
        name: "Vitamin D",
        dosage: "2000 IU",
        frequency: "Once daily",
        startDate: "March 15, 2025",
        endDate: "Ongoing"
      }
    ],
    activities: [
      {
        id: 1,
        name: "Morning Stretches",
        description: "15 minutes of stretching focusing on lower body",
        frequency: "Daily",
        status: "active"
      },
      {
        id: 2,
        name: "Walking",
        description: "30 minutes of walking with support",
        frequency: "3 times per week",
        status: "active"
      },
      {
        id: 3,
        name: "Resistance Training",
        description: "Light resistance exercises for upper body strength",
        frequency: "2 times per week",
        status: "active"
      }
    ]
  };

  // Handle reschedule button click
  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsRescheduling(true);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold">Welcome back, {localStorage.getItem("clientName")}</h2>
        <p className="mt-2 text-blue-100">Welcome to your personal health dashboard. Here's a summary of your care plan and upcoming appointments.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">2</div>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Next: Therapy Session, May 3</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Care Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">1</div>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Updated: 2 days ago</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">$150.00</div>
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Due: May 15, 2025</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Next Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">21 Days</div>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Care Plan Review: May 25</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold">Upcoming Appointments</h3>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="p-6 flex justify-between items-center">
            <div>
              <p className="font-medium">Therapy Session</p>
              <p className="text-sm text-gray-500">Dr. Smith, Physical Therapist</p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                <span>May 3, 2025 • 10:00 AM</span>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleReschedule({
                id: 1,
                type: "Therapy Session",
                provider: "Dr. Smith, Physical Therapist",
                date: "May 3, 2025",
                time: "10:00 AM",
                location: "Main Clinic, Room 204",
                status: "confirmed"
              })}
            >
              Reschedule
            </Button>
          </div>
          
          <div className="p-6 flex justify-between items-center">
            <div>
              <p className="font-medium">Weekly Check-in</p>
              <p className="text-sm text-gray-500">Nurse Johnson</p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                <span>May 10, 2025 • 2:00 PM</span>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => handleReschedule({
                id: 2,
                type: "Weekly Check-in",
                provider: "Nurse Johnson",
                date: "May 10, 2025",
                time: "2:00 PM",
                location: "Video Call",
                status: "confirmed"
              })}
            >
              Reschedule
            </Button>
          </div>
        </div>
      </div>
      
      {/* Care Plan Summary */}
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
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">
                    1
                  </div>
                  <span>Improve mobility in left leg</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">
                    2
                  </div>
                  <span>Complete daily exercises</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">
                    3
                  </div>
                  <span>Maintain healthy diet</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Next Steps</h4>
              <p className="mt-1 text-sm text-gray-600">
                Your next care plan review is scheduled for May 25. Please complete your weekly self-assessment forms before this date.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Care Plan Detail Dialog */}
      <ClientCarePlanDetailDialog
        open={carePlanDialogOpen}
        onOpenChange={setCarePlanDialogOpen}
        carePlan={carePlan}
      />

      {/* Reschedule Appointment Dialog */}
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
