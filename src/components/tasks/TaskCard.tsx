
import React from "react";
import { 
  Clock, Tag, AlertCircle, User, Check, 
  CheckCircle, CircleAlert, Circle, Pencil
} from "lucide-react";
import { Task } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
  onEdit?: (task: Task) => void;
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <CircleAlert className="h-4 w-4 text-red-500 dark:text-red-400" />;
    case 'high':
      return <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />;
    case 'medium':
      return <Circle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
    case 'low':
      return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
    case 'high':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
    case 'low':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false, onClick, onEdit }) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-card text-card-foreground p-3 rounded-md shadow-sm border border-border",
        onClick ? "cursor-pointer hover:shadow-lg hover:border-primary/50" : "cursor-grab",
        "hover:shadow-md transition-all",
        isDragging && "opacity-50 shadow-md",
        "transform transition-transform active:scale-95"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-foreground text-sm truncate flex-1">{task.title}</div>
        <div className="flex items-center gap-1 ml-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="hover:bg-muted rounded p-1 transition-colors flex-shrink-0"
              aria-label="Edit task"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <div className={cn(
            "text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0",
            getPriorityColor(task.priority)
          )}>
            <div className="flex items-center space-x-1">
              {getPriorityIcon(task.priority)}
              <span className="capitalize">{task.priority}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex justify-between items-center mb-2">
        {task.dueDate && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span>{task.dueDate}</span>
          </div>
        )}
        
        {task.clientName && (
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[100px]">{task.clientName}</span>
          </div>
        )}
      </div>
      
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs py-0 px-1.5 bg-muted">
              <Tag className="h-2.5 w-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="outline" className="text-xs py-0 px-1.5 bg-muted">
              +{task.tags.length - 2}
            </Badge>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5 border border-background">
              <AvatarFallback className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                {task.assignees[0].first_name[0]}{task.assignees[0].last_name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {task.assignees[0].first_name}
              {task.assignees.length > 1 && (
                <span className="text-muted-foreground/70"> +{task.assignees.length - 1}</span>
              )}
            </span>
          </div>
        ) : task.assignee ? (
          <div className="flex items-center">
            <Avatar className="h-5 w-5 mr-1">
              <AvatarImage src={task.assigneeAvatar} alt={task.assignee} />
              <AvatarFallback className="text-[10px]">
                {task.assignee.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{task.assignee}</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground/70">Unassigned</div>
        )}
        
        {task.status === 'done' && (
          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
            <Check className="h-3 w-3 mr-1" />
            <span>Complete</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
