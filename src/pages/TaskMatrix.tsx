
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import { 
  CheckSquare, Search, Filter, Download, Plus, 
  FileUp, Calendar, ClipboardList 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Sample data for the task matrix
const taskRecords = [
  {
    id: "T001",
    name: "Client Assessment",
    assignedTo: "Warren, Susan",
    priority: "High",
    dueDate: "28/02/2025",
    status: "Completed"
  },
  {
    id: "T002",
    name: "Medication Review",
    assignedTo: "Charuma, Charmaine",
    priority: "Medium",
    dueDate: "05/03/2025",
    status: "In Progress"
  },
  {
    id: "T003",
    name: "Care Plan Update",
    assignedTo: "Ayo-Famure, Opeyemi",
    priority: "High",
    dueDate: "10/03/2025",
    status: "Pending"
  },
  {
    id: "T004",
    name: "Staff Training",
    assignedTo: "Warren, Susan",
    priority: "Low",
    dueDate: "15/03/2025",
    status: "In Progress"
  },
  {
    id: "T005",
    name: "Equipment Check",
    assignedTo: "Charuma, Charmaine",
    priority: "Medium",
    dueDate: "12/03/2025",
    status: "Pending"
  },
  {
    id: "T006",
    name: "Client Feedback Collection",
    assignedTo: "Ayo-Famure, Opeyemi",
    priority: "Low",
    dueDate: "20/03/2025",
    status: "Completed"
  }
];

const TaskMatrix = () => {
  const location = useLocation();
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Set activeTab to "task-matrix" instead of "workflow"
  const activeTab = "task-matrix";

  const handleChangeTab = (value: string) => {
    if (id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else if (value === "workflow") {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      } else if (value === "task-matrix" || value === "training-matrix" || value === "form-matrix") {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      if (value === "workflow") {
        navigate(`/workflow`);
      } else if (value === "task-matrix" || value === "training-matrix" || value === "form-matrix") {
        navigate(`/workflow/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  const filteredTasks = taskRecords.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddTask = () => {
    toast.info("Add Task functionality will be implemented soon", {
      description: "This feature is coming in a future update",
      position: "top-center",
    });
  };

  const handleExport = () => {
    toast.info("Export functionality will be implemented soon", {
      description: "This feature is coming in a future update",
      position: "top-center",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {id && branchName && (
          <BranchHeader 
            id={id} 
            branchName={branchName} 
            onNewBooking={() => {}}
          />
        )}
        
        <TabNavigation 
          activeTab={activeTab} 
          onChange={handleChangeTab}
          hideQuickAdd={true}
        />
        
        <div className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Task Matrix</h1>
              <p className="text-gray-500 mt-1">Track task completion and compliance status</p>
            </div>
            <div className="flex gap-3 items-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-700 border-gray-200"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleAddTask}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-1/3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Task Tracking</CardTitle>
                  <CardDescription>Monitor task assignments and completion</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CheckSquare className="h-4 w-4 mr-2 text-gray-400" />
                              {task.name}
                            </div>
                          </TableCell>
                          <TableCell>{task.assignedTo}</TableCell>
                          <TableCell>
                            <Badge className={`
                              ${task.priority === "High" ? "bg-red-100 text-red-800" : 
                                task.priority === "Medium" ? "bg-amber-100 text-amber-800" : 
                                "bg-blue-100 text-blue-800"}
                            `}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.dueDate}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              task.status === "Completed" ? "bg-green-100 text-green-800" :
                              task.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {task.status}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No tasks found matching your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Task Status Overview</h3>
                  <Badge className="bg-green-100 text-green-800">67% Complete</Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Completed</span>
                      <span className="text-gray-800 font-medium">2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "33%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">In Progress</span>
                      <span className="text-gray-800 font-medium">2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "33%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Pending</span>
                      <span className="text-gray-800 font-medium">2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "33%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Tasks Due Soon</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Medication Review</p>
                      <p className="text-sm text-gray-500">Charuma, Charmaine</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">5 days</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Equipment Check</p>
                      <p className="text-sm text-gray-500">Charuma, Charmaine</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">12 days</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Care Plan Update</p>
                      <p className="text-sm text-gray-500">Ayo-Famure, Opeyemi</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">2 days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Assign New Task
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Generate Task Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <FileUp className="h-4 w-4 mr-2" />
                    Import Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskMatrix;
