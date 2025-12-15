import React, { useState } from "react";
import { AlertTriangle, Check, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShareableSection, SectionGroup } from "@/types/sharing";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GroupedShareSectionSelectorProps {
  sections: ShareableSection[];
  sectionGroups: SectionGroup[];
  selectedSections: Record<string, boolean>;
  onSectionChange: (sectionId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}

export function GroupedShareSectionSelector({
  sections,
  sectionGroups,
  selectedSections,
  onSectionChange,
  onSelectAll,
  onDeselectAll,
  className,
}: GroupedShareSectionSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    sectionGroups.reduce((acc, group) => ({ ...acc, [group.id]: true }), {})
  );

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;
  const totalCount = sections.length;
  const hasSensitiveSelected = sections
    .filter(s => s.isSensitive)
    .some(s => selectedSections[s.id]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getGroupSections = (group: SectionGroup) => {
    return sections.filter(s => group.sections.includes(s.id));
  };

  const getGroupSelectedCount = (group: SectionGroup) => {
    return group.sections.filter(id => selectedSections[id]).length;
  };

  const handleGroupSelectAll = (group: SectionGroup) => {
    const groupSections = getGroupSections(group);
    const allSelected = groupSections.every(s => selectedSections[s.id]);
    
    groupSections.forEach(section => {
      onSectionChange(section.id, !allSelected);
    });
  };

  const isGroupAllSelected = (group: SectionGroup) => {
    const groupSections = getGroupSections(group);
    return groupSections.length > 0 && groupSections.every(s => selectedSections[s.id]);
  };

  const isGroupPartialSelected = (group: SectionGroup) => {
    const groupSections = getGroupSections(group);
    const selectedInGroup = groupSections.filter(s => selectedSections[s.id]).length;
    return selectedInGroup > 0 && selectedInGroup < groupSections.length;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCount} of {totalCount} sections selected
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

      {/* Grouped section list */}
      <div className="space-y-3">
        {sectionGroups.map((group) => {
          const groupSections = getGroupSections(group);
          const groupSelectedCount = getGroupSelectedCount(group);
          const isExpanded = expandedGroups[group.id];
          const allSelected = isGroupAllSelected(group);
          const partialSelected = isGroupPartialSelected(group);

          return (
            <Collapsible
              key={group.id}
              open={isExpanded}
              onOpenChange={() => toggleGroup(group.id)}
              className="border rounded-lg overflow-hidden"
            >
              <div className="flex items-center gap-2 p-3 bg-muted/30 border-b">
                <CollapsibleTrigger className="flex items-center gap-2 flex-1 hover:bg-muted/50 rounded p-1 -m-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-base">{group.icon}</span>
                  <span className="font-medium text-sm">{group.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto mr-2">
                    {groupSelectedCount}/{groupSections.length}
                  </span>
                </CollapsibleTrigger>
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => handleGroupSelectAll(group)}
                  className={cn(
                    partialSelected && "data-[state=unchecked]:bg-primary/30"
                  )}
                />
              </div>
              
              <CollapsibleContent>
                <div className="p-2 space-y-1">
                  {groupSections.map((section) => (
                    <div
                      key={section.id}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-md transition-colors",
                        selectedSections[section.id]
                          ? "bg-primary/5"
                          : "hover:bg-muted/50"
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
                        <div className="flex items-center gap-2 flex-wrap">
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
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
