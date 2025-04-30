
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any; // Using any for now, can be replaced with proper Task type
  onComplete: (taskId: string) => void;
  onSave: (task: any) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  open,
  onOpenChange,
  task,
  onComplete,
  onSave,
}) => {
  const [editedTask, setEditedTask] = useState(task);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize editedTask whenever the task prop changes
  React.useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTask((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePriorityChange = (value: string) => {
    setEditedTask((prev: any) => ({
      ...prev,
      priority: value,
    }));
  };

  const handleSave = () => {
    onSave(editedTask);
    setIsEditing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "low":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <Circle className="h-4 w-4 text-amber-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!task) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? (
              <Input
                name="title"
                value={editedTask.title}
                onChange={handleInputChange}
                className="mt-2"
              />
            ) : (
              task.title
            )}
          </DialogTitle>

          <div className="flex flex-wrap gap-2 items-center mt-2">
            {isEditing ? (
              <Select
                value={editedTask.priority}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getPriorityColor(
                  task.priority
                )}`}
              >
                {getPriorityIcon(task.priority)}
                <span>{task.priority}</span>
              </div>
            )}

            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {task.dueDate}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            {isEditing ? (
              <Textarea
                name="description"
                value={editedTask.description}
                onChange={handleInputChange}
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-sm text-gray-600">{task.description}</p>
            )}
          </div>

          {task.client && (
            <div>
              <h4 className="text-sm font-medium mb-1">Client</h4>
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {isEditing ? (
                  <Input
                    name="client"
                    value={editedTask.client}
                    onChange={handleInputChange}
                  />
                ) : (
                  task.client
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-1">Category</h4>
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              {isEditing ? (
                <Input
                  name="category"
                  value={editedTask.category}
                  onChange={handleInputChange}
                />
              ) : (
                <Badge variant="outline">{task.category}</Badge>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <>
              {!task.completed && (
                <Button onClick={() => onComplete(task.id)}>
                  Mark as Complete
                </Button>
              )}
              <Button
                variant={task.completed ? "default" : "outline"}
                onClick={() => setIsEditing(true)}
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
