
import React, { useState, useEffect } from "react";
import { Search, Filter, GraduationCap, CheckCircle, Clock, Calendar, ChevronRight, Download, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { toast } from "sonner";
import { 
  getTrainingMatrix, 
  mockTrainings, 
  filterTrainingsByCategory,
} from "@/data/mockTrainingData";
import { Training, TrainingStatus, TrainingCategory, TrainingCell } from "@/types/training";
import TrainingStatusCell from "@/components/training/TrainingStatusCell";
import TrainingCertificateView from "@/components/training/TrainingCertificateView";
import TrainingExportUser from "@/components/training/TrainingExportUser";
import { CustomButton } from "@/components/ui/CustomButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Upcoming scheduled training events - this would come from the API in a real implementation
const mockScheduledTraining = [
  {
    id: "s1",
    title: "Advanced Wound Care",
    date: addDays(new Date(), 3),
    time: "10:00 AM - 12:00 PM",
    location: "Main Training Room",
    type: "In-person"
  },
  {
    id: "s2",
    title: "Medication Refresher Course",
    date: addDays(new Date(), 7),
    time: "2:00 PM - 4:00 PM",
    location: "Online Webinar",
    type: "Virtual"
  }
];

const CarerTraining: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TrainingCategory | 'all'>('all');
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TrainingStatus | 'all'>('all');
  const [carerId, setCarerId] = useState("staff-1"); // In real app, this would be dynamic based on logged in user

  // Get training matrix data
  const matrixData = getTrainingMatrix();
  const currentStaffMember = matrixData.staffMembers.find(staff => staff.id === carerId) || matrixData.staffMembers[0];
  
  // Filter trainings for current carer
  const carerTrainings = matrixData.trainings.map(training => {
    const trainingCell = matrixData.data[carerId]?.[training.id] || {
      status: 'not-started' as TrainingStatus
    };
    
    return {
      ...training,
      status: trainingCell.status,
      completionDate: trainingCell.completionDate,
      expiryDate: trainingCell.expiryDate,
      score: trainingCell.score,
      maxScore: trainingCell.maxScore || 100
    };
  });

  // Calculate completion statistics
  const completedCount = carerTrainings.filter(t => t.status === 'completed').length;
  const inProgressCount = carerTrainings.filter(t => t.status === 'in-progress').length;
  const expiredCount = carerTrainings.filter(t => t.status === 'expired').length;
  const totalCount = carerTrainings.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  
  // Filter trainings based on search, status, and category
  const filteredTrainings = carerTrainings.filter(training => {
    const searchMatches = 
      training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      training.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const categoryMatches = activeTab === 'all' || training.category === activeTab;
    const statusMatches = selectedStatus === 'all' || training.status === selectedStatus;
    
    return searchMatches && categoryMatches && statusMatches;
  });
  
  // Handle enrollment in a training course
  const handleEnrollInTraining = (training: Training) => {
    toast.success(`Enrolled in ${training.title}`, {
      description: "You have been successfully enrolled in this training course"
    });
    setSelectedTraining(null);
  };

  // Handle viewing certificate
  const handleViewCertificate = (training: Training) => {
    setSelectedTraining(training);
    setShowCertificateDialog(true);
  };

  // Get the appropriate status badge class
  const getStatusColor = (status: TrainingStatus): string => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "in-progress": return "bg-blue-100 text-blue-700";
      case "expired": return "bg-red-100 text-red-700";
      case "not-started": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };
  
  // Calculate training progress percentage
  const calculateTrainingProgress = (training: Training): number => {
    switch (training.status) {
      case "completed": return 100;
      case "in-progress": 
        // For in-progress trainings, we can simulate progress from score or set a default
        return training.score ? (training.score / (training.maxScore || 100)) * 100 : 60;
      case "expired": return 100; // It was completed but expired
      case "not-started": return 0;
      default: return 0;
    }
  };

  // Determine if a course is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = parseISO(expiryDate);
    const thirtyDaysFromNow = addDays(today, 30);
    return isAfter(expiry, today) && isBefore(expiry, thirtyDaysFromNow);
  };

  // Format a date string
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Training</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Training Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">{completionPercentage}%</span>
              <span className="text-sm text-gray-500">Overall Completion</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-green-600 font-bold text-xl">{completedCount}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-blue-600 font-bold text-xl">{inProgressCount}</div>
                <div className="text-xs text-gray-600">In Progress</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-md">
                <div className="text-amber-600 font-bold text-xl">{expiredCount}</div>
                <div className="text-xs text-gray-600">Expired</div>
              </div>
            </div>

            <TrainingExportUser trainings={carerTrainings} staffMember={currentStaffMember} />
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Upcoming Training</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockScheduledTraining.map((training) => (
              <div key={training.id} className="flex justify-between items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{training.title}</h3>
                    <p className="text-sm text-gray-500">
                      {format(training.date, "EEEE, MMMM d")} • {training.time}
                    </p>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {training.type}
                      </Badge>
                      <span className="mx-1">•</span>
                      {training.location}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">Add to Calendar</Button>
              </div>
            ))}
            
            {mockScheduledTraining.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">No upcoming training scheduled.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (TrainingCategory | 'all'))}>
          <TabsList className="mb-2 sm:mb-0">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="mandatory">Mandatory</TabsTrigger>
            <TabsTrigger value="specialized">Specialized</TabsTrigger>
            <TabsTrigger value="optional">Optional</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 sm:w-[250px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-8"
              placeholder="Search courses" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as (TrainingStatus | 'all'))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrainings.length > 0 ? (
          filteredTrainings.map((training) => (
            <Card 
              key={training.id} 
              className="flex flex-col cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => setSelectedTraining(training)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{training.title}</CardTitle>
                  <div className="flex-shrink-0">
                    <TrainingStatusCell 
                      data={{
                        status: training.status,
                        completionDate: training.completionDate,
                        expiryDate: training.expiryDate,
                        score: training.score,
                        maxScore: training.maxScore
                      }}
                      title={training.title}
                    />
                  </div>
                </div>
                <Badge variant="outline" className="w-fit mt-1">
                  {training.category.charAt(0).toUpperCase() + training.category.slice(1)}
                </Badge>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-500 mb-3">{training.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Progress</div>
                    <div className="flex items-center gap-2">
                      <Progress value={calculateTrainingProgress(training)} className="h-2 flex-grow" />
                      <span className="text-sm font-medium">{calculateTrainingProgress(training)}%</span>
                    </div>
                  </div>
                  
                  {training.completionDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Completed on {formatDate(training.completionDate)}</span>
                    </div>
                  )}
                  
                  {training.expiryDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className={isExpiringSoon(training.expiryDate) ? "text-amber-600 font-medium" : ""}>
                        {isExpiringSoon(training.expiryDate) ? "Expires soon: " : "Valid until: "}
                        {formatDate(training.expiryDate)}
                      </span>
                    </div>
                  )}

                  {training.validFor && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Valid for {training.validFor} months</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{training.validFor ? `${training.validFor} months` : "No expiry"}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-1 md:col-span-3 py-12 text-center bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No training courses found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery ? "Try a different search term" : "No training courses match the current filter"}
            </p>
          </div>
        )}
      </div>
      
      {/* Training Details Dialog */}
      <Dialog open={!!selectedTraining && !showCertificateDialog} onOpenChange={(open) => !open && setSelectedTraining(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Training Course Details</DialogTitle>
          </DialogHeader>
          {selectedTraining && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{selectedTraining.title}</h2>
                  <TrainingStatusCell 
                    data={{
                      status: selectedTraining.status,
                      completionDate: selectedTraining.completionDate,
                      expiryDate: selectedTraining.expiryDate,
                      score: selectedTraining.score,
                      maxScore: selectedTraining.maxScore
                    }}
                    title={selectedTraining.title}
                  />
                </div>
                <p className="text-gray-600">{selectedTraining.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Category</div>
                  <div className="font-medium capitalize">{selectedTraining.category}</div>
                </div>
                <div>
                  <div className="text-gray-500">Valid For</div>
                  <div className="font-medium">{selectedTraining.validFor || "N/A"} {selectedTraining.validFor ? "months" : ""}</div>
                </div>
                {selectedTraining.completionDate && (
                  <div>
                    <div className="text-gray-500">Completed On</div>
                    <div className="font-medium">{formatDate(selectedTraining.completionDate)}</div>
                  </div>
                )}
                {selectedTraining.expiryDate && (
                  <div>
                    <div className="text-gray-500">Valid Until</div>
                    <div className={`font-medium ${isExpiringSoon(selectedTraining.expiryDate) ? "text-amber-600" : ""}`}>
                      {formatDate(selectedTraining.expiryDate)}
                    </div>
                  </div>
                )}
                {selectedTraining.score !== undefined && (
                  <div>
                    <div className="text-gray-500">Score</div>
                    <div className="font-medium">{selectedTraining.score} / {selectedTraining.maxScore}</div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Completion Progress</div>
                <div className="flex items-center gap-2 mb-3">
                  <Progress value={calculateTrainingProgress(selectedTraining)} className="h-2 flex-grow" />
                  <span className="text-sm font-medium">{calculateTrainingProgress(selectedTraining)}%</span>
                </div>
              </div>
              
              <DialogFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedTraining(null)}>Close</Button>
                
                {selectedTraining.status === 'completed' && (
                  <Button 
                    className="gap-2"
                    onClick={() => handleViewCertificate(selectedTraining)}
                  >
                    <Award className="h-4 w-4" />
                    View Certificate
                  </Button>
                )}
                
                {selectedTraining.status === 'expired' && (
                  <Button className="gap-2">
                    <Clock className="h-4 w-4" />
                    Renew Training
                  </Button>
                )}
                
                {(selectedTraining.status === 'not-started' || selectedTraining.status === 'in-progress') && (
                  <Button 
                    className="gap-2"
                    onClick={() => handleEnrollInTraining(selectedTraining)}
                  >
                    {selectedTraining.status === 'in-progress' ? (
                      <>
                        <Clock className="h-4 w-4" />
                        Continue Training
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-4 w-4" />
                        Start Training
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Certificate Dialog */}
      <Dialog open={showCertificateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCertificateDialog(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Training Certificate</DialogTitle>
          </DialogHeader>
          {selectedTraining && (
            <div className="space-y-4">
              <TrainingCertificateView
                training={selectedTraining}
                staffName={currentStaffMember.name}
                staffId={currentStaffMember.id}
              />
              
              <DialogFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCertificateDialog(false)}>Close</Button>
                <Button 
                  className="gap-2"
                  onClick={() => {
                    if (selectedTraining) {
                      try {
                        // Import dynamically to avoid loading jsPDF on initial page load
                        import('@/utils/trainingCertificateGenerator').then(module => {
                          module.generateTrainingCertificate(selectedTraining, currentStaffMember);
                          toast.success("Certificate downloaded successfully");
                        });
                      } catch (error) {
                        console.error("Failed to download certificate:", error);
                        toast.error("Failed to download certificate");
                      }
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download Certificate
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarerTraining;
