
import React, { useState } from "react";
import { 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus, 
  Search, 
  AlertCircle,
  ArrowDownUp,
  User,
  Calendar
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock task data
const mockTasks = [
  {
    id: "1",
    title: "Medication reminder for Emma Thompson",
    description: "Remind to take morning medication and record in log",
    dueDate: "Today, 10:30 AM",
    priority: "High",
    completed: false,
    client: "Emma Thompson",
    category: "Medication"
  },
  {
    id: "2",
    title: "Update care notes for James Wilson",
    description: "Complete daily care notes including mobility assessment",
    dueDate: "Today, 2:30 PM",
    priority: "Medium",
    completed: false,
    client: "James Wilson",
    category: "Documentation"
  },
  {
    id: "3",
    title: "Submit weekly report",
    description: "Complete and submit your weekly activity report",
    dueDate: "Tomorrow, 5:00 PM",
    priority: "Medium",
    completed: false,
    client: null,
    category: "Admin"
  },
  {
    id: "4",
    title: "Complete training module",
    description: "Finish the medication administration refresher course",
    dueDate: "Friday, 12:00 PM",
    priority: "Low",
    completed: false,
    client: null,
    category: "Training"
  },
  {
    id: "5",
    title: "Check vital signs for Margaret Brown",
    description: "Record blood pressure, temperature and heart rate",
    dueDate: "Today, 4:30 PM",
    priority: "High",
    completed: false,
    client: "Margaret Brown",
    category: "Health Check"
  },
  {
    id: "6",
    title: "Grocery shopping for Robert Johnson",
    description: "Purchase items from the shopping list provided",
    dueDate: "Tomorrow, 11:00 AM",
    priority: "Medium",
    completed: false,
    client: "Robert Johnson",
    category: "Errands"
  },
  {
    id: "7",
    title: "Review medication chart",
    description: "Check and update medication administration records",
    dueDate: "Yesterday, 3:00 PM",
    priority: "High",
    completed: true,
    client: "Emma Thompson",
    category: "Medication"
  },
  {
    id: "8",
    title: "Submit expense report",
    description: "Submit travel and expense claims for last week",
    dueDate: "Yesterday, 5:00 PM",
    priority: "Low",
    completed: true,
    client: null,
    category: "Admin"
  }
];

const CarerTasks: React.FC = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  const pendingTasks = mockTasks.filter(task => !task.completed && 
    (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
     task.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  const completedTasks = mockTasks.filter(task => task.completed && 
    (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
     task.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const priorityCounts = {
    high: pendingTasks.filter(task => task.priority === "High").length,
    medium: pendingTasks.filter(task => task.priority === "Medium").length,
    low: pendingTasks.filter(task => task.priority === "Low").length
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">My Tasks</CardTitle>
              <CardDescription className="text-gray-500">
                Manage and track your daily tasks and assignments
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Summary cards */}
        <Card className="bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingTasks.length}</div>
            <p className="text-sm text-gray-500">Tasks require your attention</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm">High Priority</span>
                </div>
                <Badge variant="secondary">{priorityCounts.high}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-sm">Medium Priority</span>
                </div>
                <Badge variant="secondary">{priorityCounts.medium}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">Low Priority</span>
                </div>
                <Badge variant="secondary">{priorityCounts.low}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            </div>
            
            <div className="space-y-3">
              {pendingTasks
                .filter(task => task.dueDate.includes('Today'))
                .slice(0, 3)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <div className={`w-1.5 h-12 rounded-full ${
                      task.priority === 'High' ? 'bg-red-500' : 
                      task.priority === 'Medium' ? 'bg-amber-500' : 
                      'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.dueDate}</div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{task.description}</p>
                    </div>
                  </div>
                ))}
              
              {pendingTasks.filter(task => task.dueDate.includes('Today')).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No tasks scheduled for today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All Tasks</DropdownMenuItem>
              <DropdownMenuItem>High Priority</DropdownMenuItem>
              <DropdownMenuItem>Medium Priority</DropdownMenuItem>
              <DropdownMenuItem>Low Priority</DropdownMenuItem>
              <DropdownMenuItem>Admin Tasks</DropdownMenuItem>
              <DropdownMenuItem>Client Tasks</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none gap-2">
                <ArrowDownUp className="h-4 w-4" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Due Date (Newest)</DropdownMenuItem>
              <DropdownMenuItem>Due Date (Oldest)</DropdownMenuItem>
              <DropdownMenuItem>Priority (High-Low)</DropdownMenuItem>
              <DropdownMenuItem>Priority (Low-High)</DropdownMenuItem>
              <DropdownMenuItem>Alphabetical (A-Z)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button className="flex-1 md:flex-none gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="pending" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                Pending ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                Completed ({completedTasks.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="p-4 space-y-4">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-sm transition-shadow border-l-4 border-l-solid overflow-hidden" style={{
                    borderLeftColor: task.priority === "High" 
                      ? "rgb(240, 82, 82)" 
                      : task.priority === "Medium" 
                      ? "rgb(245, 158, 11)" 
                      : "rgb(34, 197, 94)"
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-1 ${
                          task.priority === "High" 
                            ? "bg-red-100 border border-red-200" 
                            : task.priority === "Medium" 
                            ? "bg-amber-100 border border-amber-200" 
                            : "bg-green-100 border border-green-200"
                        }`}>
                          {task.priority === "High" && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{task.title}</h3>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.priority === "High" 
                                ? "bg-red-100 text-red-700" 
                                : task.priority === "Medium" 
                                ? "bg-amber-100 text-amber-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {task.priority}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {task.dueDate}
                            </div>
                            
                            {task.client && (
                              <div className="flex items-center text-xs text-gray-500">
                                <User className="h-3.5 w-3.5 mr-1" />
                                {task.client}
                              </div>
                            )}
                            
                            <div className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                              {task.category}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <Button size="sm">Complete</Button>
                            <Button size="sm" variant="outline">Edit</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-12 text-center bg-gray-50 border border-gray-100 rounded-lg">
                  <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No pending tasks found</p>
                  <p className="text-gray-400 text-sm">All caught up! Create a new task to get started.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="p-4 space-y-4">
              {completedTasks.length > 0 ? (
                completedTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-sm transition-shadow bg-gray-50 opacity-80 border-l-4 border-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 mt-1 bg-green-100">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium line-through text-gray-500">{task.title}</h3>
                            <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Completed
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {task.dueDate}
                            </div>
                            
                            {task.client && (
                              <div className="flex items-center text-xs text-gray-500">
                                <User className="h-3.5 w-3.5 mr-1" />
                                {task.client}
                              </div>
                            )}
                            
                            <div className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                              {task.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-12 text-center bg-gray-50 border border-gray-100 rounded-lg">
                  <p className="text-gray-500">No completed tasks found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerTasks;
