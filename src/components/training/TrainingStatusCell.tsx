
import React from "react";
import { TrainingCell, TrainingStatus } from "@/types/training";
import { 
  CheckCircle2, Clock, XCircle, CircleDashed, 
  AlertCircle, CalendarClock, Trophy
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TrainingStatusCellProps {
  data: TrainingCell;
  title: string;
  onClick?: () => void;
}

const getStatusColor = (status: TrainingStatus): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'in-progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'expired':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'not-started':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusIcon = (status: TrainingStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'in-progress':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'expired':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'not-started':
      return <CircleDashed className="h-4 w-4 text-gray-600" />;
    default:
      return <CircleDashed className="h-4 w-4 text-gray-600" />;
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

const TrainingStatusCell: React.FC<TrainingStatusCellProps> = ({ 
  data, 
  title,
  onClick 
}) => {
  const { status, completionDate, expiryDate, score, maxScore } = data;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "p-2 border rounded-md flex flex-col items-center justify-center min-h-[70px] min-w-[70px] cursor-pointer transition-colors",
              getStatusColor(status),
              "hover:opacity-90"
            )}
            onClick={onClick}
          >
            <div className="mb-1">
              {getStatusIcon(status)}
            </div>
            <div className="text-xs font-medium capitalize">
              {status.replace('-', ' ')}
            </div>
            {score !== undefined && maxScore !== undefined && (
              <div className="flex items-center text-xs mt-1">
                <Trophy className="h-3 w-3 mr-0.5" />
                {score}/{maxScore}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3 max-w-[220px]">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="font-medium">Status:</span> 
              <span className={cn(
                "capitalize px-1.5 py-0.5 rounded",
                status === 'completed' && "bg-green-100 text-green-700",
                status === 'in-progress' && "bg-blue-100 text-blue-700",
                status === 'expired' && "bg-red-100 text-red-700",
                status === 'not-started' && "bg-gray-100 text-gray-700"
              )}>
                {status.replace('-', ' ')}
              </span>
            </p>
            {completionDate && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span className="font-medium">Completed:</span> {formatDate(completionDate)}
              </p>
            )}
            {expiryDate && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                <span className="font-medium">Expires:</span> {formatDate(expiryDate)}
              </p>
            )}
            {score !== undefined && maxScore !== undefined && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                <span className="font-medium">Score:</span> {score}/{maxScore}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TrainingStatusCell;
