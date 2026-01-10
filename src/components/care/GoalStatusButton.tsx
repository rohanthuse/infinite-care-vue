import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, PlayCircle, Circle } from "lucide-react";
import { useState, useEffect } from "react";

interface GoalStatusButtonProps {
  status: string;
  progress?: number;
  onStatusChange: (newStatus: string, progress?: number) => void;
  disabled?: boolean;
}

export const GoalStatusButton = ({
  status,
  progress = 0,
  onStatusChange,
  disabled = false,
}: GoalStatusButtonProps) => {
  const [localProgress, setLocalProgress] = useState(progress);

  // Sync localProgress when external progress prop changes (e.g., after refetch)
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  const handleStartGoal = () => {
    onStatusChange("in-progress", 25);
  };

  const handleCompleteGoal = () => {
    onStatusChange("completed", 100);
  };

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setLocalProgress(newProgress);
  };

  const handleProgressCommit = (value: number[]) => {
    const newProgress = value[0];
    onStatusChange("in-progress", newProgress);
  };

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="custom" className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      </div>
    );
  }

  if (status === "in-progress") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="custom" className="bg-blue-500 hover:bg-blue-600 text-white">
            <PlayCircle className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
          <Button
            size="sm"
            onClick={handleCompleteGoal}
            disabled={disabled}
            className="h-7"
          >
            Mark Complete
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Adjust Progress</span>
            <span className="font-medium">{localProgress}%</span>
          </div>
          <Slider
            value={[localProgress]}
            onValueChange={handleProgressChange}
            onValueCommit={handleProgressCommit}
            max={100}
            step={5}
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // not-started
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleStartGoal}
      disabled={disabled}
      className="h-7"
    >
      <Circle className="w-3 h-3 mr-1" />
      Start Goal
    </Button>
  );
};
