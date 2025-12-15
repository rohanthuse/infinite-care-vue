import React from "react";
import { AlertTriangle, Check, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShareableSection } from "@/types/sharing";

interface ShareSectionSelectorProps {
  sections: ShareableSection[];
  selectedSections: Record<string, boolean>;
  onSectionChange: (sectionId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}

export function ShareSectionSelector({
  sections,
  selectedSections,
  onSectionChange,
  onSelectAll,
  onDeselectAll,
  className,
}: ShareSectionSelectorProps) {
  const selectedCount = Object.values(selectedSections).filter(Boolean).length;
  const hasSensitiveSelected = sections
    .filter(s => s.isSensitive)
    .some(s => selectedSections[s.id]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCount} of {sections.length} sections selected
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAll}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
          >
            Deselect All
          </Button>
        </div>
      </div>

      {/* Sensitive data warning */}
      {hasSensitiveSelected && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">Sensitive data selected.</span>{" "}
            Please ensure you have appropriate consent before sharing.
          </div>
        </div>
      )}

      {/* Section list */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
              selectedSections[section.id]
                ? "bg-primary/5 border-primary/20"
                : "bg-background border-border hover:bg-muted/50"
            )}
          >
            <Checkbox
              id={section.id}
              checked={selectedSections[section.id] || false}
              onCheckedChange={(checked) =>
                onSectionChange(section.id, checked as boolean)
              }
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={section.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {section.label}
                </Label>
                {section.isSensitive && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                    <Shield className="h-3 w-3" />
                    Sensitive
                  </span>
                )}
                {!section.isExternallyShareable && !section.isSensitive && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">
                    Internal
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {section.description}
              </p>
            </div>
            {selectedSections[section.id] && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
