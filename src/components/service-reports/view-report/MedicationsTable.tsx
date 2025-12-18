import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
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
  missed_reason?: string;
}

interface MedicationsTableProps {
  medications: Medication[];
}

export function MedicationsTable({ medications }: MedicationsTableProps) {
  const administeredCount = medications.filter(m => m.is_administered).length;
  const missedCount = medications.filter(m => !m.is_administered && m.missed_reason).length;
  const pendingCount = medications.length - administeredCount - missedCount;

  const getStatusBadge = (medication: Medication) => {
    if (medication.is_administered) {
      return (
        <Badge variant="default" className="bg-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Administered
        </Badge>
      );
    }
    if (medication.missed_reason) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Missed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

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
            <TableHead>Route</TableHead>
            <TableHead>Scheduled Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Administered At</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medications.map((medication) => (
            <TableRow key={medication.id}>
              <TableCell className="font-medium">{medication.medication_name}</TableCell>
              <TableCell>{medication.dosage || '-'}</TableCell>
              <TableCell>
                {medication.route ? (
                  <Badge variant="outline">{medication.route}</Badge>
                ) : (
                  '-'
                )}
              </TableCell>
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
              <TableCell>{getStatusBadge(medication)}</TableCell>
              <TableCell>
                {medication.administration_time ? (
                  <span className="text-sm">
                    {formatSafeDate(medication.administration_time, 'p')}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm max-w-xs">
                {medication.administration_notes && (
                  <p className="text-muted-foreground">{medication.administration_notes}</p>
                )}
                {medication.missed_reason && (
                  <p className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {medication.missed_reason}
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
