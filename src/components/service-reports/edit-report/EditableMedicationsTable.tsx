import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle, Plus, X, Pill } from 'lucide-react';
import { formatSafeDate } from '@/lib/dateUtils';

interface Medication {
  id: string;
  medication_name: string;
  dosage?: string;
  route?: string;
  prescribed_time?: string;
  is_administered: boolean;
  administration_time?: string;
  administration_notes?: string;
  not_administered_reason?: string;
}

interface MedicationChange {
  is_administered: boolean;
  administration_time: string;
  administration_notes: string;
  not_administered_reason: string;
}

interface NewMedication {
  medication_name: string;
  dosage: string;
  is_administered: boolean;
  administration_time: string;
  administration_notes: string;
  not_administered_reason: string;
}

interface EditableMedicationsTableProps {
  medications: Medication[];
  onMedicationsChange: (changes: Map<string, MedicationChange>) => void;
  onAddMedication?: (medication: NewMedication) => void;
  allowManualAdd?: boolean;
}

export function EditableMedicationsTable({ 
  medications, 
  onMedicationsChange, 
  onAddMedication,
  allowManualAdd = true 
}: EditableMedicationsTableProps) {
  const [medChanges, setMedChanges] = useState<Map<string, MedicationChange>>(new Map());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedication, setNewMedication] = useState<NewMedication>({
    medication_name: '',
    dosage: '',
    is_administered: false,
    administration_time: '',
    administration_notes: '',
    not_administered_reason: '',
  });
  const [manualMedications, setManualMedications] = useState<(NewMedication & { tempId: string })[]>([]);

  // Initialize with current medication values
  useEffect(() => {
    const initialChanges = new Map<string, MedicationChange>();
    medications.forEach(med => {
      initialChanges.set(med.id, {
        is_administered: med.is_administered,
        administration_time: med.administration_time ? new Date(med.administration_time).toTimeString().slice(0, 5) : '',
        administration_notes: med.administration_notes || '',
        not_administered_reason: med.not_administered_reason || '',
      });
    });
    setMedChanges(initialChanges);
  }, [medications]);

  const handleStatusChange = (medId: string, status: string) => {
    const newChanges = new Map(medChanges);
    const current = newChanges.get(medId) || {
      is_administered: false,
      administration_time: '',
      administration_notes: '',
      not_administered_reason: '',
    };
    
    newChanges.set(medId, {
      ...current,
      is_administered: status === 'given',
      not_administered_reason: status === 'not_given' ? current.not_administered_reason : '',
    });
    setMedChanges(newChanges);
    onMedicationsChange(newChanges);
  };

  const handleTimeChange = (medId: string, time: string) => {
    const newChanges = new Map(medChanges);
    const current = newChanges.get(medId) || {
      is_administered: false,
      administration_time: '',
      administration_notes: '',
      not_administered_reason: '',
    };
    newChanges.set(medId, { ...current, administration_time: time });
    setMedChanges(newChanges);
    onMedicationsChange(newChanges);
  };

  const handleNotesChange = (medId: string, notes: string) => {
    const newChanges = new Map(medChanges);
    const current = newChanges.get(medId) || {
      is_administered: false,
      administration_time: '',
      administration_notes: '',
      not_administered_reason: '',
    };
    newChanges.set(medId, { ...current, administration_notes: notes });
    setMedChanges(newChanges);
    onMedicationsChange(newChanges);
  };

  const handleReasonChange = (medId: string, reason: string) => {
    const newChanges = new Map(medChanges);
    const current = newChanges.get(medId) || {
      is_administered: false,
      administration_time: '',
      administration_notes: '',
      not_administered_reason: '',
    };
    newChanges.set(medId, { ...current, not_administered_reason: reason });
    setMedChanges(newChanges);
    onMedicationsChange(newChanges);
  };

  const handleAddMedication = () => {
    if (!newMedication.medication_name) return;
    
    const tempId = `manual-med-${Date.now()}`;
    const medToAdd = { ...newMedication, tempId };
    setManualMedications([...manualMedications, medToAdd]);
    
    // Also add to changes map
    const newChanges = new Map(medChanges);
    newChanges.set(tempId, {
      is_administered: newMedication.is_administered,
      administration_time: newMedication.administration_time,
      administration_notes: newMedication.administration_notes,
      not_administered_reason: newMedication.not_administered_reason,
    });
    setMedChanges(newChanges);
    onMedicationsChange(newChanges);
    
    if (onAddMedication) {
      onAddMedication(newMedication);
    }
    
    // Reset form
    setNewMedication({
      medication_name: '',
      dosage: '',
      is_administered: false,
      administration_time: '',
      administration_notes: '',
      not_administered_reason: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveManualMedication = (tempId: string) => {
    setManualMedications(manualMedications.filter(m => m.tempId !== tempId));
    const newChanges = new Map(medChanges);
    newChanges.delete(tempId);
    setMedChanges(newChanges);
    onMedicationsChange(newChanges);
  };

  const allMedications = [...medications, ...manualMedications.map(m => ({
    id: m.tempId,
    medication_name: m.medication_name,
    dosage: m.dosage,
    is_administered: m.is_administered,
    administration_time: m.administration_time,
    administration_notes: m.administration_notes,
    not_administered_reason: m.not_administered_reason,
    isManual: true,
  }))];

  const administeredCount = Array.from(medChanges.values()).filter(c => c.is_administered).length;
  const missedCount = Array.from(medChanges.values()).filter(c => !c.is_administered && c.not_administered_reason).length;
  const pendingCount = allMedications.length - administeredCount - missedCount;

  if (allMedications.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Pill className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm mb-4">No medications recorded for this visit</p>
        {allowManualAdd && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Medication Button */}
      {allowManualAdd && !showAddForm && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </div>
      )}

      {/* Add Medication Form */}
      {showAddForm && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Add Medication Entry</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={newMedication.medication_name}
              onChange={(e) => setNewMedication({ ...newMedication, medication_name: e.target.value })}
              placeholder="Medication name *"
            />
            <Input
              value={newMedication.dosage}
              onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
              placeholder="Dosage (e.g., 10mg)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={newMedication.is_administered ? 'given' : 'not_given'}
              onValueChange={(value) => setNewMedication({ ...newMedication, is_administered: value === 'given' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="given">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Given
                  </span>
                </SelectItem>
                <SelectItem value="not_given">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-600" />
                    Not Given
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {newMedication.is_administered && (
              <Input
                type="time"
                value={newMedication.administration_time}
                onChange={(e) => setNewMedication({ ...newMedication, administration_time: e.target.value })}
                placeholder="Time given"
              />
            )}
          </div>
          {newMedication.is_administered ? (
            <Input
              value={newMedication.administration_notes}
              onChange={(e) => setNewMedication({ ...newMedication, administration_notes: e.target.value })}
              placeholder="Notes (optional)"
            />
          ) : (
            <Input
              value={newMedication.not_administered_reason}
              onChange={(e) => setNewMedication({ ...newMedication, not_administered_reason: e.target.value })}
              placeholder="Reason not given *"
              className={!newMedication.is_administered && !newMedication.not_administered_reason ? 'border-amber-500' : ''}
            />
          )}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleAddMedication} 
              disabled={!newMedication.medication_name || (!newMedication.is_administered && !newMedication.not_administered_reason)}
            >
              Add Medication
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      {allMedications.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
            <p className="text-sm text-muted-foreground">Administered</p>
            <p className="text-2xl font-bold text-green-600">{administeredCount}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-sm text-muted-foreground">Missed</p>
            <p className="text-2xl font-bold text-red-600">{missedCount}</p>
          </div>
        </div>
      )}

      {/* Medications Table */}
      {allMedications.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time Given</TableHead>
              <TableHead>Notes / Reason</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medications.map((medication) => {
              const change = medChanges.get(medication.id);
              const isAdministered = change?.is_administered ?? medication.is_administered;
              const hasReason = change?.not_administered_reason || medication.not_administered_reason;

              return (
                <TableRow key={medication.id}>
                  <TableCell className="font-medium">{medication.medication_name}</TableCell>
                  <TableCell>{medication.dosage || '-'}</TableCell>
                  <TableCell>
                    {medication.prescribed_time ? (
                      <span className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatSafeDate(medication.prescribed_time, 'p')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={isAdministered ? 'given' : (hasReason ? 'not_given' : 'pending')}
                      onValueChange={(value) => handleStatusChange(medication.id, value)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="given">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Given
                          </span>
                        </SelectItem>
                        <SelectItem value="not_given">
                          <span className="flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-red-600" />
                            Not Given
                          </span>
                        </SelectItem>
                        <SelectItem value="pending">
                          <span className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-amber-600" />
                            Pending
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={change?.administration_time || ''}
                      onChange={(e) => handleTimeChange(medication.id, e.target.value)}
                      disabled={!isAdministered}
                      className="w-[100px] h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    {isAdministered ? (
                      <Input
                        value={change?.administration_notes || ''}
                        onChange={(e) => handleNotesChange(medication.id, e.target.value)}
                        placeholder="Notes..."
                        className="h-8 text-sm"
                      />
                    ) : (
                      <Input
                        value={change?.not_administered_reason || ''}
                        onChange={(e) => handleReasonChange(medication.id, e.target.value)}
                        placeholder="Reason not given..."
                        className="h-8 text-sm"
                      />
                    )}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              );
            })}
            {manualMedications.map((med) => {
              const change = medChanges.get(med.tempId);
              const isAdministered = change?.is_administered ?? med.is_administered;
              
              return (
                <TableRow key={med.tempId} className="bg-primary/5">
                  <TableCell className="font-medium">
                    {med.medication_name}
                    <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                  </TableCell>
                  <TableCell>{med.dosage || '-'}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <Select
                      value={isAdministered ? 'given' : 'not_given'}
                      onValueChange={(value) => handleStatusChange(med.tempId, value)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="given">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Given
                          </span>
                        </SelectItem>
                        <SelectItem value="not_given">
                          <span className="flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-red-600" />
                            Not Given
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={change?.administration_time || ''}
                      onChange={(e) => handleTimeChange(med.tempId, e.target.value)}
                      disabled={!isAdministered}
                      className="w-[100px] h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    {isAdministered ? (
                      <Input
                        value={change?.administration_notes || ''}
                        onChange={(e) => handleNotesChange(med.tempId, e.target.value)}
                        placeholder="Notes..."
                        className="h-8 text-sm"
                      />
                    ) : (
                      <Input
                        value={change?.not_administered_reason || ''}
                        onChange={(e) => handleReasonChange(med.tempId, e.target.value)}
                        placeholder="Reason not given..."
                        className="h-8 text-sm"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveManualMedication(med.tempId)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
