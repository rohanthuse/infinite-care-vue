import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Upload, Target } from "lucide-react";
import { CarerTrainingRecord } from "@/hooks/useCarerTraining";

interface TrainingStatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  training: CarerTrainingRecord;
  onUpdate: (updates: any) => void;
  isUpdating: boolean;
}

export function TrainingStatusUpdateDialog({ 
  isOpen, 
  onClose, 
  training, 
  onUpdate, 
  isUpdating 
}: TrainingStatusUpdateDialogProps) {
  const [activeTab, setActiveTab] = useState("status");
  const [progressPercentage, setProgressPercentage] = useState(training.progress_percentage || 0);
  const [timeSpent, setTimeSpent] = useState(training.time_spent_minutes || 0);
  const [status, setStatus] = useState<CarerTrainingRecord['status']>(training.status);
  const [trainingNotes, setTrainingNotes] = useState(training.training_notes || "");
  const [reflectionNotes, setReflectionNotes] = useState(training.reflection_notes || "");
  const [sessionTime, setSessionTime] = useState(0);

  const statusOptions = [
    { value: 'not-started', label: 'Not Started', color: 'secondary' },
    { value: 'in-progress', label: 'In Progress', color: 'warning' },
    { value: 'paused', label: 'Paused', color: 'destructive' },
    { value: 'under-review', label: 'Under Review', color: 'info' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'failed', label: 'Failed', color: 'destructive' },
    { value: 'renewal-required', label: 'Renewal Required', color: 'warning' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates = {
      recordId: training.id,
      status: status,
      progress_percentage: progressPercentage,
      time_spent_minutes: timeSpent + sessionTime,
      training_notes: trainingNotes,
      reflection_notes: reflectionNotes,
    };

    onUpdate(updates);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Update Training Status - {training.training_course?.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="evidence">Certification</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Training Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as CarerTrainingRecord['status'])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <Badge 
                      variant={
                        training.status === 'completed' ? 'default' :
                        training.status === 'in-progress' ? 'secondary' :
                        training.status === 'expired' ? 'destructive' : 'outline'
                      }
                    >
                      {training.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Training Information</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <Badge variant="outline">{training.training_course?.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Max Score</p>
                    <p className="text-sm text-muted-foreground">{training.training_course?.max_score}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Current Score</p>
                    <p className="text-sm text-muted-foreground">{training.score || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress Percentage: {progressPercentage}%</Label>
                  <Progress value={progressPercentage} className="w-full" />
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={(e) => setProgressPercentage(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Total Time Spent
                    </Label>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <p className="text-lg font-semibold">{formatTime(timeSpent)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTime">Add Session Time (minutes)</Label>
                    <Input
                      id="sessionTime"
                      type="number"
                      min="0"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(Number(e.target.value))}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be added to your total time
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium mb-2">Progress Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Completion</p>
                      <p className="font-semibold">{progressPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time Invested</p>
                      <p className="font-semibold">{formatTime(timeSpent + sessionTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant="outline" className="text-xs">{status}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Access</p>
                      <p className="font-semibold text-xs">
                        {training.last_accessed ? new Date(training.last_accessed).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trainingNotes" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Training Notes
                  </Label>
                  <Textarea
                    id="trainingNotes"
                    value={trainingNotes}
                    onChange={(e) => setTrainingNotes(e.target.value)}
                    placeholder="Add notes about your training progress, challenges, or insights..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reflectionNotes">Reflection & Learning</Label>
                  <Textarea
                    id="reflectionNotes"
                    value={reflectionNotes}
                    onChange={(e) => setReflectionNotes(e.target.value)}
                    placeholder="Reflect on what you've learned, how it applies to your work, and areas for improvement..."
                    rows={4}
                  />
                </div>

                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Reflection Prompts</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• What key concepts did you learn in this training?</li>
                    <li>• How will you apply this knowledge in your daily work?</li>
                    <li>• What challenges did you face during the training?</li>
                    <li>• What additional support or resources do you need?</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Upload Certification</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload certificates, screenshots, or other certification documents of your training completion
                  </p>
                  <Button type="button" variant="outline">
                    Choose Files
                  </Button>
                </div>

                {training.evidence_files && training.evidence_files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Certifications</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {training.evidence_files.map((file: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Training'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}