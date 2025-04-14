
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTaskColumns, filterTasksByView } from "@/data/mockTaskData";
import { Task, TaskColumn as TaskColumnType, TaskStatus, TaskView } from "@/types/task";
import TaskColumn from "@/components/tasks/TaskColumn";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import { Button } from "@/components/ui/button";
import { 
  Search, Filter, Plus, Users, UserRound, 
  SlidersHorizontal, Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

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
  // Use props if provided, otherwise fall back to URL params
  const branchId = props.branchId || params.id;
  const branchName = props.branchName || params.branchName;
  
  const [taskView, setTaskView] = useState<TaskView>("staff");
  const [columns, setColumns] = useState<TaskColumnType[]>(getTaskColumns());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDraggedItem, setCurrentDraggedItem] = useState<DragItem | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [addToColumn, setAddToColumn] = useState<TaskStatus>("todo");
  
  // Filter columns based on search and view
  useEffect(() => {
    const allColumns = getTaskColumns();
    
    if (searchTerm.trim() !== "") {
      const filteredColumns = allColumns.map(column => ({
        ...column,
        tasks: column.tasks.filter(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }));
      setColumns(filteredColumns);
    } else {
      // Apply view filter without search
      const viewFilteredColumns = allColumns.map(column => ({
        ...column,
        tasks: filterTasksByView(column.tasks, taskView)
      }));
      setColumns(viewFilteredColumns);
    }
  }, [searchTerm, taskView]);
  
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
    
    // Find the task in the source column
    const sourceColumnObj = columns.find(col => col.id === sourceColumn);
    if (!sourceColumnObj) return;
    
    const taskToMove = sourceColumnObj.tasks.find(task => task.id === taskId);
    if (!taskToMove) return;
    
    // Update columns state
    const updatedColumns = columns.map(column => {
      // Remove from source column
      if (column.id === sourceColumn) {
        return {
          ...column,
          tasks: column.tasks.filter(task => task.id !== taskId)
        };
      }
      
      // Add to target column
      if (column.id === targetColumn) {
        return {
          ...column,
          tasks: [...column.tasks, { ...taskToMove, status: targetColumn as TaskStatus }]
        };
      }
      
      return column;
    });
    
    setColumns(updatedColumns);
    
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
  
  const addNewTask = (taskData: {
    title: string;
    description: string;
    priority: any;
    status: TaskStatus;
    assignee?: string;
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      assignee: taskData.assignee,
      assigneeAvatar: "/placeholder.svg",
      createdAt: new Date().toISOString().split('T')[0],
      tags: [],
      ...(taskView === 'client' ? { clientId: 'client-new', clientName: "New Client" } : { staffId: 'staff-new', staffName: "Staff Member" })
    };
    
    // Add the new task to the appropriate column
    const updatedColumns = columns.map(column => {
      if (column.id === taskData.status) {
        return {
          ...column,
          tasks: [...column.tasks, newTask]
        };
      }
      return column;
    });
    
    setColumns(updatedColumns);
    
    toast({
      title: "Task added",
      description: `New task "${taskData.title}" added to ${taskData.status.replace('-', ' ')}`,
    });
  };
  
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
        onAddTask={addNewTask}
        initialStatus={addToColumn}
      />
    </div>
  );
};

export default TaskMatrix;
