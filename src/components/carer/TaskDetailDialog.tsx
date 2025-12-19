
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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
  onDelete?: (taskId: string) => void;
  allowEditCompleted?: boolean;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ 
  open, 
  onOpenChange, 
  task, 
  onComplete,
  onSave,
  onDelete,
  allowEditCompleted = true
}) => {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [client, setClient] = useState(task?.client || "");
  const [category, setCategory] = useState(task?.category || "");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [clientVisible, setClientVisible] = useState(task?.client_visible || false);
  const [clientCanComplete, setClientCanComplete] = useState(task?.client_can_complete || false);
  
  // Mock data for categories and clients - in a real app, these would come from props or context
  const categories = ["General", "Medical", "Administrative", "Training", "Maintenance"];
  const clients = ["John Doe", "Jane Smith", "Bob Johnson"];
  
  // Reset edit mode when dialog opens or task changes
  useEffect(() => {
    setEditMode(false);
  }, [open, task]);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority?.toLowerCase() || "medium");
      setClient(task.client || "");
      setCategory(task.category || "");
      setAssignee(task.assignee || "");
      setClientVisible(task.client_visible || false);
      setClientCanComplete(task.client_can_complete || false);
      
      // Parse the due date string to a Date object
      if (task.dueDate || task.due_date) {
        const dateString = task.dueDate || task.due_date;
        try {
          if (typeof dateString === 'string' && dateString.includes('-')) {
            // ISO date format
            const parsedDate = parseISO(dateString);
            if (isValid(parsedDate)) {
              setDueDate(parsedDate);
            }
          } else if (typeof dateString === 'string' && dateString.includes(',')) {
            // Human-readable format with time
            const dateString2 = dateString.split(',')[0].trim();
            
            if (dateString2 === "Today") {
              setDueDate(new Date());
            } else if (dateString2 === "Tomorrow") {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setDueDate(tomorrow);
            } else if (dateString2 === "Yesterday") {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setDueDate(yesterday);
            } else {
              // Try to parse other formats
              try {
                const parsedDate = parse(dateString2, "EEEE", new Date());
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
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      client_visible: clientVisible,
      client_can_complete: clientCanComplete
    };
    
    onSave(updatedTask);
    setEditMode(false);
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id);
    }
    onOpenChange(false);
  };
  
  // Format date for display
  const formatTaskDate = (dueDateString: string) => {
    try {
      if (typeof dueDateString === 'string' && dueDateString.includes('-')) {
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
      <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {editMode ? "Edit Task" : task?.title}
          </DialogTitle>
          {!editMode && task?.description && (
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
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
                <Select value={priority || "medium"} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
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
                <Select value={client || "no-client"} onValueChange={(value) => setClient(value === "no-client" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-client">No Client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category || "general"} onValueChange={(value) => setCategory(value === "general" ? "General" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    {categories.filter(c => c !== "General").map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                 </Select>
               </div>
             </div>
             
             {/* Client Visibility Settings */}
             {(client && client !== "no-client") && (
               <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                 <h4 className="font-medium text-blue-900">Client Visibility</h4>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <Label htmlFor="editClientVisible" className="text-sm font-medium">
                         Visible to Client
                       </Label>
                       <p className="text-xs text-gray-600">
                         Allow the client to see this task in their dashboard
                       </p>
                     </div>
                     <Switch
                       id="editClientVisible"
                       checked={clientVisible}
                       onCheckedChange={setClientVisible}
                     />
                   </div>
                   
                   {clientVisible && (
                     <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                         <Label htmlFor="editClientCanComplete" className="text-sm font-medium">
                           Client Can Mark Complete
                         </Label>
                         <p className="text-xs text-gray-600">
                           Allow the client to mark this task as completed
                         </p>
                       </div>
                       <Switch
                         id="editClientCanComplete"
                         checked={clientCanComplete}
                         onCheckedChange={setClientCanComplete}
                       />
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Priority:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task?.priority === "high" || task?.priority === "urgent"
                    ? "bg-red-100 text-red-700" 
                    : task?.priority === "medium"
                    ? "bg-amber-100 text-amber-700" 
                    : "bg-green-100 text-green-700"
                }`}>
                  {task?.priority}
                </span>
              </div>
              
              {task?.due_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Due:</span>
                  <span>{formatTaskDate(task.due_date)}</span>
                </div>
              )}
              
              {task?.client && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Client:</span>
                  <span>{task.client}</span>
                </div>
              )}
              
              {task?.category && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Category:</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                    {task.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {editMode ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setEditMode(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">Save Changes</Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {!task?.completed && (
                <Button 
                  onClick={() => onComplete(task.id)}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  Mark Complete
                </Button>
              )}
              {(allowEditCompleted || !task?.completed) && (
                <Button variant="outline" onClick={() => setEditMode(true)} className="w-full sm:w-auto">
                  Edit
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95vw] max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
