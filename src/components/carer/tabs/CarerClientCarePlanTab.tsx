
import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CarePlan {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  progress: number;
  dailyTasks: Array<{
    id: string;
    time: string;
    task: string;
    completed: boolean;
    important: boolean;
  }>;
  scheduledCare: Array<{
    day: string;
    slots: Array<{
      time: string;
      duration: string;
      activity: string;
    }>;
  }>;
}

interface CarerClientCarePlanTabProps {
  clientId: string;
}

export const CarerClientCarePlanTab: React.FC<CarerClientCarePlanTabProps> = ({ clientId }) => {
  // Mock care plan - in a real app this would be fetched based on clientId
  const carePlan: CarePlan = {
    id: "CP-2023-001",
    title: "Rehabilitation Care Plan",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2024-01-01"),
    status: "Active",
    progress: 65,
    dailyTasks: [
      { id: "t1", time: "08:00", task: "Medication Administration", completed: false, important: true },
      { id: "t2", time: "09:30", task: "Personal Hygiene Assistance", completed: false, important: true },
      { id: "t3", time: "11:00", task: "Physical Therapy Exercises", completed: false, important: true },
      { id: "t4", time: "13:00", task: "Lunch and Medication", completed: false, important: true },
      { id: "t5", time: "15:00", task: "Vital Signs Monitoring", completed: false, important: false },
      { id: "t6", time: "18:00", task: "Dinner and Evening Medication", completed: false, important: true },
    ],
    scheduledCare: [
      {
        day: "Monday",
        slots: [
          { time: "09:00", duration: "1 hour", activity: "Personal Care" },
          { time: "15:00", duration: "45 mins", activity: "Mobility Exercises" }
        ]
      },
      {
        day: "Wednesday",
        slots: [
          { time: "09:00", duration: "1 hour", activity: "Personal Care" },
          { time: "14:00", duration: "30 mins", activity: "Medication Review" }
        ]
      },
      {
        day: "Friday",
        slots: [
          { time: "09:00", duration: "1 hour", activity: "Personal Care" },
          { time: "15:00", duration: "45 mins", activity: "Mobility Exercises" }
        ]
      }
    ]
  };
  
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-600";
    if (progress >= 50) return "bg-blue-600";
    return "bg-amber-500";
  };
  
  // Get today's day
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = carePlan.scheduledCare.find(s => s.day === today);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>{carePlan.title}</span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {carePlan.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Care Plan ID</p>
              <p>{carePlan.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Duration</p>
              <p>{format(carePlan.startDate, "MMM d, yyyy")} - {carePlan.endDate ? format(carePlan.endDate, "MMM d, yyyy") : "Ongoing"}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">Overall Progress</p>
              <p className="text-sm text-gray-500">{carePlan.progress}% Complete</p>
            </div>
            
            <Progress 
              value={carePlan.progress} 
              className={getProgressColor(carePlan.progress)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Today's Tasks</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <ul className="space-y-2">
            {carePlan.dailyTasks.map((task) => (
              <li key={task.id} className="flex items-center p-3 rounded-md bg-gray-50 border border-gray-100">
                <div className="flex-shrink-0 mr-3">
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center">
                    <p className="font-medium">{task.task}</p>
                    {task.important && (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                        Important
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Scheduled: {task.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Care Schedule</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {todaySchedule ? (
            <div>
              <div className="mb-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Today's Schedule ({today})
                </Badge>
              </div>
              <ul className="space-y-3">
                {todaySchedule.slots.map((slot, index) => (
                  <li key={index} className="p-3 rounded-md bg-blue-50 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{slot.activity}</p>
                        <p className="text-sm text-gray-600">Duration: {slot.duration}</p>
                      </div>
                      <div className="text-blue-700 font-medium">{slot.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="font-medium">No scheduled care for today ({today})</p>
              <p className="text-sm text-gray-500 mt-1">Check the weekly schedule for upcoming appointments</p>
            </div>
          )}
          
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Weekly Schedule</h4>
            {carePlan.scheduledCare.map((day, index) => (
              <div key={index} className={`p-3 rounded-md border ${day.day === today ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                <h5 className="font-medium mb-2">{day.day}</h5>
                <ul className="space-y-2">
                  {day.slots.map((slot, slotIndex) => (
                    <li key={slotIndex} className="flex justify-between text-sm">
                      <span>{slot.activity} ({slot.duration})</span>
                      <span className="text-gray-600">{slot.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
