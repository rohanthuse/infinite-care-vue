import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Pill, Clock, Calendar, AlertTriangle, CheckCircle, Plus, Eye, Edit, Trash } from "lucide-react";
import { useMedicationsByClient, useDeleteMedication } from "@/hooks/useMedications";
import { useMARByClient } from "@/hooks/useMedicationAdministration";
import { ClientMedicationDialog } from "./dialogs/ClientMedicationDialog";
import { format, parseISO, isAfter, isBefore } from "date-fns";

interface ClientMedicationsTabProps {
  clientId: string;
}

export const ClientMedicationsTab: React.FC<ClientMedicationsTabProps> = ({ clientId }) => {
  const { data: medications = [], isLoading: medicationsLoading } = useMedicationsByClient(clientId);
  const { data: adminRecords = [], isLoading: recordsLoading } = useMARByClient(clientId);
  const deleteMedication = useDeleteMedication();

  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedMedicationForDialog, setSelectedMedicationForDialog] = useState<any>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const getMedicationStatus = (medication: any) => {
    const now = new Date();
    const startDate = new Date(medication.start_date);
    const endDate = medication.end_date ? new Date(medication.end_date) : null;

    if (medication.status === 'discontinued') {
      return { status: 'discontinued', label: 'Discontinued', variant: 'secondary' as const };
    }

    if (isBefore(now, startDate)) {
      return { status: 'pending', label: 'Pending Start', variant: 'outline' as const };
    }

    if (endDate && isAfter(now, endDate)) {
      return { status: 'completed', label: 'Course Complete', variant: 'secondary' as const };
    }

    return { status: 'active', label: 'Active', variant: 'default' as const };
  };

  const getAdministrationRecords = (medicationId: string) => {
    return adminRecords.filter(record => record.medication_id === medicationId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const activeMedications = medications.filter(med => getMedicationStatus(med).status === 'active');
  const pendingMedications = medications.filter(med => getMedicationStatus(med).status === 'pending');
  const completedMedications = medications.filter(med => 
    ['completed', 'discontinued'].includes(getMedicationStatus(med).status)
  );

  if (medicationsLoading || recordsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading medications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Medication Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pill className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeMedications.length}</p>
                <p className="text-xs text-muted-foreground">medications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingMedications.length}</p>
                <p className="text-xs text-muted-foreground">to start</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{completedMedications.length}</p>
                <p className="text-xs text-muted-foreground">courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Admin Records</p>
                <p className="text-2xl font-bold text-primary">{adminRecords.length}</p>
                <p className="text-xs text-muted-foreground">total records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Medications */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Active Medications</CardTitle>
            </div>
            <Button
              onClick={() => {
                setDialogMode('add');
                setSelectedMedicationForDialog(null);
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </div>
          <CardDescription>Currently prescribed medications</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {activeMedications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No active medications</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Care Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeMedications.map((medication) => {
                  const statusInfo = getMedicationStatus(medication);
                  return (
                    <TableRow key={medication.id}>
                      <TableCell className="font-medium">{medication.name}</TableCell>
                      <TableCell>{medication.dosage}</TableCell>
                      <TableCell>{medication.frequency}</TableCell>
                      <TableCell>{format(parseISO(medication.start_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {medication.client_care_plans?.title || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDialogMode('view');
                                    setSelectedMedicationForDialog(medication);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View details</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDialogMode('edit');
                                    setSelectedMedicationForDialog(medication);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit medication</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirmationId(medication.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete medication</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Administration Records for Selected Medication */}
      {selectedMedication && (
        <Card>
          <CardHeader>
            <CardTitle>Administration Records</CardTitle>
            <CardDescription>
              Recent administration history for selected medication
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const records = getAdministrationRecords(selectedMedication);
              const selectedMed = medications.find(m => m.id === selectedMedication);
              
              return (
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <h4 className="font-medium">{selectedMed?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMed?.dosage} • {selectedMed?.frequency}
                    </p>
                  </div>

                  {records.length === 0 ? (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No administration records yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {records.slice(0, 10).map((record) => (
                        <div key={record.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                          {record.administered_at ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            record.administered_at ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
                          }`}>
                            {record.administered_at ? 'Administered' : 'Missed'}
                          </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(record.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                          
                          {record.notes && (
                            <p className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                              {record.notes}
                            </p>
                          )}
                          
                          {!record.administered_at && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 rounded p-2">
                              Medication not administered
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* All Medications History */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Medication History</CardTitle>
          <CardDescription>
            All medications including completed and discontinued
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Care Plan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((medication) => {
                const statusInfo = getMedicationStatus(medication);
                return (
                  <TableRow key={medication.id}>
                    <TableCell className="font-medium">{medication.name}</TableCell>
                    <TableCell>{medication.dosage}</TableCell>
                    <TableCell>
                      {format(parseISO(medication.start_date), 'MMM dd, yyyy')}
                      {medication.end_date && (
                        <> - {format(parseISO(medication.end_date), 'MMM dd, yyyy')}</>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {medication.client_care_plans?.title || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Medication Dialog */}
      <ClientMedicationDialog
        isOpen={dialogMode !== null}
        onClose={() => {
          setDialogMode(null);
          setSelectedMedicationForDialog(null);
        }}
        clientId={clientId}
        mode={dialogMode || 'add'}
        medication={selectedMedicationForDialog}
      />

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={deleteConfirmationId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medication? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmationId) {
                  deleteMedication.mutate(deleteConfirmationId);
                  setDeleteConfirmationId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};