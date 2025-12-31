import React, { useState } from "react";
import { Search, Filter, GraduationCap, CheckCircle, Clock, Calendar, ChevronRight, Download, Award, Loader2, PlayCircle, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { toast } from "sonner";
import { useCarerTraining } from "@/hooks/useCarerTraining";
import { useCarerTrainingActions } from "@/hooks/useCarerTrainingActions";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { TrainingStatusUpdateDialog } from "@/components/training/TrainingStatusUpdateDialog";
import { TrainingStatus, TrainingCategory } from "@/types/training";

const CarerTraining: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TrainingCategory | 'all'>('all');
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<TrainingStatus | 'all'>('all');
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'start' | 'complete' | null>(null);
  const [completionScore, setCompletionScore] = useState("");

  const { data: carerProfile } = useCarerProfile();
  const { trainingRecords, stats, isLoading, error } = useCarerTraining();
  const { updateTrainingStatus, enrollInTraining, isUpdating, isEnrolling } = useCarerTrainingActions();

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">My Training</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-2">Error loading training data</p>
            <p className="text-sm text-gray-500">{error.message}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter trainings based on search, status, and category
  const filteredTrainings = trainingRecords.filter(record => {
    const training = record.training_course;
    const searchMatches = 
      training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (training.description && training.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const categoryMatches = activeTab === 'all' || training.category === activeTab;
    const statusMatches = selectedStatus === 'all' || record.status === selectedStatus;
    
    return searchMatches && categoryMatches && statusMatches;
  });

  // Handle training actions
  const handleTrainingAction = async () => {
    if (!selectedTraining || !actionType) return;

    try {
      if (actionType === 'start') {
        await updateTrainingStatus.mutateAsync({
          recordId: selectedTraining.id,
          status: 'in-progress'
        });
      } else if (actionType === 'complete') {
        const score = completionScore ? parseInt(completionScore) : undefined;
        await updateTrainingStatus.mutateAsync({
          recordId: selectedTraining.id,
          status: 'completed',
          score
        });
      }
      setShowActionDialog(false);
      setSelectedTraining(null);
      setActionType(null);
      setCompletionScore("");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Handle enhanced training status update
  const handleEnhancedTrainingUpdate = async (updates: any) => {
    try {
      await updateTrainingStatus.mutateAsync(updates);
      setStatusUpdateDialogOpen(false);
      setSelectedTraining(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Get the appropriate status badge class
  const getStatusColor = (status: TrainingStatus): string => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
      case "in-progress": return "bg-blue-600 text-white";
      case "expired": return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
      case "not-started": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "paused": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
      case "under-review": return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      case "failed": return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
      case "renewal-required": return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getCategoryColor = (category: TrainingCategory): string => {
    switch (category) {
      case "core": return "bg-blue-600 text-white border-blue-700";
      case "mandatory": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800";
      case "specialized": return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800";
      case "optional": return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default: return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };
  
  // Calculate training progress percentage
  const calculateTrainingProgress = (record: any): number => {
    if (record.progress_percentage !== null && record.progress_percentage !== undefined) {
      return record.progress_percentage;
    }
    
    switch (record.status) {
      case "completed": return 100;
      case "in-progress": 
        return record.score && record.training_course?.max_score ? (record.score / record.training_course.max_score) * 100 : 60;
      case "expired": return 100; // It was completed but expired
      case "not-started": return 0;
      case "paused": return record.score && record.training_course?.max_score ? (record.score / record.training_course.max_score) * 100 : 30;
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

  const openActionDialog = (training: any, action: 'start' | 'complete') => {
    setSelectedTraining(training);
    setActionType(action);
    setShowActionDialog(true);
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">My Training</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showing {trainingRecords?.length || 0} training courses assigned to you
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Training Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">{stats.completionPercentage}%</span>
              <span className="text-sm text-gray-500">Overall Completion</span>
            </div>
            <Progress value={stats.completionPercentage} className="h-2" />
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                <div className="text-green-600 dark:text-green-400 font-bold text-xl">{stats.completedCount}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <div className="text-blue-600 dark:text-blue-400 font-bold text-xl">{stats.inProgressCount}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                <div className="text-amber-600 dark:text-amber-400 font-bold text-xl">{stats.expiredCount}</div>
                <div className="text-xs text-muted-foreground">Expired</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-2">Mandatory Training</div>
              <div className="flex justify-between">
                <span className="text-sm">{stats.mandatoryCompleted} of {stats.mandatoryTotal} completed</span>
                <span className="text-sm font-medium">
                  {stats.mandatoryTotal > 0 ? Math.round((stats.mandatoryCompleted / stats.mandatoryTotal) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Training Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCourses}</div>
                <div className="text-sm text-muted-foreground">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedCount}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.inProgressCount}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.pendingCount}</div>
                <div className="text-sm text-muted-foreground">Not Started</div>
              </div>
            </div>
            
            {stats.expiredCount > 0 && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-800 dark:text-red-300">
                    {stats.expiredCount} training course{stats.expiredCount !== 1 ? 's' : ''} expired
                  </span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Please renew expired training to maintain compliance.
                </p>
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
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="under-review">Under Review</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="renewal-required">Renewal Required</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrainings.length > 0 ? (
          filteredTrainings.map((record) => {
            const training = record.training_course;
            return (
              <Card 
                key={record.id} 
                className="flex flex-col cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => setSelectedTraining(record)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{training.title}</CardTitle>
                    <Badge 
                      variant="custom"
                      className={`text-xs ${getStatusColor(record.status)}`}
                    >
                      {record.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getCategoryColor(training.category)}>
                      {training.category.charAt(0).toUpperCase() + training.category.slice(1)}
                    </Badge>
                    {training.is_mandatory && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Required
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {training.description || 'No description available'}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Progress</div>
                      <div className="flex items-center gap-2">
                        <Progress value={calculateTrainingProgress(record)} className="h-2 flex-grow" />
                        <span className="text-sm font-medium">{calculateTrainingProgress(record)}%</span>
                      </div>
                    </div>
                    
                    {record.completion_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Completed on {formatDate(record.completion_date)}</span>
                      </div>
                    )}
                    
                    {record.expiry_date && (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className={isExpiringSoon(record.expiry_date) ? "text-amber-600 font-medium" : ""}>
                          {isExpiringSoon(record.expiry_date) ? "Expires soon: " : "Valid until: "}
                          {formatDate(record.expiry_date)}
                        </span>
                      </div>
                    )}

                    {training.valid_for_months && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Valid for {training.valid_for_months} months</span>
                      </div>
                    )}

                    {record.score && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span>Score: {record.score}/{training.max_score}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center text-sm text-gray-500">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>Assigned {formatDate(record.assigned_date)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTraining(record);
                          setStatusUpdateDialogOpen(true);
                        }}
                        disabled={isUpdating}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                      {record.status === 'not-started' && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            openActionDialog(record, 'start');
                          }}
                          disabled={isUpdating}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {record.status === 'in-progress' && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            openActionDialog(record, 'complete');
                          }}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-3 py-12 text-center bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {searchQuery || activeTab !== 'all' || selectedStatus !== 'all' 
                ? "No training courses found" 
                : "No training assigned yet"}
            </h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              {searchQuery || activeTab !== 'all' || selectedStatus !== 'all' 
                ? "Try adjusting your search or filters to see more results" 
                : "Training courses will appear here once they are assigned to you by your administrator. Contact your supervisor if you need access to specific training."}
            </p>
          </div>
        )}
      </div>
      
      {/* Basic Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'start' ? 'Start Training' : 'Complete Training'}
            </DialogTitle>
          </DialogHeader>
          {selectedTraining && selectedTraining.training_course && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedTraining.training_course.title}</h3>
                <p className="text-sm text-gray-600">{selectedTraining.training_course.description}</p>
              </div>
              
              {actionType === 'complete' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Score (Optional)</label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedTraining.training_course.max_score}
                    placeholder={`Enter score (0-${selectedTraining.training_course.max_score})`}
                    value={completionScore}
                    onChange={(e) => setCompletionScore(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Minimum required score: {selectedTraining.training_course.required_score}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTrainingAction}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {actionType === 'start' ? 'Starting...' : 'Completing...'}
                </>
              ) : (
                actionType === 'start' ? 'Start Training' : 'Mark Complete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Training Status Update Dialog */}
      {selectedTraining && (
        <TrainingStatusUpdateDialog
          isOpen={statusUpdateDialogOpen}
          onClose={() => {
            setStatusUpdateDialogOpen(false);
            setSelectedTraining(null);
          }}
          training={selectedTraining}
          onUpdate={handleEnhancedTrainingUpdate}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

export default CarerTraining;