
import React from "react";
import { TaskColumn as TaskColumnType, Task } from "@/types/task";
import TaskCard from "./TaskCard";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";

interface TaskColumnProps {
  column: TaskColumnType;
  onDragStart: (e: React.DragEvent, taskId: string, sourceColumn: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetColumn: string) => void;
  onAddTask: (columnId: string) => void;
  onTaskClick?: (task: Task) => void;
  onDragEnd?: () => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ 
  column, 
  onDragStart, 
  onDragOver, 
  onDrop,
  onAddTask,
  onTaskClick,
  onDragEnd
}) => {
  return (
    <div 
      className="flex flex-col h-full min-w-[280px] bg-gray-50 rounded-md"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className={cn(
        "px-3 py-2 font-semibold text-gray-700 rounded-t-md flex justify-between items-center",
        column.color
      )}>
        <div className="flex items-center">
          <span>{column.title}</span>
          <span className="ml-2 bg-white text-gray-600 text-xs rounded-full px-2 py-0.5">
            {column.tasks.length}
          </span>
        </div>
        <button 
          className="text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
          onClick={() => onAddTask(column.id)}
        >
          <PlusCircle className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[500px]">
        {column.tasks.map(task => (
          <div 
            key={task.id}
            draggable
            onDragStart={(e) => onDragStart(e, task.id, column.id)}
            onDragEnd={onDragEnd}
          >
            <TaskCard 
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskColumn;
