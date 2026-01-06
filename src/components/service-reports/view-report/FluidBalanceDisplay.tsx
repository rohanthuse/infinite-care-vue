import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Droplets, Target, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useFluidIntakeRecords } from '@/hooks/useFluidIntakeRecords';
import { useFluidOutputRecords } from '@/hooks/useFluidOutputRecords';
import { useUrinaryOutputRecords } from '@/hooks/useUrinaryOutputRecords';
import { useFluidBalanceTarget } from '@/hooks/useFluidBalanceTargets';

interface FluidBalanceDisplayProps {
  clientId: string;
  serviceDate: string;
  visitRecordId?: string;
}

export function FluidBalanceDisplay({ clientId, serviceDate, visitRecordId }: FluidBalanceDisplayProps) {
  // Fetch all fluid records for the date
  const { data: intakeRecords = [], isLoading: intakeLoading } = useFluidIntakeRecords(clientId, serviceDate);
  const { data: outputRecords = [], isLoading: outputLoading } = useFluidOutputRecords(clientId, serviceDate);
  const { data: urinaryRecords = [], isLoading: urinaryLoading } = useUrinaryOutputRecords(clientId, serviceDate);
  const { data: fluidTarget } = useFluidBalanceTarget(clientId);

  // Calculate totals
  const totalIntake = intakeRecords.reduce((sum, r) => sum + (r.amount_ml || 0), 0);
  const totalOutput = outputRecords.reduce((sum, r) => sum + (r.amount_ml || 0), 0);
  const totalUrinary = urinaryRecords.reduce((sum, r) => sum + (r.amount_ml || 0), 0);
  const totalOutputCombined = totalOutput + totalUrinary;
  const balance = totalIntake - totalOutputCombined;

  // Check if below target threshold
  const intakeProgress = fluidTarget?.daily_intake_target_ml 
    ? Math.round((totalIntake / fluidTarget.daily_intake_target_ml) * 100)
    : null;
  const isBelowThreshold = intakeProgress !== null && 
    fluidTarget?.alert_threshold_percentage && 
    intakeProgress < fluidTarget.alert_threshold_percentage;

  const isLoading = intakeLoading || outputLoading || urinaryLoading;
  const hasRecords = intakeRecords.length > 0 || outputRecords.length > 0 || urinaryRecords.length > 0;

  if (!hasRecords && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Fluid Balance (Visit Date)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No fluid balance records for this visit
          </p>
        </CardContent>
      </Card>
    );
  }

  const getColourBadge = (colour?: string) => {
    if (!colour) return null;
    const abnormal = ['Dark amber', 'Brown', 'Red-tinged'].includes(colour);
    return abnormal ? (
      <Badge variant="destructive">{colour}</Badge>
    ) : (
      <span>{colour}</span>
    );
  };

  const getOdourBadge = (odour?: string) => {
    if (!odour) return null;
    const abnormal = ['Strong', 'Offensive', 'Unusual'].includes(odour);
    return abnormal ? (
      <Badge variant="destructive">{odour}</Badge>
    ) : (
      <span>{odour}</span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Fluid Balance (Visit Date)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert if below threshold */}
        {isBelowThreshold && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Intake is below {fluidTarget?.alert_threshold_percentage}% of daily target
            </span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Intake</p>
            <p className="text-2xl font-bold text-blue-600">{totalIntake} ml</p>
            {fluidTarget?.daily_intake_target_ml && (
              <p className="text-xs text-muted-foreground mt-1">
                Target: {fluidTarget.daily_intake_target_ml} ml ({intakeProgress}%)
              </p>
            )}
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Output</p>
            <p className="text-2xl font-bold text-amber-600">{totalOutputCombined} ml</p>
            {fluidTarget?.daily_output_target_ml && (
              <p className="text-xs text-muted-foreground mt-1">
                Target: {fluidTarget.daily_output_target_ml} ml
              </p>
            )}
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{balance} ml
            </p>
          </div>
          {fluidTarget && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Daily Target
              </p>
              <p className="text-lg font-semibold text-purple-600">
                {fluidTarget.daily_intake_target_ml} ml
              </p>
              {fluidTarget.alert_threshold_percentage && (
                <p className="text-xs text-muted-foreground mt-1">
                  Alert below {fluidTarget.alert_threshold_percentage}%
                </p>
              )}
            </div>
          )}
        </div>

        {/* Intake Records Table */}
        {intakeRecords.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-blue-600">Fluid Intake ({intakeRecords.length} records)</h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intakeRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.time), 'HH:mm')}</TableCell>
                      <TableCell>{record.fluid_type}</TableCell>
                      <TableCell className="font-medium">{record.amount_ml} ml</TableCell>
                      <TableCell>{record.method}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.comments || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Output Records Table */}
        {outputRecords.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-amber-600">Fluid Output ({outputRecords.length} records)</h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Appearance</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outputRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.time), 'HH:mm')}</TableCell>
                      <TableCell>{record.output_type}</TableCell>
                      <TableCell className="font-medium">
                        {record.amount_ml ? `${record.amount_ml} ml` : record.amount_estimate || '-'}
                      </TableCell>
                      <TableCell>{record.appearance || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.comments || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Urinary Output Records Table */}
        {urinaryRecords.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-purple-600">Urinary Output ({urinaryRecords.length} records)</h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Colour</TableHead>
                    <TableHead>Odour</TableHead>
                    <TableHead>Observations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urinaryRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.time), 'HH:mm')}</TableCell>
                      <TableCell>{record.collection_method}</TableCell>
                      <TableCell className="font-medium">
                        {record.amount_ml ? `${record.amount_ml} ml` : record.amount_estimate || '-'}
                      </TableCell>
                      <TableCell>{getColourBadge(record.colour)}</TableCell>
                      <TableCell>{getOdourBadge(record.odour)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.discomfort_observations || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Target Notes */}
        {fluidTarget?.notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Care Plan Notes:</p>
            <p className="text-sm text-muted-foreground">{fluidTarget.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
