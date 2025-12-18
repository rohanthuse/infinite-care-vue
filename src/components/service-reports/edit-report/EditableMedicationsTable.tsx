import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
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

interface EditableMedicationsTableProps {
  medications: Medication[];
  onMedicationsChange: (changes: Map<string, MedicationChange>) => void;
}

export function EditableMedicationsTable({ medications, onMedicationsChange }: EditableMedicationsTableProps) {
  const [medChanges, setMedChanges] = useState<Map<string, MedicationChange>>(new Map());

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

  const administeredCount = Array.from(medChanges.values()).filter(c => c.is_administered).length;
  const missedCount = Array.from(medChanges.values()).filter(c => !c.is_administered && c.not_administered_reason).length;
  const pendingCount = medications.length - administeredCount - missedCount;

  return (
    <div className="space-y-4">
      {/* Summary */}
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

      {/* Medications Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medication</TableHead>
            <TableHead>Dosage</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time Given</TableHead>
            <TableHead>Notes / Reason</TableHead>
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
