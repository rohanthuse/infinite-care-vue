
import React, { useState } from "react";
import { 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus, 
  Search, 
  AlertCircle,
  ArrowDownUp,
  User
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import TaskDetailDialog from "@/components/carer/TaskDetailDialog";

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
  const [tasks, setTasks] = useState(mockTasks);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const pendingTasks = tasks.filter(task => !task.completed && 
    (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
     task.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  const completedTasks = tasks.filter(task => task.completed && 
    (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
     task.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: true } 
          : task
      )
    );
    setDetailDialogOpen(false);
    toast({
      title: "Task completed",
      description: "The task has been marked as complete.",
    });
  };

  const handleSaveTask = (updatedTask: any) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === updatedTask.id 
          ? updatedTask 
          : task
      )
    );
    setDetailDialogOpen(false);
    toast({
      title: "Task updated",
      description: "Your changes have been saved.",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      
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
          <Button variant="outline" className="flex-1 md:flex-none gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none gap-2">
            <ArrowDownUp className="h-4 w-4" />
            <span>Sort</span>
          </Button>
          <Button className="flex-1 md:flex-none gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="pending" className="flex-1">
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-0 space-y-4">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 border mt-1 ${
                      task.priority === "High" 
                        ? "border-red-300 bg-red-50" 
                        : task.priority === "Medium" 
                        ? "border-amber-300 bg-amber-50" 
                        : "border-green-300 bg-green-50"
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
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteTask(task.id);
                          }}
                        >
                          Complete
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
              <p className="text-gray-500">No pending tasks found.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0 space-y-4">
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-sm transition-shadow bg-gray-50 opacity-80 cursor-pointer" onClick={() => handleTaskClick(task)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 border mt-1 border-green-300 bg-green-50">
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
            <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
              <p className="text-gray-500">No completed tasks found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedTask && (
        <TaskDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          task={selectedTask}
          onComplete={handleCompleteTask}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
};

export default CarerTasks;
