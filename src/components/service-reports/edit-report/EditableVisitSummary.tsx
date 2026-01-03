import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EditableVisitSummaryProps {
  visitNotes?: string;
  systemSummary?: string;
  servicesProvided?: string[];
  serviceName?: string;
  onNotesChange: (notes: string) => void;
}

export function EditableVisitSummary({
  visitNotes,
  systemSummary,
  servicesProvided,
  serviceName,
  onNotesChange,
}: EditableVisitSummaryProps) {
  const [notes, setNotes] = useState(visitNotes || '');

  useEffect(() => {
    setNotes(visitNotes || '');
  }, [visitNotes]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(value);
  };

  return (
    <div className="space-y-4">
      {/* Services Provided (Read-only display) */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Services Provided</p>
        <div className="flex flex-wrap gap-2">
          {servicesProvided && servicesProvided.length > 0 ? (
            servicesProvided.map((service: string, index: number) => (
              <Badge key={index} variant="secondary">
                {service}
              </Badge>
            ))
          ) : serviceName ? (
            <Badge variant="secondary">{serviceName}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">No services recorded</span>
          )}
        </div>
      </div>

      <Separator />

      {/* Editable Carer Visit Notes */}
      <div className="space-y-2">
        <Label htmlFor="visit_notes">Carer Visit Notes</Label>
        <Textarea
          id="visit_notes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Enter your visit notes..."
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground">
          Your notes about the visit, key observations, and any important information.
        </p>
      </div>

      {/* System Summary (Read-only) */}
      {systemSummary && (
        <>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-2">System Summary</p>
            <p className="text-sm bg-muted/30 p-3 rounded-md text-muted-foreground italic">
              {systemSummary}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
