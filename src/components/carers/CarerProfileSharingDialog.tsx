import React, { useState } from "react";
import { Mail, Share2, ArrowLeft, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateCarerProfilePDF } from "@/utils/pdfGenerator";
import { toast } from "@/hooks/use-toast";
import { GroupedShareSectionSelector } from "@/components/sharing/GroupedShareSectionSelector";
import {
  STAFF_SHAREABLE_SECTIONS,
  STAFF_SECTION_GROUPS,
  StaffShareSections,
  getDefaultStaffSections,
} from "@/types/sharing";

interface CarerProfileSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    specialization: string;
    experience: string;
    hire_date: string;
  };
  branchId: string;
}

export function CarerProfileSharingDialog({
  open,
  onOpenChange,
  carer,
  branchId,
}: CarerProfileSharingDialogProps) {
  const [step, setStep] = useState<'select' | 'export'>('select');
  const [selectedSections, setSelectedSections] = useState<StaffShareSections>(
    getDefaultStaffSections()
  );

  const handleSectionChange = (sectionId: string, checked: boolean) => {
    setSelectedSections((prev) => ({
      ...prev,
      [sectionId]: checked,
    }));
  };

  const handleSelectAll = () => {
    const allSelected = STAFF_SHAREABLE_SECTIONS.reduce(
      (acc, section) => ({ ...acc, [section.id]: true }),
      {} as StaffShareSections
    );
    setSelectedSections(allSelected);
  };

  const handleDeselectAll = () => {
    const allDeselected = STAFF_SHAREABLE_SECTIONS.reduce(
      (acc, section) => ({ ...acc, [section.id]: false }),
      {} as StaffShareSections
    );
    setSelectedSections(allDeselected);
  };

  const handleContinueToExport = () => {
    const hasSelection = Object.values(selectedSections).some(Boolean);
    if (!hasSelection) {
      toast({
        title: "No sections selected",
        description: "Please select at least one section to share.",
        variant: "destructive",
      });
      return;
    }
    setStep('export');
  };

  const handleExportAndShare = () => {
    generateCarerProfilePDF(carer, branchId, selectedSections);

    toast({
      title: "Success",
      description: "Carer profile exported successfully. You can now share the PDF file.",
    });
    handleClose();
  };

  const handleClose = () => {
    setStep('select');
    setSelectedSections(getDefaultStaffSections());
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep('select');
  };

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Carer Profile - {carer.first_name} {carer.last_name}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? "Select which sections to include in the shared profile."
              : "Export the selected sections as a PDF document."}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            <GroupedShareSectionSelector
              sections={STAFF_SHAREABLE_SECTIONS}
              sectionGroups={STAFF_SECTION_GROUPS}
              selectedSections={selectedSections as unknown as Record<string, boolean>}
              onSectionChange={handleSectionChange}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleContinueToExport} className="flex-1">
                Continue with {selectedCount} section{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {step === 'export' && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900">Export & Email</h4>
              <p className="text-sm text-green-700 mt-1">
                Download the carer profile as a PDF document for secure sharing via email or other means.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h5 className="font-medium">Selected sections to export ({selectedCount}):</h5>
                  <Button variant="ghost" size="sm" onClick={handleBack} className="ml-auto h-7 text-xs">
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Change
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {STAFF_SHAREABLE_SECTIONS.filter(
                    (s) => selectedSections[s.id as keyof StaffShareSections]
                  ).map((section) => (
                    <span
                      key={section.id}
                      className="inline-flex items-center px-2 py-0.5 text-xs bg-primary/10 text-primary rounded"
                    >
                      {section.label}
                    </span>
                  ))}
                </div>
              </div>

              <Button onClick={handleExportAndShare} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Export Profile as PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
