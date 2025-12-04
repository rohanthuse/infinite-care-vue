import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Award, Book, Calendar, Plus, CheckCircle, Clock, AlertCircle, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import TrainingRecordDetailsDialog from "@/components/training/TrainingRecordDetailsDialog";
import { EditTrainingStatusDialog } from "@/components/training/EditTrainingStatusDialog";
import { useStaffTrainingById } from "@/hooks/useStaffTrainingById";
import { useStaffTrainingRecords } from "@/hooks/useStaffTrainingRecords";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { AssignTrainingDialog } from "@/components/training/AssignTrainingDialog";
import { useTrainingCourses } from "@/hooks/useTrainingCourses";
import { useTrainingManagement } from "@/hooks/useTrainingManagement";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CarerTrainingTabProps {
  carerId: string;
}

export const CarerTrainingTab: React.FC<CarerTrainingTabProps> = ({ carerId }) => {
  const [assignTrainingOpen, setAssignTrainingOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<typeof trainingRecords[0] | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editStatusDialogOpen, setEditStatusDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<typeof trainingRecords[0] | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: carerProfile } = useCarerProfileById(carerId);
  const branchId = carerProfile?.branch_id || "";

  const { trainingRecords = [], stats, isLoading, error } = useStaffTrainingById(
    carerId, 
    branchId
  );

  // Fetch training courses and existing records for the assign dialog
  const { data: trainingCourses = [] } = useTrainingCourses(branchId);
  const { records: existingRecords = [], updateRecord, isUpdating } = useStaffTrainingRecords(branchId);
  const { assignTraining, isAssigning } = useTrainingManagement(branchId);

  // Handler for assigning training
  const handleAssignTraining = (courseIds: string[], staffIds: string[]) => {
    courseIds.forEach(courseId => {
      assignTraining({ courseId, staffIds });
    });
    setAssignTrainingOpen(false);
  };

  // Delete training mutation
  const deleteTrainingMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('staff_training_records')
        .delete()
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both query keys to sync all views
      queryClient.invalidateQueries({ queryKey: ['staff-training-by-id', carerId] });
      queryClient.invalidateQueries({ queryKey: ['staff-training-records', branchId] });
      queryClient.invalidateQueries({ queryKey: ['carer-training'] });
      toast({
        title: "Training removed",
        description: "Training record has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove training: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteTraining = (recordId: string) => {
    if (confirm('Are you sure you want to remove this training record?')) {
      deleteTrainingMutation.mutate(recordId);
    }
  };

  const handleViewCertificate = (record: typeof trainingRecords[0]) => {
    setSelectedRecord(record);
    setDetailsDialogOpen(true);
  };

  const handleEditStatus = (record: typeof trainingRecords[0]) => {
    setRecordToEdit(record);
    setEditStatusDialogOpen(true);
  };

  const handleUpdateTrainingStatus = (recordId: string, updates: any) => {
    updateRecord({ id: recordId, ...updates });
    setEditStatusDialogOpen(false);
    setRecordToEdit(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="custom" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'expired':
        return <Badge variant="custom" className="bg-red-100 text-red-800">Expired</Badge>;
      case 'in-progress':
        return <Badge variant="custom" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'not-started':
        return <Badge variant="custom" className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case 'renewal-required':
        return <Badge variant="custom" className="bg-amber-100 text-amber-800">Renewal Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading training records...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Error Loading Training Data</h3>
            <p className="text-muted-foreground">Unable to load training records. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Training Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.completedCount || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{stats?.expiredCount || 0}</div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats?.pendingCount || 0}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Training Completion</span>
              <span>{stats?.completionPercentage || 0}%</span>
            </div>
            <Progress value={stats?.completionPercentage || 0} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Training Records
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setAssignTrainingOpen(true)}
            disabled={!branchId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Training
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Book className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No training records found</p>
              </div>
            ) : (
              trainingRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      record.status === 'completed' ? 'bg-green-100' :
                      record.status === 'expired' ? 'bg-red-100' :
                      record.status === 'in-progress' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {record.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : record.status === 'expired' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{record.training_course?.title}</h4>
                      <p className="text-sm text-muted-foreground">{record.training_course?.category}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {record.training_course?.is_mandatory && <span className="font-medium">Mandatory</span>}
                        {record.assigned_date && (
                          <>
                            <span>•</span>
                            <span>Assigned: {new Date(record.assigned_date).toLocaleDateString()}</span>
                          </>
                        )}
                        {record.completion_date && (
                          <>
                            <span>•</span>
                            <span>Completed: {new Date(record.completion_date).toLocaleDateString()}</span>
                          </>
                        )}
                        {record.expiry_date && (
                          <>
                            <span>•</span>
                            <span>Expires: {new Date(record.expiry_date).toLocaleDateString()}</span>
                          </>
                        )}
                        {record.progress_percentage && record.status === 'in-progress' && (
                          <>
                            <span>•</span>
                            <span>Progress: {record.progress_percentage}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                    {record.evidence_files && record.evidence_files.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewCertificate(record)}
                      >
                        View Certificate
                      </Button>
                    )}
                    
                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewCertificate(record)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditStatus(record)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Status
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTraining(record.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Training
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainingRecords.filter(record => record.status === 'not-started').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming training scheduled</p>
              </div>
            ) : (
              trainingRecords
                .filter(record => record.status === 'not-started')
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">{record.training_course?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned: {new Date(record.assigned_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="custom" className="bg-blue-100 text-blue-800">Scheduled</Badge>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assign Training Dialog */}
      {branchId && (
        <AssignTrainingDialog
          open={assignTrainingOpen}
          onOpenChange={setAssignTrainingOpen}
          onAssign={(courseIds, staffIds) => handleAssignTraining(courseIds, staffIds)}
          isAssigning={isAssigning}
          trainingCourses={trainingCourses}
          staff={[{
            id: carerId,
            first_name: carerProfile?.first_name || '',
            last_name: carerProfile?.last_name || '',
            email: carerProfile?.email || '',
            specialization: carerProfile?.specialization || ''
          }]}
          existingRecords={existingRecords.filter(r => r.staff_id === carerId)}
        />
      )}

      {/* Training Record Details Dialog */}
      {selectedRecord && (
        <TrainingRecordDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          record={selectedRecord as any}
          staffName={`${carerProfile?.first_name || ''} ${carerProfile?.last_name || ''}`.trim()}
          trainingTitle={selectedRecord.training_course?.title || 'Training'}
          staffId={carerId}
        />
      )}

      {/* Edit Training Status Dialog */}
      {recordToEdit && (
        <EditTrainingStatusDialog
          open={editStatusDialogOpen}
          onOpenChange={setEditStatusDialogOpen}
          record={recordToEdit as any}
          staffId={carerId}
          onUpdate={handleUpdateTrainingStatus}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};
