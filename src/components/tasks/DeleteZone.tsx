import React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteZoneProps {
  isVisible: boolean;
  isActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const DeleteZone: React.FC<DeleteZoneProps> = ({
  isVisible,
  isActive,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  if (!isVisible) return null;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex-shrink-0 w-[200px] h-full min-h-[500px] rounded-lg border-2 border-dashed",
        "flex flex-col items-center justify-center gap-3 transition-all duration-200",
        "animate-in fade-in slide-in-from-left-5 z-10",
        isActive
          ? "bg-red-100 border-red-500 scale-105"
          : "bg-red-50 border-red-300"
      )}
    >
      <Trash2 
        className={cn(
          "transition-all duration-200",
          isActive ? "h-12 w-12 text-red-600" : "h-10 w-10 text-red-400"
        )}
      />
      <div className="text-center px-4">
        <p className={cn(
          "font-semibold transition-colors",
          isActive ? "text-red-700" : "text-red-500"
        )}>
          Drop here to
        </p>
        <p className={cn(
          "font-semibold transition-colors",
          isActive ? "text-red-700" : "text-red-500"
        )}>
          delete task
        </p>
      </div>
      {isActive && (
        <p className="text-xs text-red-600 animate-pulse">
          Release to delete
        </p>
      )}
    </div>
  );
};

export default DeleteZone;
