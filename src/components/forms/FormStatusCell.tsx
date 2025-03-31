
import React from "react";
import { CheckCircle2, Clock, XCircle, CircleDashed, CheckCircle } from "lucide-react";
import { FormCell } from "@/types/form";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FormStatusCellProps {
  data: FormCell;
  title: string;
  onClick: () => void;
}

const FormStatusCell: React.FC<FormStatusCellProps> = ({ data, title, onClick }) => {
  // Determine the status icon and color
  const getStatusDetails = () => {
    switch (data.status) {
      case "completed":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          color: "bg-green-50 border-green-200",
          text: "Completed",
          textColor: "text-green-700"
        };
      case "approved":
        return {
          icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
          color: "bg-blue-50 border-blue-200",
          text: "Approved",
          textColor: "text-blue-700"
        };
      case "in-progress":
        return {
          icon: <Clock className="h-4 w-4 text-amber-600" />,
          color: "bg-amber-50 border-amber-200",
          text: "In Progress",
          textColor: "text-amber-700"
        };
      case "rejected":
        return {
          icon: <XCircle className="h-4 w-4 text-red-600" />,
          color: "bg-red-50 border-red-200",
          text: "Rejected",
          textColor: "text-red-700"
        };
      default:
        return {
          icon: <CircleDashed className="h-4 w-4 text-gray-600" />,
          color: "bg-gray-50 border-gray-200",
          text: "Not Started",
          textColor: "text-gray-700"
        };
    }
  };
  
  const { icon, color, text, textColor } = getStatusDetails();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onClick}
            className={`p-2 border rounded-md ${color} flex flex-col items-center justify-center min-h-[70px] min-w-[70px] w-full transition-colors hover:bg-opacity-75 cursor-pointer`}
          >
            {icon}
            <div className={`text-xs font-medium ${textColor} mt-1`}>
              {text}
            </div>
            {data.lastUpdated && (
              <div className="text-[10px] text-gray-500 mt-1">
                {format(new Date(data.lastUpdated), "MMM d, yyyy")}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-bold">{title}</div>
            <div className="text-xs mt-1">Status: {text}</div>
            {data.completionDate && (
              <div className="text-xs">
                Completed: {format(new Date(data.completionDate), "PPP")}
              </div>
            )}
            {data.expiryDate && (
              <div className="text-xs">
                Expires: {format(new Date(data.expiryDate), "PPP")}
              </div>
            )}
            {data.comments && (
              <div className="text-xs mt-1 max-w-[200px] text-red-500">
                {data.comments}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FormStatusCell;
