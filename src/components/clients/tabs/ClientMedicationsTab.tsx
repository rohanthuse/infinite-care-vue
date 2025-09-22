import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, Clock, Calendar, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { useMedicationsByClient } from "@/hooks/useMedications";
import { useMARByClient } from "@/hooks/useMedicationAdministration";
import { format, parseISO, isAfter, isBefore } from "date-fns";

interface ClientMedicationsTabProps {
  clientId: string;
}

export const ClientMedicationsTab: React.FC<ClientMedicationsTabProps> = ({ clientId }) => {
  const { data: medications = [], isLoading: medicationsLoading } = useMedicationsByClient(clientId);
  const { data: adminRecords = [], isLoading: recordsLoading } = useMARByClient(clientId);

  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);

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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Pill className="h-5 w-5 text-green-600" />
              <span>Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeMedications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Pending</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingMedications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span>Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{completedMedications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{adminRecords.length}</div>
            <p className="text-xs text-muted-foreground">Administration records</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Pill className="h-5 w-5" />
              <span>Active Medications</span>
            </div>
          </CardTitle>
          <CardDescription>
            Currently prescribed medications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeMedications.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active medications</p>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMedication(
                            selectedMedication === medication.id ? null : medication.id
                          )}
                        >
                          {selectedMedication === medication.id ? 'Hide' : 'View'} Records
                        </Button>
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
                            record.administered_at ? 'text-green-700' : 'text-orange-700'
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
                            <p className="text-sm text-orange-600 bg-orange-50 rounded p-2">
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
    </div>
  );
};