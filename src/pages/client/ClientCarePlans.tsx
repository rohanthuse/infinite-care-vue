
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ClientCarePlans = () => {
  // Mock care plan data
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

  // Function to render goal status badge
  const renderGoalStatus = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>;
      case "in-progress":
        return <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">In Progress</span>;
      case "not-started":
        return <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Not Started</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Care Plan Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              {carePlan.title}
            </h2>
            <div className="text-sm text-gray-500 mt-2">
              Last updated: {carePlan.updatedAt} • Care Provider: {carePlan.provider}
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Request Changes</Button>
            <Button variant="outline">Print Plan</Button>
          </div>
        </div>
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Next review: {carePlan.reviewDate}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Goals progress:</span>
            <div className="flex-1 md:w-48">
              <Progress value={carePlan.goalsProgress} className="h-2" />
            </div>
            <span className="text-sm font-medium">{carePlan.goalsProgress}%</span>
          </div>
        </div>
      </div>

      {/* Care Plan Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Tabs defaultValue="goals">
          <div className="border-b border-gray-200">
            <div className="p-4">
              <TabsList className="grid grid-cols-3 w-full lg:w-auto">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          {/* Goals Tab */}
          <TabsContent value="goals" className="p-6">
            <div className="space-y-6">
              {carePlan.goals.map(goal => (
                <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{goal.description}</h4>
                        {renderGoalStatus(goal.status)}
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{goal.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Medications Tab */}
          <TabsContent value="medications" className="p-6">
            <div className="space-y-4">
              {carePlan.medications.map(med => (
                <div key={med.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h4 className="font-medium">{med.name}</h4>
                      <p className="text-sm text-gray-600">{med.dosage}, {med.frequency}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      Started: {med.startDate} • End: {med.endDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Activities Tab */}
          <TabsContent value="activities" className="p-6">
            <div className="space-y-4">
              {carePlan.activities.map(activity => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium">{activity.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <div className="flex items-center mt-2 gap-2">
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {activity.frequency}
                    </span>
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientCarePlans;
