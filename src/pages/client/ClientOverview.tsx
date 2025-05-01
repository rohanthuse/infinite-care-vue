
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const ClientOverview = () => {
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
            <Button size="sm">Reschedule</Button>
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
            <Button size="sm">Reschedule</Button>
          </div>
        </div>
      </div>
      
      {/* Care Plan Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold">Care Plan Summary</h3>
          <Button variant="outline" size="sm">View Full Plan</Button>
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
    </div>
  );
};

export default ClientOverview;
