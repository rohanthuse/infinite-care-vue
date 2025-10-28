import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
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
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { TaskPriority, TaskStatus } from "@/types/task";
import { useTasks } from "@/hooks/useTasks";
import { useBranchStaffAndClients } from "@/hooks/useBranchStaffAndClients";
import { useCarerTasks } from "@/hooks/useCarerTasks";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { useParams } from "react-router-dom";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask?: (task: any) => void; // Keep for backward compatibility
  initialStatus?: TaskStatus;
  clients?: string[]; // Keep for backward compatibility
  categories?: string[]; // Keep for backward compatibility
  branchId?: string; // New prop for carer context
  isCarerContext?: boolean; // Flag to indicate if this is being used in carer context
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ 
  isOpen, 
  onClose, 
  onAddTask,
  initialStatus = 'todo',
  branchId: propBranchId,
  isCarerContext = false,
}) => {
  const params = useParams<{id: string}>();
  const urlBranchId = params.id;
  
  // Use branchId from props (carer context) or URL params (admin context)
  const branchId = propBranchId || urlBranchId;
  
  // Get carer context only if needed
  const carerAuth = isCarerContext ? useCarerAuthSafe() : { carerProfile: null };
  const carerTasks = isCarerContext ? useCarerTasks() : { addTask: null };
  
  // Get admin context
  const { createTask } = useTasks(branchId!);
  const { staff, clients } = useBranchStaffAndClients(branchId!);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [clientId, setClientId] = useState<string>("no-client");
  const [category, setCategory] = useState<string>("general");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [clientVisible, setClientVisible] = useState(() => {
    // Remember last choice from localStorage
    const saved = localStorage.getItem('addTaskDialog_clientVisible');
    return saved ? JSON.parse(saved) : false;
  });
  const [clientCanComplete, setClientCanComplete] = useState(() => {
    // Remember last choice from localStorage
    const saved = localStorage.getItem('addTaskDialog_clientCanComplete');
    return saved ? JSON.parse(saved) : false;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Submit Task - Selected Assignee IDs:', assigneeIds);
    console.log('🔍 Submit Task - Assignee Count:', assigneeIds.length);
    
    if (!branchId) {
      console.error('No branch ID available');
      return;
    }
    
    const taskData = {
      title,
      description,
      status,
      priority,
      due_date: dueDate ? dueDate.toISOString() : null,
      client_id: clientId === "no-client" ? null : clientId,
      category,
      client_visible: clientVisible,
      client_can_complete: clientCanComplete,
    };
    
    if (isCarerContext && carerTasks.addTask) {
      // Use carer-specific task creation (auto-assigns to current carer)
      carerTasks.addTask(taskData);
    } else {
      // Use admin task creation flow
      const taskPayload = {
        ...taskData,
        branch_id: branchId,
        assignee_id: assigneeIds.length > 0 ? assigneeIds[0] : null, // Primary assignee
        assignee_ids: assigneeIds, // All assignees
        created_by: null,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        notes: notes || null,
        completion_percentage: 0,
      };
      
      console.log('🔍 Creating task with payload:', taskPayload);
      createTask(taskPayload);
    }
    
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus(initialStatus);
    setAssigneeIds([]);
    setClientId("no-client");
    setCategory("general");
    setDueDate(undefined);
    setNotes("");
    setTags("");
    setClientVisible(false);
    setClientCanComplete(false);
  };

  const categories = [
    'general', 'Medical', 'Administrative', 'Training', 
    'Maintenance', 'Social', 'Safety', 'Nutrition', 'Therapy'
  ];

  // Transform staff data to MultiSelect options
  const staffOptions: MultiSelectOption[] = staff.map(member => ({
    label: `${member.first_name} ${member.last_name}`,
    value: member.id,
    description: member.specialization || undefined
  }));

  // Don't render if no branchId is available
  if (!branchId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
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
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
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
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className={`grid grid-cols-1 ${isCarerContext ? '' : 'sm:grid-cols-2'} gap-4`}>
            {!isCarerContext && (
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee(s)</Label>
                <MultiSelect
                  options={staffOptions}
                  selected={assigneeIds}
                  onSelectionChange={setAssigneeIds}
                  placeholder="Select assignee(s)..."
                  searchPlaceholder="Search staff..."
                  emptyText="No staff members found."
                  showSelectAll={true}
                  maxDisplay={2}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={(value) => {
                setClientId(value);
                // Auto-set clientVisible when a client is selected
                if (value !== "no-client" && !clientVisible) {
                  setClientVisible(true);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">No client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="urgent, review, medical"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or comments"
              rows={2}
            />
          </div>
          
          {/* Client Visibility Settings */}
          {clientId !== "no-client" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">Client Visibility</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="clientVisible" className="text-sm font-medium">
                      Visible to Client
                    </Label>
                    <p className="text-xs text-gray-600">
                      Allow the client to see this task in their dashboard
                    </p>
                  </div>
                   <Switch
                     id="clientVisible"
                     checked={clientVisible}
                     onCheckedChange={(checked) => {
                       setClientVisible(checked);
                       localStorage.setItem('addTaskDialog_clientVisible', JSON.stringify(checked));
                     }}
                   />
                </div>
                
                {clientVisible && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="clientCanComplete" className="text-sm font-medium">
                        Client Can Mark Complete
                      </Label>
                      <p className="text-xs text-gray-600">
                        Allow the client to mark this task as completed
                      </p>
                    </div>
                     <Switch
                       id="clientCanComplete"
                       checked={clientCanComplete}
                       onCheckedChange={(checked) => {
                         setClientCanComplete(checked);
                         localStorage.setItem('addTaskDialog_clientCanComplete', JSON.stringify(checked));
                       }}
                     />
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
