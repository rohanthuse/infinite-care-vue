import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Task, TaskStatus } from "@/types/task";
import {
  Clock,
  Tag,
  User,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  CircleAlert,
  Circle,
  Users,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailsDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  isUpdating: boolean;
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "urgent":
      return <CircleAlert className="h-4 w-4 text-red-500" />;
    case "high":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "medium":
      return <Circle className="h-4 w-4 text-yellow-500" />;
    case "low":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-300";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "low":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusLabel = (status: TaskStatus) => {
  const labels: Record<TaskStatus, string> = {
    backlog: "Backlog",
    todo: "To Do",
    "in-progress": "In Progress",
    review: "Review",
    done: "Done",
  };
  return labels[status];
};

const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  task,
  isOpen,
  onClose,
  onStatusChange,
  isUpdating,
}) => {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-start gap-2">
            <FileText className="h-6 w-6 mt-1 flex-shrink-0" />
            <span className="break-words">{task.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Status
            </label>
            <Select
              value={task.status}
              onValueChange={(value) => onStatusChange(task.id, value as TaskStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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

          {/* Priority & Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Priority</label>
              <Badge
                className={cn(
                  "text-sm font-medium px-3 py-1 flex items-center gap-2 w-fit",
                  getPriorityColor(task.priority)
                )}
              >
                {getPriorityIcon(task.priority)}
                <span className="capitalize">{task.priority}</span>
              </Badge>
            </div>

            {task.category && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                  {task.category}
                </div>
              </div>
            )}
          </div>

          {/* Due Date & Client Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.dueDate && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Due Date
                </label>
                <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                  <Calendar className="h-4 w-4 mr-2" />
                  {task.dueDate}
                </div>
              </div>
            )}

            {task.clientName && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client
                </label>
                <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                  {task.clientName}
                </div>
              </div>
            )}
          </div>

          {/* Assignees */}
          {((task.assignees && task.assignees.length > 0) || task.assignee) && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assignees
              </label>
              <div className="space-y-2">
                {task.assignees && task.assignees.length > 0 ? (
                  task.assignees.map((assignee, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-md border border-gray-200"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm bg-blue-100">
                          {assignee.first_name[0]}
                          {assignee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {assignee.first_name} {assignee.last_name}
                        </div>
                        {assignee.specialization && (
                          <div className="text-xs text-gray-500">
                            {assignee.specialization}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : task.assignee ? (
                  <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assigneeAvatar} alt={task.assignee} />
                      <AvatarFallback className="text-sm">
                        {task.assignee.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium text-gray-700">
                      {task.assignee}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-sm py-1 px-3 bg-blue-50 border-blue-200 text-blue-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </label>
              <div className="text-sm text-gray-700 bg-gray-50 px-4 py-3 rounded-md border border-gray-200 whitespace-pre-wrap">
                {task.description}
              </div>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </label>
              <div className="text-sm text-gray-700 bg-amber-50 px-4 py-3 rounded-md border border-amber-200 whitespace-pre-wrap">
                {task.notes}
              </div>
            </div>
          )}

          {/* Progress */}
          {task.completion_percentage !== undefined && task.completion_percentage > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Progress</span>
                <span className="text-blue-600">{task.completion_percentage}%</span>
              </label>
              <Progress value={task.completion_percentage} className="h-2" />
            </div>
          )}

          {/* Created Date */}
          {task.createdAt && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Created on {task.createdAt}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
