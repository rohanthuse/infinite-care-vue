
import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  ClipboardList, 
  Users, 
  ArrowRight, 
  ArrowUpRight,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for upcoming appointments
const upcomingAppointments = [
  {
    id: "1",
    clientName: "Emma Thompson",
    time: "10:30 AM - 11:30 AM",
    address: "15 Oak Street, Milton Keynes",
    status: "Confirmed"
  },
  {
    id: "2",
    clientName: "James Wilson",
    time: "1:00 PM - 2:30 PM",
    address: "42 Pine Avenue, Milton Keynes",
    status: "Confirmed"
  },
  {
    id: "3",
    clientName: "Margaret Brown",
    time: "4:00 PM - 5:00 PM",
    address: "8 Cedar Lane, Milton Keynes",
    status: "Pending"
  }
];

// Mock data for recent tasks
const recentTasks = [
  {
    id: "1",
    title: "Medication reminder for Emma Thompson",
    dueDate: "Today",
    priority: "High",
    completed: false
  },
  {
    id: "2",
    title: "Update care notes for James Wilson",
    dueDate: "Today",
    priority: "Medium",
    completed: true
  },
  {
    id: "3",
    title: "Submit weekly report",
    dueDate: "Tomorrow",
    priority: "Medium",
    completed: false
  },
  {
    id: "4",
    title: "Complete training module",
    dueDate: "Friday",
    priority: "Low",
    completed: false
  }
];

const CarerOverview: React.FC = () => {
  const navigate = useNavigate();
  const carerName = localStorage.getItem("carerName") || "Carer";
  
  // Get current date and format it
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Calculate task stats
  const completedTasks = recentTasks.filter(task => task.completed).length;
  const pendingTasks = recentTasks.length - completedTasks;
  
  const handleStartVisit = (appointmentId: string) => {
    navigate(`/carer-dashboard/visit/${appointmentId}`);
  };
  
  const handleViewDetails = (appointmentId: string) => {
    // In a real app, this would navigate to appointment details
    navigate(`/carer-dashboard/appointments?id=${appointmentId}`);
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Dashboard</h1>
        <p className="text-gray-500">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            </div>
            <h3 className="mt-3 font-medium">Today's Appointments</h3>
            <p className="text-sm text-gray-500 mt-1">Scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{pendingTasks}</div>
            </div>
            <h3 className="mt-3 font-medium">Pending Tasks</h3>
            <p className="text-sm text-gray-500 mt-1">Tasks waiting completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">5</div>
            </div>
            <h3 className="mt-3 font-medium">Active Clients</h3>
            <p className="text-sm text-gray-500 mt-1">Clients under your care</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-2xl font-bold">23.5</div>
            </div>
            <h3 className="mt-3 font-medium">Hours This Week</h3>
            <p className="text-sm text-gray-500 mt-1">Recorded work hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>Your appointments for the day</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/carer-dashboard/schedule")}
                  className="text-blue-600"
                >
                  View all
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 border rounded-md hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{appointment.clientName}</h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.time}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{appointment.address}</div>
                        </div>
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                          appointment.status === "Confirmed" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {appointment.status}
                        </div>
                      </div>
                      <div className="mt-3 flex">
                        <Button 
                          size="sm" 
                          className="mr-2"
                          onClick={() => handleStartVisit(appointment.id)}
                          disabled={appointment.status !== "Confirmed"}
                        >
                          Start Visit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(appointment.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No appointments scheduled for today.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Your pending tasks</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/carer-dashboard/tasks")}
                className="text-blue-600"
              >
                View all
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center p-2 hover:bg-gray-50 rounded-md transition">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border mr-3 ${
                    task.completed 
                      ? "bg-green-100 border-green-300" 
                      : "bg-white border-gray-300"
                  }`}>
                    {task.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${task.completed ? "line-through text-gray-500" : "font-medium"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        task.priority === "High" 
                          ? "bg-red-100 text-red-700" 
                          : task.priority === "Medium" 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-green-100 text-green-700"
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">Due: {task.dueDate}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-2">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button variant="outline" size="sm" className="w-full mt-4">
              Add New Task
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarerOverview;
