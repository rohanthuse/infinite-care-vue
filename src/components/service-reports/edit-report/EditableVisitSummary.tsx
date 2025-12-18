import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EditableVisitSummaryProps {
  visitSummary?: string;
  servicesProvided?: string[];
  serviceName?: string;
  onSummaryChange: (summary: string) => void;
}

export function EditableVisitSummary({
  visitSummary,
  servicesProvided,
  serviceName,
  onSummaryChange,
}: EditableVisitSummaryProps) {
  const [summary, setSummary] = useState(visitSummary || '');

  useEffect(() => {
    setSummary(visitSummary || '');
  }, [visitSummary]);

  const handleSummaryChange = (value: string) => {
    setSummary(value);
    onSummaryChange(value);
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

      {/* Editable Visit Summary */}
      <div className="space-y-2">
        <Label htmlFor="visit_summary">Visit Notes</Label>
        <Textarea
          id="visit_summary"
          value={summary}
          onChange={(e) => handleSummaryChange(e.target.value)}
          placeholder="Enter visit summary notes..."
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground">
          Provide a summary of the visit including key observations and any important information.
        </p>
      </div>
    </div>
  );
}
