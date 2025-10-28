
import React from "react";
import { 
  Clock, Tag, AlertCircle, User, Check, 
  CheckCircle, CircleAlert, Circle
} from "lucide-react";
import { Task } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <CircleAlert className="h-4 w-4 text-red-500" />;
    case 'high':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'medium':
      return <Circle className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false }) => {
  return (
    <div 
      className={cn(
        "bg-white p-3 rounded-md shadow-sm border border-gray-200 cursor-grab",
        "hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-md",
        "transform transition-transform active:scale-95"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-gray-800 text-sm truncate">{task.title}</div>
        <div className={cn(
          "text-xs font-medium rounded-full px-2 py-0.5",
          getPriorityColor(task.priority)
        )}>
          <div className="flex items-center space-x-1">
            {getPriorityIcon(task.priority)}
            <span className="capitalize">{task.priority}</span>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex justify-between items-center mb-2">
        {task.dueDate && (
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            <span>{task.dueDate}</span>
          </div>
        )}
        
        {task.clientName && (
          <div className="flex items-center text-xs text-gray-500">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[100px]">{task.clientName}</span>
          </div>
        )}
      </div>
      
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs py-0 px-1.5 bg-gray-50">
              <Tag className="h-2.5 w-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="outline" className="text-xs py-0 px-1.5 bg-gray-50">
              +{task.tags.length - 2}
            </Badge>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex items-center gap-1">
            {task.assignees.slice(0, 2).map((assignee, index) => (
              <Avatar key={index} className="h-5 w-5 border border-white">
                <AvatarFallback className="text-[10px] bg-blue-100">
                  {assignee.first_name[0]}{assignee.last_name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 2 && (
              <span className="text-xs text-gray-500 ml-1">
                +{task.assignees.length - 2}
              </span>
            )}
            <span className="text-xs text-gray-600 ml-1 truncate max-w-[100px]">
              {task.assignees.length === 1 
                ? `${task.assignees[0].first_name} ${task.assignees[0].last_name}`
                : `${task.assignees.length} assignees`
              }
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
            <span className="text-xs text-gray-600 truncate max-w-[120px]">{task.assignee}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-400">Unassigned</div>
        )}
        
        {task.status === 'done' && (
          <div className="flex items-center text-xs text-green-600">
            <Check className="h-3 w-3 mr-1" />
            <span>Complete</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
