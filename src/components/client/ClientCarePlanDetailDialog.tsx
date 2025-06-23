
import React, { useState } from "react";
import { X, Download, Printer } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CarePlanWithDetails } from "@/hooks/useCarePlanData";
import { useToast } from "@/hooks/use-toast";

interface ClientCarePlanDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carePlan: CarePlanWithDetails;
}

export const ClientCarePlanDetailDialog: React.FC<ClientCarePlanDetailDialogProps> = ({
  open,
  onOpenChange,
  carePlan,
}) => {
  const [activeTab, setActiveTab] = useState("goals");
  const { toast } = useToast();
  
  const handleExport = () => {
    toast({
      title: "Export Care Plan",
      description: "Your care plan has been prepared for download.",
    });
    // Here you would implement actual export functionality
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print Care Plan",
      description: "Print dialog opened.",
    });
  };
  
  // Function to render goal status badge
  const renderGoalStatus = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>;
      case "in-progress":
        return <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">In Progress</span>;
      case "not-started":
        return <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Not Started</span>;
      default:
        return <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Unknown</span>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-amber-600';
    return 'bg-gray-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{carePlan.title}</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {new Date(carePlan.updated_at).toLocaleDateString()} • Care Provider: {carePlan.provider_name}
              </p>
              {carePlan.display_id && (
                <p className="text-sm text-gray-500">Plan ID: {carePlan.display_id}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={handleExport}>
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Goals progress:</span>
              <div className="flex-1 md:w-48">
                <Progress value={carePlan.goals_progress || 0} className="h-2" />
              </div>
              <span className="text-sm font-medium">{carePlan.goals_progress || 0}%</span>
            </div>
            {carePlan.review_date && (
              <div>
                <Badge>Review Date: {new Date(carePlan.review_date).toLocaleDateString()}</Badge>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="sticky top-0 z-10 bg-white border-b px-6">
              <TabsList className="w-full justify-start gap-2 py-2">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Goals Tab */}
            <TabsContent value="goals" className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Your Care Plan Goals</h3>
                <p className="text-gray-600">
                  These goals have been set to help you achieve better health outcomes. 
                  Track your progress and work with your care team to meet these targets.
                </p>
                
                {carePlan.goals && carePlan.goals.length > 0 ? (
                  carePlan.goals.map((goal) => (
                    <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{goal.description}</h4>
                            {renderGoalStatus(goal.status)}
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-1">
                              <Progress 
                                value={goal.progress || 0} 
                                className={`h-2`}
                              />
                            </div>
                            <span className="text-sm font-medium">{goal.progress || 0}%</span>
                          </div>
                          {goal.notes && (
                            <p className="text-sm text-gray-600 mt-2">{goal.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No goals have been set for this care plan yet.</p>
                )}
              </div>
            </TabsContent>
            
            {/* Medications Tab */}
            <TabsContent value="medications" className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Your Medications</h3>
                <p className="text-gray-600">
                  This is your current medication plan. Always follow the dosage instructions 
                  and consult your healthcare provider before making any changes.
                </p>
                
                <div className="space-y-4">
                  {carePlan.medications && carePlan.medications.length > 0 ? (
                    carePlan.medications.map((med) => (
                      <div key={med.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{med.name}</h4>
                            <p className="text-sm text-gray-600">{med.dosage}, {med.frequency}</p>
                          </div>
                          <div className="text-sm text-gray-600">
                            Started: {new Date(med.start_date).toLocaleDateString()}
                            {med.end_date && (
                              <span> • Ends: {new Date(med.end_date).toLocaleDateString()}</span>
                            )}
                            <span> • Status: {med.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No medications have been prescribed in this care plan yet.</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Activities Tab */}
            <TabsContent value="activities" className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Your Activities</h3>
                <p className="text-gray-600">
                  These activities are designed to help you achieve your care goals. 
                  Try to maintain consistency with these recommended activities.
                </p>
                
                <div className="space-y-4">
                  {carePlan.activities && carePlan.activities.length > 0 ? (
                    carePlan.activities.map((activity) => (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium">{activity.name}</h4>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                        <div className="flex items-center mt-2 gap-2">
                          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {activity.frequency}
                          </span>
                          <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No activities have been scheduled in this care plan yet.</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Notes Tab */}
            <TabsContent value="notes" className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Care Plan Notes</h3>
                <p className="text-gray-600">
                  These are notes from your care team regarding your progress and treatment.
                </p>
                
                <div className="space-y-4">
                  {carePlan.notes ? (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Care Plan Notes</h4>
                          <p className="text-sm text-gray-500">Last updated: {new Date(carePlan.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-700 whitespace-pre-wrap">{carePlan.notes}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No notes have been added to this care plan yet.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
