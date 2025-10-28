
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TaskStatus, TaskView, Task } from "@/types/task";
import TaskColumn from "@/components/tasks/TaskColumn";
import TaskDetailsDialog from "@/components/tasks/TaskDetailsDialog";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import EditTaskDialog from "@/components/tasks/EditTaskDialog";
import FilterTasksDialog from "@/components/carer/FilterTasksDialog";
import SortTasksDialog, { SortOption } from "@/components/carer/SortTasksDialog";
import DeleteZone from "@/components/tasks/DeleteZone";
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
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const [isDraggingFromDone, setIsDraggingFromDone] = useState(false);
  
  // Task details dialog state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  
  // Edit task dialog state
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Filter and Sort state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    priority: [] as string[],
    category: [] as string[],
    client: [] as string[],
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
    showCompleted: true
  });
  const [sortOption, setSortOption] = useState<SortOption>({
    field: "dueDate",
    direction: "asc",
    label: "Due Date (Earliest First)"
  });
  
  const { tasks, isLoading, updateTask, isUpdating, deleteTask, isDeleting } = useTasks(branchId);
  const { staff, clients } = useBranchStaffAndClients(branchId);
  
  // Transform database tasks to match UI requirements
  const transformedTasks = tasks.map(task => {
    // Get all assignee names
    const assigneeNames = task.assignees && task.assignees.length > 0
      ? task.assignees.map(a => `${a.first_name} ${a.last_name}`).join(', ')
      : task.assignee 
        ? `${task.assignee.first_name} ${task.assignee.last_name}`
        : undefined;

    return {
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee: assigneeNames,
      assignees: task.assignees, // Array of all assignees
      assigneeAvatar: "/placeholder.svg",
      dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : undefined,
      createdAt: new Date(task.created_at).toISOString().split('T')[0],
      tags: task.tags,
      clientId: task.client?.id,
      clientName: task.client ? `${task.client.first_name} ${task.client.last_name}` : undefined,
      staffId: task.assignee?.id,
      staffName: task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : undefined,
      category: task.category || 'General',
      notes: task.notes || '',
      completion_percentage: task.completion_percentage || 0,
    };
  });
  
  // Extract unique categories and clients for filter options
  const uniqueCategories = Array.from(new Set(transformedTasks.map(task => task.category).filter(Boolean)));
  const uniqueClients = Array.from(new Set(transformedTasks.map(task => task.clientName).filter(Boolean)));
  
  // Apply filters to tasks
  const applyFilters = (tasks: any[]) => {
    return tasks.filter(task => {
      // Priority filter
      if (activeFilters.priority.length > 0) {
        // Map UI priority labels to database values
        const priorityMap: Record<string, string> = {
          'High Priority': 'high',
          'Medium Priority': 'medium', 
          'Low Priority': 'low',
          'Urgent': 'urgent'
        };
        const mappedPriorities = activeFilters.priority.map(p => priorityMap[p] || p.toLowerCase());
        if (!mappedPriorities.includes(task.priority)) return false;
      }
      
      // Category filter
      if (activeFilters.category.length > 0) {
        if (!activeFilters.category.includes(task.category || 'General')) return false;
      }
      
      // Client filter
      if (activeFilters.client.length > 0) {
        if (!task.clientName || !activeFilters.client.includes(task.clientName)) return false;
      }
      
      // Date range filter
      if (activeFilters.dateRange.from || activeFilters.dateRange.to) {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        if (activeFilters.dateRange.from && taskDate < activeFilters.dateRange.from) return false;
        if (activeFilters.dateRange.to && taskDate > activeFilters.dateRange.to) return false;
      }
      
      // Show completed filter
      if (!activeFilters.showCompleted && task.status === 'done') return false;
      
      return true;
    });
  };
  
  // Apply sorting to tasks
  const applySorting = (tasks: any[]) => {
    return [...tasks].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortOption.field) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = (a.category || 'General').toLowerCase();
          bValue = (b.category || 'General').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOption.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOption.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };
  
  // Filter tasks based on search, view, filters, and sorting
  const processedTasks = (() => {
    // First apply search and view filters
    let filtered = transformedTasks.filter(task => {
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
    
    // Apply additional filters
    filtered = applyFilters(filtered);
    
    // Apply sorting
    return applySorting(filtered);
  })();
  
  // Group tasks by status
  const columns = [
    {
      id: "backlog" as TaskStatus,
      title: "Backlog",
      tasks: processedTasks.filter(task => task.status === "backlog"),
      color: "bg-gray-100"
    },
    {
      id: "todo" as TaskStatus,
      title: "To Do",
      tasks: processedTasks.filter(task => task.status === "todo"),
      color: "bg-blue-100"
    },
    {
      id: "in-progress" as TaskStatus,
      title: "In Progress",
      tasks: processedTasks.filter(task => task.status === "in-progress"),
      color: "bg-amber-100"
    },
    {
      id: "review" as TaskStatus,
      title: "Review",
      tasks: processedTasks.filter(task => task.status === "review"),
      color: "bg-purple-100"
    },
    {
      id: "done" as TaskStatus,
      title: "Done",
      tasks: processedTasks.filter(task => task.status === "done"),
      color: "bg-green-100"
    }
  ];
  
  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColumn: string) => {
    setCurrentDraggedItem({ taskId, sourceColumn });
    setIsDraggingFromDone(sourceColumn === "done");
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
  
  const handleDeleteZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to columns
    e.dataTransfer.dropEffect = "move";
    setIsOverDeleteZone(true);
  };

  const handleDeleteZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to columns
    setIsOverDeleteZone(false);
  };

  const handleDeleteZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Critical - prevent column drop handlers from firing
    
    if (!currentDraggedItem) {
      console.warn('No dragged item found on delete zone drop');
      return;
    }
    
    const { taskId, sourceColumn } = currentDraggedItem;
    
    console.log('Delete zone drop:', { taskId, sourceColumn });
    
    // Only allow deletion from "done" column
    if (sourceColumn !== "done") {
      toast({
        title: "Cannot delete",
        description: "Only completed tasks can be deleted this way.",
        variant: "destructive",
      });
      setIsOverDeleteZone(false);
      setIsDraggingFromDone(false);
      setCurrentDraggedItem(null);
      return;
    }
    
    // Show immediate feedback
    toast({
      title: "Deleting task...",
      description: "Task is being removed from the system.",
    });
    
    // Delete the task
    console.log('Deleting task:', taskId);
    deleteTask(taskId);
    
    // Reset states
    setIsOverDeleteZone(false);
    setIsDraggingFromDone(false);
    setCurrentDraggedItem(null);
  };
  
  const handleDragEnd = () => {
    // Reset all drag states when drag operation ends
    setCurrentDraggedItem(null);
    setIsDraggingFromDone(false);
    setIsOverDeleteZone(false);
  };
  
  const handleAddTask = (columnId: TaskStatus) => {
    setAddToColumn(columnId);
    setIsAddTaskDialogOpen(true);
  };
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskDialogOpen(true);
  };
  
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask({
      id: taskId,
      status: newStatus
    });
    
    // Close dialog after short delay to show update
    setTimeout(() => {
      setIsTaskDetailsOpen(false);
      setSelectedTask(null);
    }, 500);
  };
  
  const handleCloseTaskDetails = () => {
    setIsTaskDetailsOpen(false);
    setSelectedTask(null);
  };
  
  const handleApplyFilters = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    setIsFilterDialogOpen(false);
  };
  
  const handleApplySort = (sort: SortOption) => {
    setSortOption(sort);
    setIsSortDialogOpen(false);
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Action Plan</h1>
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
              <TabsList>
                <TabsTrigger value="staff" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Staff</span>
                </TabsTrigger>
                <TabsTrigger value="client" className="flex items-center gap-1">
                  <UserRound className="h-4 w-4" />
                  <span className="hidden sm:inline">Client</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              className="gap-2 whitespace-nowrap"
              onClick={() => setIsFilterDialogOpen(true)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2 whitespace-nowrap"
              onClick={() => setIsSortDialogOpen(true)}
            >
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
      
      <div className="overflow-x-auto pb-6 relative">
        <div className="flex gap-4 min-w-max">
          {/* Delete Zone - only visible when dragging from Done */}
          <DeleteZone
            isVisible={isDraggingFromDone}
            isActive={isOverDeleteZone}
            onDragOver={handleDeleteZoneDragOver}
            onDragLeave={handleDeleteZoneDragLeave}
            onDrop={handleDeleteZoneDrop}
          />
          
          {/* Task Columns */}
          {columns.map(column => (
            <TaskColumn
              key={column.id}
              column={column}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
              onTaskEdit={handleEditTask}
              onDragEnd={handleDragEnd}
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
      
      <EditTaskDialog
        isOpen={isEditTaskDialogOpen}
        onClose={() => {
          setIsEditTaskDialogOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        branchId={branchId}
        staff={staff || []}
        clients={clients || []}
        categories={['general', 'Medical', 'Administrative', 'Training', 'Maintenance', 'Social', 'Safety', 'Nutrition', 'Therapy']}
      />
      
      <FilterTasksDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        onApplyFilters={handleApplyFilters}
        categories={uniqueCategories}
        clients={uniqueClients}
      />
      
      <SortTasksDialog
        open={isSortDialogOpen}
        onOpenChange={setIsSortDialogOpen}
        selectedSort={sortOption}
        onSelectSort={handleApplySort}
      />
      
      <TaskDetailsDialog
        task={selectedTask}
        isOpen={isTaskDetailsOpen}
        onClose={handleCloseTaskDetails}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default TaskMatrix;
