
import React, { useState, useEffect } from "react";
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
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import TaskDetailDialog from "@/components/carer/TaskDetailDialog";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import FilterTasksDialog from "@/components/carer/FilterTasksDialog";
import SortTasksDialog from "@/components/carer/SortTasksDialog";
import { useCarerTasks } from "@/hooks/useCarerTasks";
import { useCarerBranch } from "@/hooks/useCarerBranch";
import { v4 as uuidv4 } from "uuid";
import { format, isWithinInterval, parse, parseISO, isBefore, isAfter } from "date-fns";
import { SortOption } from "@/components/carer/SortTasksDialog";

const CarerTasks: React.FC = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Get carer's branch information
  const { data: carerBranch, isLoading: branchLoading } = useCarerBranch();
  
  // Get tasks from the new database hook
  const { tasks, completeTask, updateTask, addTask, deleteTask, isLoading } = useCarerTasks();
  
  // Filter and sort states
  const [filters, setFilters] = useState({
    priority: [] as string[],
    category: [] as string[],
    client: [] as string[],
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
    showCompleted: false
  });
  
  const [sortOption, setSortOption] = useState<SortOption>({ 
    field: "due_date", 
    direction: "asc", 
    label: "Due Date (Earliest First)" 
  });

  // Extract unique categories and clients for filters
  const categories = Array.from(
    new Set(tasks.map(task => task.category).filter(Boolean))
  );
  const clients = Array.from(
    new Set(tasks.map(task => {
      if (typeof task.client === 'string') {
        return task.client;
      } else if (task.client && typeof task.client === 'object') {
        return `${(task.client as any).first_name} ${(task.client as any).last_name}`;
      }
      return null;
    }).filter(Boolean))
  ) as string[];

  // Apply filters and search to tasks
  const filteredTasks = tasks.filter(task => {
    // Text search
    const clientName = typeof task.client === 'string' 
      ? task.client 
      : task.client && typeof task.client === 'object'
      ? `${(task.client as any).first_name} ${(task.client as any).last_name}`
      : '';
      
    const searchMatch = 
      searchQuery === "" || 
      (task.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (clientName && clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.category && task.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Completed/pending filter
    const completedMatch = 
      (activeTab === "pending" && !task.completed) || 
      (activeTab === "completed" && task.completed) ||
      (filters.showCompleted);
    
    // Priority filter
    const priorityMatch = 
      filters.priority.length === 0 || 
      filters.priority.includes(task.priority);
    
    // Category filter
    const categoryMatch = 
      filters.category.length === 0 || 
      (task.category && filters.category.includes(task.category));
    
    // Client filter
    const taskClientName = typeof task.client === 'string' 
      ? task.client 
      : task.client && typeof task.client === 'object'
      ? `${(task.client as any).first_name} ${(task.client as any).last_name}`
      : '';
    const clientMatch = 
      filters.client.length === 0 || 
      (taskClientName && filters.client.includes(taskClientName));
    
    // Date range filter
    let dateMatch = true;
    if (filters.dateRange.from || filters.dateRange.to) {
      if (task.due_date) {
        const taskDate = typeof task.due_date === 'string' 
          ? (task.due_date.includes('-') ? parseISO(task.due_date) : parse(task.due_date, 'MMMM d, yyyy', new Date()))
          : new Date();
        
        if (filters.dateRange.from && filters.dateRange.to) {
          dateMatch = isWithinInterval(taskDate, { 
            start: filters.dateRange.from, 
            end: filters.dateRange.to 
          });
        } else if (filters.dateRange.from) {
          dateMatch = isAfter(taskDate, filters.dateRange.from) || 
                      taskDate.toDateString() === filters.dateRange.from.toDateString();
        } else if (filters.dateRange.to) {
          dateMatch = isBefore(taskDate, filters.dateRange.to) || 
                      taskDate.toDateString() === filters.dateRange.to.toDateString();
        }
      } else {
        dateMatch = false;
      }
    }
    
    return searchMatch && completedMatch && priorityMatch && categoryMatch && clientMatch && dateMatch;
  });

  // Apply sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const { field, direction } = sortOption;
    
    // Handle undefined values
    if (a[field as keyof typeof a] === undefined && b[field as keyof typeof b] === undefined) return 0;
    if (a[field as keyof typeof a] === undefined) return direction === 'asc' ? 1 : -1;
    if (b[field as keyof typeof b] === undefined) return direction === 'asc' ? -1 : 1;
    
    // Sort by priority numerically
    if (field === 'priority') {
      const priorityValues: Record<string, number> = { 
        'urgent': 3, 
        'high': 2, 
        'medium': 1, 
        'low': 0 
      };
      
      const valueA = priorityValues[a[field]?.toLowerCase() || 'low'];
      const valueB = priorityValues[b[field]?.toLowerCase() || 'low'];
      
      return direction === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }
    
    // Sort by date
    if (field === 'due_date') {
      if (!a.due_date) return direction === 'asc' ? 1 : -1;
      if (!b.due_date) return direction === 'asc' ? -1 : 1;
      
      const dateA = typeof a.due_date === 'string' 
        ? (a.due_date.includes('-') ? parseISO(a.due_date) : parse(a.due_date, 'MMMM d, yyyy', new Date()))
        : new Date();
      const dateB = typeof b.due_date === 'string' 
        ? (b.due_date.includes('-') ? parseISO(b.due_date) : parse(b.due_date, 'MMMM d, yyyy', new Date()))
        : new Date();
      
      return direction === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }
    
    // Sort by text fields
    const valueA = String(a[field as keyof typeof a] || '').toLowerCase();
    const valueB = String(b[field as keyof typeof b] || '').toLowerCase();
    
    return direction === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const pendingTasks = sortedTasks.filter(task => !task.completed);
  const completedTasks = sortedTasks.filter(task => task.completed);

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
    setDetailDialogOpen(false);
    setSelectedTask(null);
  };

  const handleSaveTask = (updatedTask: any) => {
    updateTask(updatedTask);
    setDetailDialogOpen(false);
    setSelectedTask(null);
  };

  const handleAddTask = (taskData: any) => {
    addTask(taskData);
    setAddTaskDialogOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    setDetailDialogOpen(false);
    setSelectedTask(null);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSelectSort = (sort: SortOption) => {
    setSortOption(sort);
  };

  // Format date for display
  const formatDueDate = (dueDateString: string) => {
    try {
      if (dueDateString.includes('-')) {
        // Handle ISO date format
        const date = parseISO(dueDateString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
          return "Today";
        } else if (date.toDateString() === tomorrow.toDateString()) {
          return "Tomorrow";
        } else {
          return format(date, "EEE, MMM d");
        }
      } else {
        // Already formatted date
        return dueDateString;
      }
    } catch (e) {
      return dueDateString;
    }
  };

  if (isLoading || branchLoading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">My Tasks</h1>
      
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-initial gap-2"
            onClick={() => setFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none gap-2"
            onClick={() => setSortDialogOpen(true)}
          >
            <ArrowDownUp className="h-4 w-4" />
            <span>Sort</span>
          </Button>
          <Button 
            className="flex-1 md:flex-none gap-2"
            onClick={() => setAddTaskDialogOpen(true)}
          >
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
        
        <TabsContent value="pending" className="w-full mt-0 space-y-4">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 border mt-1 ${
                      task.priority === "high" || task.priority === "urgent"
                        ? "border-red-300 bg-red-50 dark:bg-red-950/50 dark:border-red-700" 
                        : task.priority === "medium"
                        ? "border-amber-300 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-700" 
                        : "border-green-300 bg-green-50 dark:bg-green-950/50 dark:border-green-700"
                    }`}>
                      {(task.priority === "high" || task.priority === "urgent") && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{task.title}</h3>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === "high" || task.priority === "urgent"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" 
                            : task.priority === "medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" 
                            : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        }`}>
                          {task.priority}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                        {task.due_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {formatDueDate(task.due_date)}
                          </div>
                        )}
                        
                        {task.client && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3.5 w-3.5 mr-1" />
                            {typeof task.client === 'string' 
                              ? task.client 
                              : `${(task.client as any).first_name} ${(task.client as any).last_name}`}
                          </div>
                        )}
                        
                        {task.category && (
                          <div className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                            {task.category}
                          </div>
                        )}
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
            <div className="py-12 text-center bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">No pending tasks found.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="w-full mt-0 space-y-4">
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-sm transition-shadow bg-muted/50 opacity-80 cursor-pointer" onClick={() => handleTaskClick(task)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 border mt-1 border-green-300 bg-green-50 dark:bg-green-950/50 dark:border-green-700">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium line-through text-muted-foreground">{task.title}</h3>
                        <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          Completed
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                        {task.due_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {formatDueDate(task.due_date)}
                          </div>
                        )}
                        
                        {task.client && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3.5 w-3.5 mr-1" />
                            {typeof task.client === 'string' 
                              ? task.client 
                              : `${(task.client as any).first_name} ${(task.client as any).last_name}`}
                          </div>
                        )}
                        
                        {task.category && (
                          <div className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                            {task.category}
                          </div>
                        )}
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

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          open={detailDialogOpen}
          onOpenChange={(open) => {
            setDetailDialogOpen(open);
            if (!open) {
              setSelectedTask(null);
            }
          }}
          task={selectedTask}
          onComplete={handleCompleteTask}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          allowEditCompleted={false}
        />
      )}
      
      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={addTaskDialogOpen}
        onClose={() => setAddTaskDialogOpen(false)}
        onAddTask={handleAddTask}
        clients={clients as string[]}
        categories={categories as string[]}
        branchId={carerBranch?.branch_id}
        isCarerContext={true}
      />
      
      {/* Filter Tasks Dialog */}
      <FilterTasksDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        onApplyFilters={handleApplyFilters}
        categories={categories as string[]}
        clients={clients as string[]}
      />
      
      {/* Sort Tasks Dialog */}
      <SortTasksDialog
        open={sortDialogOpen}
        onOpenChange={setSortDialogOpen}
        selectedSort={sortOption}
        onSelectSort={handleSelectSort}
      />
    </div>
  );
};

export default CarerTasks;
