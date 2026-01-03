import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, PlayCircle, Clock } from "lucide-react";

interface ActivityStatusButtonProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export const ActivityStatusButton = ({
  status,
  onStatusChange,
  disabled = false,
}: ActivityStatusButtonProps) => {
  const handleStartActivity = () => {
    onStatusChange("in-progress");
  };

  const handleCompleteActivity = () => {
    onStatusChange("completed");
  };

  if (status === "completed") {
    return (
      <Badge variant="custom" className="bg-green-500 hover:bg-green-600 text-white">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Completed
      </Badge>
    );
  }

  if (status === "in-progress") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="custom" className="bg-blue-500 hover:bg-blue-600 text-white">
          <PlayCircle className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
        <Button
          size="sm"
          onClick={handleCompleteActivity}
          disabled={disabled}
          className="h-7"
        >
          Mark Complete
        </Button>
      </div>
    );
  }

  // pending or active
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleStartActivity}
      disabled={disabled}
      className="h-7"
    >
      <Clock className="w-3 h-3 mr-1" />
      Start Activity
    </Button>
  );
};
