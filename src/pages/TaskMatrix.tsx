
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TaskStatus, TaskView } from "@/types/task";
import TaskColumn from "@/components/tasks/TaskColumn";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import { Button } from "@/components/ui/button";
import { 
  Search, Filter, Plus, Users, UserRound, 
  SlidersHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useTasks, DatabaseTask } from "@/hooks/useTasks";
import { useBranchStaffAndClients } from "@/hooks/useBranchStaffAndClients";

interface DragItem {
  taskId: string;
  sourceColumn: string;
}

export interface TaskMatrixProps {
  branchId?: string;
  branchName?: string;
}

const TaskMatrix: React.FC<TaskMatrixProps> = (props) => {
  const navigate = useNavigate();
  const params = useParams<{id: string, branchName: string}>();
  
  const branchId = props.branchId || params.id;
  const branchName = props.branchName || params.branchName;
  
  if (!branchId) {
    return <div>Branch ID is required</div>;
  }
  
  const [taskView, setTaskView] = useState<TaskView>("staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDraggedItem, setCurrentDraggedItem] = useState<DragItem | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [addToColumn, setAddToColumn] = useState<TaskStatus>("todo");
  
  const { tasks, isLoading, updateTask } = useTasks(branchId);
  const { staff, clients } = useBranchStaffAndClients(branchId);
  
  // Transform database tasks to match UI requirements
  const transformedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assignee: task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : undefined,
    assigneeAvatar: "/placeholder.svg",
    dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : undefined,
    createdAt: new Date(task.created_at).toISOString().split('T')[0],
    tags: task.tags,
    clientId: task.client?.id,
    clientName: task.client ? `${task.client.first_name} ${task.client.last_name}` : undefined,
    staffId: task.assignee?.id,
    staffName: task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : undefined,
  }));
  
  // Filter tasks based on search and view
  const filteredTasks = transformedTasks.filter(task => {
    const matchesSearch = searchTerm.trim() === "" || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesView = taskView === "staff" ? 
      (task.staffId || !task.clientId) : 
      !!task.clientId;
    
    return matchesSearch && matchesView;
  });
  
  // Group tasks by status
  const columns = [
    {
      id: "backlog" as TaskStatus,
      title: "Backlog",
      tasks: filteredTasks.filter(task => task.status === "backlog"),
      color: "bg-gray-100"
    },
    {
      id: "todo" as TaskStatus,
      title: "To Do",
      tasks: filteredTasks.filter(task => task.status === "todo"),
      color: "bg-blue-100"
    },
    {
      id: "in-progress" as TaskStatus,
      title: "In Progress",
      tasks: filteredTasks.filter(task => task.status === "in-progress"),
      color: "bg-amber-100"
    },
    {
      id: "review" as TaskStatus,
      title: "Review",
      tasks: filteredTasks.filter(task => task.status === "review"),
      color: "bg-purple-100"
    },
    {
      id: "done" as TaskStatus,
      title: "Done",
      tasks: filteredTasks.filter(task => task.status === "done"),
      color: "bg-green-100"
    }
  ];
  
  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColumn: string) => {
    setCurrentDraggedItem({ taskId, sourceColumn });
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  
  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    
    if (!currentDraggedItem) return;
    
    const { taskId, sourceColumn } = currentDraggedItem;
    
    if (sourceColumn === targetColumn) return;
    
    // Update task status in database
    updateTask({
      id: taskId,
      status: targetColumn as TaskStatus
    });
    
    toast({
      title: "Task moved",
      description: `Task moved to ${targetColumn.replace('-', ' ')}`,
    });
    
    setCurrentDraggedItem(null);
  };
  
  const handleAddTask = (columnId: TaskStatus) => {
    setAddToColumn(columnId);
    setIsAddTaskDialogOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading tasks...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Task Matrix</h1>
        <p className="text-gray-500 mt-2">Organize, assign, and track tasks efficiently</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Tabs value={taskView} onValueChange={(value) => setTaskView(value as TaskView)} className="w-auto">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="staff" className="flex items-center gap-1 data-[state=active]:bg-white">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Staff</span>
                </TabsTrigger>
                <TabsTrigger value="client" className="flex items-center gap-1 data-[state=active]:bg-white">
                  <UserRound className="h-4 w-4" />
                  <span className="hidden sm:inline">Client</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" className="gap-2 whitespace-nowrap">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            
            <Button variant="outline" className="gap-2 whitespace-nowrap">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Sort</span>
            </Button>
            
            <Button 
              variant="default" 
              className="gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setAddToColumn("todo");
                setIsAddTaskDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max">
          {columns.map(column => (
            <TaskColumn
              key={column.id}
              column={column}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </div>
      
      <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        onClose={() => setIsAddTaskDialogOpen(false)}
        onAddTask={(taskData) => {
          // This will be handled by the updated AddTaskDialog component
          console.log('Add task:', taskData);
        }}
        initialStatus={addToColumn}
        clients={clients?.map(c => `${c.first_name} ${c.last_name}`) || []}
        categories={['Medical', 'Administrative', 'Training', 'Maintenance', 'Social', 'Safety', 'Nutrition', 'Therapy']}
      />
    </div>
  );
};

export default TaskMatrix;
