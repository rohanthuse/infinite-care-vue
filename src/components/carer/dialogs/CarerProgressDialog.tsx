
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Activity, Target } from "lucide-react";
import { format } from "date-fns";

interface GoalOption {
  id: string;
  title: string;
  target: string;
}

interface CarerProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  client: {
    id: string;
    name: string;
  };
}

export const CarerProgressDialog: React.FC<CarerProgressDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  client
}) => {
  // Mock goals - in a real app these would be fetched from the API
  const goals: GoalOption[] = [
    { id: "g1", title: "Improve mobility", target: "Walk unassisted for 15 minutes" },
    { id: "g2", title: "Medication adherence", target: "100% medication compliance" },
    { id: "g3", title: "Blood glucose management", target: "Maintain levels between 80-130 mg/dL" },
  ];

  const [progressData, setProgressData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    goalId: '',
    progressValue: 50,
    notes: '',
    challenges: '',
    nextSteps: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProgressData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProgressData(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (value: number[]) => {
    setProgressData(prev => ({ ...prev, progressValue: value[0] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const carerName = localStorage.getItem("carerName") || "Carer";
    
    // Find the selected goal details to include in submission
    const selectedGoal = goals.find(g => g.id === progressData.goalId);
    
    onSubmit({
      ...progressData,
      goalTitle: selectedGoal?.title || "",
      goalTarget: selectedGoal?.target || "",
      clientId: client.id,
      clientName: client.name,
      updatedBy: carerName,
      timestamp: new Date().toISOString()
    });
    
    // Reset form after submission
    setProgressData({
      date: format(new Date(), 'yyyy-MM-dd'),
      goalId: '',
      progressValue: 50,
      notes: '',
      challenges: '',
      nextSteps: '',
    });
  };

  const selectedGoal = goals.find(g => g.id === progressData.goalId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Update Goal Progress</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={progressData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="goalId">Select Goal</Label>
            <Select 
              name="goalId" 
              value={progressData.goalId}
              onValueChange={(value) => handleSelectChange("goalId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedGoal && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm">
                <div className="flex items-center gap-1 text-blue-700">
                  <Target className="h-3.5 w-3.5" />
                  <span className="font-medium">Target:</span>
                </div>
                <div className="ml-5 text-blue-600">{selectedGoal.target}</div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="progressValue">Current Progress: {progressData.progressValue}%</Label>
            </div>
            <Slider 
              id="progressValue"
              min={0} 
              max={100} 
              step={5}
              value={[progressData.progressValue]}
              onValueChange={handleSliderChange}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Progress Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Describe current progress and observations"
              rows={3}
              value={progressData.notes}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="challenges">Challenges</Label>
            <Textarea
              id="challenges"
              name="challenges"
              placeholder="Any difficulties or barriers to progress"
              rows={2}
              value={progressData.challenges}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nextSteps">Next Steps</Label>
            <Textarea
              id="nextSteps"
              name="nextSteps"
              placeholder="Recommended next steps"
              rows={2}
              value={progressData.nextSteps}
              onChange={handleChange}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Progress</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
