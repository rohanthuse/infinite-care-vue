import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Activity, Thermometer, Heart, Wind } from 'lucide-react';
import { format } from 'date-fns';

import { VisitVital } from '@/hooks/useVisitVitals';

interface NEWS2DisplayProps {
  news2Readings: VisitVital[];
  latestNEWS2?: VisitVital;
  otherVitals: VisitVital[];
}

export function NEWS2Display({ news2Readings, latestNEWS2, otherVitals }: NEWS2DisplayProps) {
  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    
    const variants: Record<string, any> = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
    };

    const colors: Record<string, string> = {
      low: 'bg-green-600',
      medium: 'bg-amber-600',
      high: 'bg-red-600',
    };

    return (
      <Badge variant={variants[riskLevel.toLowerCase()]} className={colors[riskLevel.toLowerCase()]}>
        {riskLevel.toUpperCase()} RISK
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Latest NEWS2 Score - Highlighted */}
      {latestNEWS2 && (
        <Alert className={latestNEWS2.news2_risk_level === 'high' ? 'border-red-500' : ''}>
          <Activity className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Latest NEWS2 Score</span>
            {getRiskBadge(latestNEWS2.news2_risk_level)}
          </AlertTitle>
          <AlertDescription>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-3xl font-bold">{latestNEWS2.news2_total_score}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recorded At</p>
                <p className="font-medium">{format(new Date(latestNEWS2.reading_time), 'PPp')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  Heart Rate
                </p>
                <p className="font-medium">{latestNEWS2.pulse_rate} bpm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Wind className="h-3 w-3" />
                  SpO2
                </p>
                <p className="font-medium">{latestNEWS2.oxygen_saturation}%</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* NEWS2 Parameters Table */}
      {latestNEWS2 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-4">NEWS2 Parameters</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">Respiration Rate</p>
                <p className="text-lg font-semibold">{latestNEWS2.respiratory_rate} /min</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">SpO2</p>
                <p className="text-lg font-semibold">{latestNEWS2.oxygen_saturation}%</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">Oxygen Therapy</p>
                <p className="text-lg font-semibold">{latestNEWS2.supplemental_oxygen ? 'Yes' : 'No'}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  Temperature
                </p>
                <p className="text-lg font-semibold">{latestNEWS2.temperature}°C</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">Systolic BP</p>
                <p className="text-lg font-semibold">{latestNEWS2.systolic_bp} mmHg</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">Heart Rate</p>
                <p className="text-lg font-semibold">{latestNEWS2.pulse_rate} bpm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md col-span-2 md:col-span-3">
                <p className="text-sm text-muted-foreground">Consciousness Level</p>
                <p className="text-lg font-semibold">{latestNEWS2.consciousness_level || 'A (Alert)'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical NEWS2 Readings */}
      {news2Readings.length > 1 && (
        <div>
          <h4 className="font-semibold mb-3">All NEWS2 Readings</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Heart Rate</TableHead>
                <TableHead>SpO2</TableHead>
                <TableHead>Temp</TableHead>
                <TableHead>BP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news2Readings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell>{format(new Date(reading.reading_time), 'p')}</TableCell>
                  <TableCell className="font-bold">{reading.news2_total_score}</TableCell>
                  <TableCell>{getRiskBadge(reading.news2_risk_level)}</TableCell>
                  <TableCell>{reading.pulse_rate} bpm</TableCell>
                  <TableCell>{reading.oxygen_saturation}%</TableCell>
                  <TableCell>{reading.temperature}°C</TableCell>
                  <TableCell>{reading.systolic_bp} mmHg</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Other Vital Signs */}
      {otherVitals.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Other Vital Signs</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {otherVitals.map((vital) => (
              <div key={vital.id} className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">{vital.vital_type}</p>
                <p className="text-lg font-semibold">
                  {vital.vital_type === 'weight' && vital.weight_kg ? `${vital.weight_kg} kg` :
                   vital.vital_type === 'blood_sugar' && vital.blood_sugar_mmol ? `${vital.blood_sugar_mmol} mmol/L` :
                   vital.vital_type === 'temperature' && vital.temperature ? `${vital.temperature}°C` :
                   vital.vital_type === 'blood_pressure' && vital.systolic_bp && vital.diastolic_bp ? `${vital.systolic_bp}/${vital.diastolic_bp} mmHg` :
                   'N/A'}
                </p>
                {vital.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{vital.notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(vital.reading_time), 'p')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {news2Readings.length === 0 && otherVitals.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No vital signs recorded for this visit</p>
        </div>
      )}
    </div>
  );
}
