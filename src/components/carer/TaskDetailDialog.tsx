
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isValid, parse, parseISO } from "date-fns";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/contexts/TaskContext";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onComplete: (taskId: string) => void;
  onSave: (task: any) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ 
  open, 
  onOpenChange, 
  task, 
  onComplete,
  onSave
}) => {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [client, setClient] = useState(task?.client || "");
  const [category, setCategory] = useState(task?.category || "");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  
  const { tasks, deleteTask } = useTasks();
  
  // Extract unique categories and clients for dropdowns
  const categories = Array.from(
    new Set(tasks.map(t => t.category).filter(Boolean))
  );
  const clients = Array.from(
    new Set(tasks.map(t => t.client).filter(Boolean))
  );
  
  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "Medium");
      setClient(task.client || "");
      setCategory(task.category || "");
      setAssignee(task.assignee || "");
      
      // Parse the due date string to a Date object
      if (task.dueDate) {
        try {
          if (task.dueDate.includes('-')) {
            // ISO date format
            const parsedDate = parseISO(task.dueDate);
            if (isValid(parsedDate)) {
              setDueDate(parsedDate);
            }
          } else if (task.dueDate.includes(',')) {
            // Human-readable format with time
            const dateString = task.dueDate.split(',')[0].trim();
            
            if (dateString === "Today") {
              setDueDate(new Date());
            } else if (dateString === "Tomorrow") {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setDueDate(tomorrow);
            } else if (dateString === "Yesterday") {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setDueDate(yesterday);
            } else {
              // Try to parse other formats
              try {
                const parsedDate = parse(dateString, "EEEE", new Date());
                if (isValid(parsedDate)) {
                  setDueDate(parsedDate);
                }
              } catch (e) {
                console.error("Error parsing date:", e);
                setDueDate(undefined);
              }
            }
          }
        } catch (e) {
          console.error("Error parsing date:", e);
          setDueDate(undefined);
        }
      } else {
        setDueDate(undefined);
      }
    }
  }, [task]);
  
  const handleSave = () => {
    const updatedTask = {
      ...task,
      title,
      description,
      priority,
      client: client || null,
      category: category || "General",
      assignee: assignee || null,
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : null
    };
    
    onSave(updatedTask);
    setEditMode(false);
  };
  
  const handleDelete = () => {
    deleteTask(task.id);
    onOpenChange(false);
  };
  
  // Format date for display
  const formatTaskDate = (dueDateString: string) => {
    try {
      if (dueDateString.includes('-')) {
        // Handle ISO date format
        const date = parseISO(dueDateString);
        return format(date, "MMMM d, yyyy");
      }
      // Already formatted date
      return dueDateString;
    } catch (e) {
      return dueDateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editMode ? "Edit Task" : task?.title}
          </DialogTitle>
          {!editMode && task?.description && (
            <DialogDescription className="text-sm text-gray-500">
              {task.description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {editMode ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dueDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={client || ""} onValueChange={setClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category || ""} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Enter assignee name"
              />
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="flex flex-col gap-4">
              {task?.dueDate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Due: {formatTaskDate(task.dueDate)}</span>
                </div>
              )}
              
              {task?.client && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Client: {task.client}</span>
                </div>
              )}
              
              {task?.category && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Category: {task.category}</span>
                </div>
              )}
              
              {task?.assignee && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Assigned to: {task.assignee}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <div 
                  className={`px-2 py-0.5 inline-flex rounded-full text-xs font-medium ${
                    task?.priority === "High" 
                      ? "bg-red-100 text-red-700" 
                      : task?.priority === "Medium" 
                      ? "bg-amber-100 text-amber-700" 
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {task?.priority || "Low"} Priority
                </div>
                
                {task?.completed && (
                  <div className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className={cn(
          "flex-col-reverse sm:flex-row gap-2",
          editMode ? "sm:justify-between" : ""
        )}>
          {editMode ? (
            <>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This task will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <>
              {!task?.completed && (
                <Button 
                  variant="default"
                  onClick={() => onComplete(task?.id)}
                >
                  Mark as Complete
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => setEditMode(true)}
              >
                Edit Task
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
