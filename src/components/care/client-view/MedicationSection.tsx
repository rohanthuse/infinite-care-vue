import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MedicationSectionProps {
  medications: any[];
}

export function MedicationSection({ medications }: MedicationSectionProps) {
  if (!medications || medications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No medications recorded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medications ({medications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {medications.map((med, idx) => (
          <Card key={idx} className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{med.name || med.medication_name}</h4>
                    {med.purpose && (
                      <p className="text-sm text-muted-foreground mt-1">{med.purpose}</p>
                    )}
                  </div>
                  {med.status && (
                    <Badge variant={med.status === 'active' ? 'default' : 'secondary'}>
                      {med.status}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {med.dosage && (
                    <div>
                      <label className="text-muted-foreground">Dosage</label>
                      <p className="font-medium">{med.dosage}</p>
                    </div>
                  )}
                  {med.frequency && (
                    <div>
                      <label className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Frequency
                      </label>
                      <p className="font-medium">{med.frequency}</p>
                    </div>
                  )}
                  {med.route && (
                    <div>
                      <label className="text-muted-foreground">Route</label>
                      <p className="font-medium capitalize">{med.route}</p>
                    </div>
                  )}
                  {med.time && (
                    <div>
                      <label className="text-muted-foreground">Time</label>
                      <p className="font-medium">{med.time}</p>
                    </div>
                  )}
                  {med.prescriber && (
                    <div>
                      <label className="text-muted-foreground">Prescribed By</label>
                      <p className="font-medium">{med.prescriber}</p>
                    </div>
                  )}
                  {med.start_date && (
                    <div>
                      <label className="text-muted-foreground">Start Date</label>
                      <p className="font-medium">{new Date(med.start_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {med.special_instructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Special Instructions</p>
                      <p className="text-sm text-amber-800 mt-1">{med.special_instructions}</p>
                    </div>
                  </div>
                )}

                {med.side_effects && (
                  <div>
                    <label className="text-sm text-muted-foreground">Possible Side Effects</label>
                    <p className="text-sm mt-1">{med.side_effects}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
