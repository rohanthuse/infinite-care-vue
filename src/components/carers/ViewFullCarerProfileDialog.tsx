import React, { useState, useCallback } from "react";
import { 
  User, Mail, Phone, Briefcase, Calendar, CheckCircle, Share2,
  AlertTriangle, Star, GraduationCap, FileText, ClipboardList,
  Award, Heart, DollarSign, Settings, MessageCircle, ArrowRightLeft, Sliders
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { CarerOverviewTab } from "@/components/carer-profile/CarerOverviewTab";
import { CarerPersonalDetailsTab } from "@/components/carer-profile/CarerPersonalDetailsTab";
import { CarerCommunicationTab } from "@/components/carer-profile/CarerCommunicationTab";
import { CarerSuspendTab } from "@/components/carer-profile/CarerSuspendTab";
import { CarerQualityAssuranceTab } from "@/components/carer-profile/CarerQualityAssuranceTab";
import { CarerAttendanceTab } from "@/components/carer-profile/CarerAttendanceTab";
import { CarerEssentialsTab } from "@/components/carer-profile/CarerEssentialsTab";
import { CarerEmploymentHistoryTab } from "@/components/carer-profile/CarerEmploymentHistoryTab";
import { CarerTrainingTab } from "@/components/carer-profile/CarerTrainingTab";
import { CarerSupportingStatementTab } from "@/components/carer-profile/CarerSupportingStatementTab";
import { CarerImportantContactTab } from "@/components/carer-profile/CarerImportantContactTab";
import { CarerFormsTab } from "@/components/carer-profile/CarerFormsTab";
import { CarerSkillsTab } from "@/components/carer-profile/CarerSkillsTab";
import { CarerTypeOfWorkTab } from "@/components/carer-profile/CarerTypeOfWorkTab";
import { CarerHobbiesTab } from "@/components/carer-profile/CarerHobbiesTab";
import { CarerMeetingsTab } from "@/components/carer-profile/CarerMeetingsTab";
import { CarerDocumentsTab } from "@/components/carer-profile/CarerDocumentsTab";
import { CarerRateTab } from "@/components/carer-profile/CarerRateTab";
import { CarerSettingsTab } from "@/components/carer-profile/CarerSettingsTab";
import { CarerNotesTab } from "@/components/carer-profile/CarerNotesTab";
import { CarerGeneralTab } from "@/components/carer-profile/CarerGeneralTab";
import { CarerProfileSharingDialog } from "@/components/carers/CarerProfileSharingDialog";
import { CarerProfileSummaryCard } from "@/components/carer-profile/CarerProfileSummaryCard";
import { TransferBranchDialog } from "@/components/carers/TransferBranchDialog";
import { CarerProfileNavigation } from "@/components/carer-profile/CarerProfileNavigation";

interface ViewFullCarerProfileDialogProps {
  carerId: string;
  branchId: string;
  branchName?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Grouped tab structure for better organization
const tabGroups = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    tabs: [
      { value: "overview", label: "Overview", icon: User },
      { value: "personal", label: "Personal Details", icon: User },
      { value: "essentials", label: "Essentials", icon: CheckCircle },
      { value: "statement", label: "Supporting Statement", icon: FileText },
      { value: "hobbies", label: "Hobbies & Interests", icon: Heart },
    ]
  },
  {
    id: "employment",
    label: "Employment",
    icon: Briefcase,
    tabs: [
      { value: "general", label: "General Settings", icon: Sliders },
      { value: "employment", label: "Employment History", icon: Briefcase },
      { value: "work-type", label: "Work Type Preferences", icon: Briefcase },
      { value: "skills", label: "Skills Matrix", icon: Award },
      { value: "settings", label: "Settings", icon: Settings },
    ]
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: DollarSign,
    tabs: [
      { value: "rate", label: "Rate Schedules", icon: DollarSign },
      { value: "attendance", label: "Attendance", icon: Calendar },
    ]
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: FileText,
    tabs: [
      { value: "documents", label: "Documents", icon: FileText },
      { value: "training", label: "Training & Qualifications", icon: GraduationCap },
      { value: "forms", label: "Forms", icon: ClipboardList },
      { value: "quality", label: "Quality Assurance", icon: Star },
    ]
  },
  {
    id: "activity",
    label: "Activity",
    icon: MessageCircle,
    tabs: [
      { value: "notes", label: "Notes", icon: MessageCircle },
      { value: "communication", label: "Communication", icon: Mail },
      { value: "contacts", label: "Important Contacts", icon: Phone },
      { value: "meetings", label: "Meetings", icon: Calendar },
      { value: "suspend", label: "Suspend / Status", icon: AlertTriangle },
    ]
  },
];

// Flat tabs list for content rendering
const allTabs = tabGroups.flatMap(group => group.tabs);

export function ViewFullCarerProfileDialog({
  carerId,
  branchId,
  branchName,
  isOpen,
  onClose
}: ViewFullCarerProfileDialogProps) {
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [photoKey, setPhotoKey] = useState(0);

  const { data: carer, isLoading, error } = useCarerProfileById(carerId);

  const forceUIUnlock = useCallback(() => {
    const overlays = document.querySelectorAll(
      '[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay], .modal-backdrop'
    );
    overlays.forEach(el => el.remove());
    
    document.querySelectorAll('[aria-hidden="true"], [inert]').forEach(el => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
    });
    
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('overflow');
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.removeAttribute('data-scroll-locked');
    document.documentElement.removeAttribute('data-scroll-locked');
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(forceUIUnlock, 50);
  }, [onClose, forceUIUnlock]);

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-primary" />
              Loading Profile...
            </DialogTitle>
            <DialogDescription>
              Please wait while we load the carer profile
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading full profile...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !carer) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Error Loading Profile
            </DialogTitle>
            <DialogDescription>
              Unable to load carer profile
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">Failed to load carer profile</p>
              <Button onClick={handleClose} variant="outline">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent 
          className="max-w-7xl max-h-[95vh] p-0 overflow-hidden"
          onEscapeKeyDown={handleClose}
          onPointerDownOutside={handleClose}
        >
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <DialogTitle className="text-xl">
                  {carer.first_name} {carer.last_name} - Full Profile
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTransferDialog(true)}
                  className="flex items-center gap-2"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer Branch
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSharingDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            <DialogDescription>
              Comprehensive view of carer information, performance, and details
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-[calc(95vh-80px)]">
            {/* Left Sidebar - Navigation */}
            <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
              {/* Profile Summary Section */}
              <CarerProfileSummaryCard 
                carerId={carerId}
                carer={carer}
                onPhotoUpdate={() => {
                  setPhotoKey(prev => prev + 1);
                }}
              />
              
              <ScrollArea className="flex-1 min-h-0">
                <CarerProfileNavigation
                  tabGroups={tabGroups}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </ScrollArea>
            </div>

            {/* Right Panel - Content */}
            <div className="flex-1 flex flex-col">
              {/* Tab Title Header */}
              <div className="border-b border-border px-6 py-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {React.createElement(allTabs.find(t => t.value === activeTab)?.icon || User, { 
                    className: "h-4 w-4" 
                  })}
                  {allTabs.find(t => t.value === activeTab)?.label || "Overview"}
                </h3>
              </div>

              {/* Scrollable Content Area */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="min-h-full p-6">
                  <div className="animate-in fade-in-50 duration-300">
                    {activeTab === "overview" && <CarerOverviewTab carerId={carerId} branchName={branchName} />}
                    {activeTab === "personal" && <CarerPersonalDetailsTab carerId={carerId} />}
                    {activeTab === "general" && <CarerGeneralTab carerId={carerId} branchId={branchId} />}
                    {activeTab === "communication" && <CarerCommunicationTab carerId={carerId} />}
                    {activeTab === "suspend" && <CarerSuspendTab carerId={carerId} />}
                    {activeTab === "notes" && <CarerNotesTab carerId={carerId} />}
                    {activeTab === "quality" && <CarerQualityAssuranceTab carerId={carerId} />}
                    {activeTab === "attendance" && <CarerAttendanceTab carerId={carerId} />}
                    {activeTab === "essentials" && <CarerEssentialsTab carerId={carerId} />}
                    {activeTab === "employment" && <CarerEmploymentHistoryTab carerId={carerId} />}
                    {activeTab === "training" && <CarerTrainingTab carerId={carerId} />}
                    {activeTab === "statement" && <CarerSupportingStatementTab carerId={carerId} />}
                    {activeTab === "contacts" && <CarerImportantContactTab carerId={carerId} />}
                    {activeTab === "forms" && <CarerFormsTab carerId={carerId} branchId={branchId} />}
                    {activeTab === "skills" && <CarerSkillsTab carerId={carerId} />}
                    {activeTab === "work-type" && <CarerTypeOfWorkTab carerId={carerId} />}
                    {activeTab === "hobbies" && <CarerHobbiesTab carerId={carerId} />}
                    {activeTab === "meetings" && <CarerMeetingsTab carerId={carerId} branchId={branchId} />}
                    {activeTab === "documents" && <CarerDocumentsTab carerId={carerId} />}
                    {activeTab === "rate" && <CarerRateTab carerId={carerId} branchId={branchId} />}
                    {activeTab === "settings" && <CarerSettingsTab carerId={carerId} />}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sharing Dialog */}
      {carer && showSharingDialog && (
        <CarerProfileSharingDialog
          open={showSharingDialog}
          onOpenChange={setShowSharingDialog}
          carer={{
            id: carer.id,
            first_name: carer.first_name,
            last_name: carer.last_name,
            email: carer.email || '',
            phone: carer.phone || '',
            address: carer.address || '',
            status: carer.status,
            specialization: carer.specialization || '',
            experience: carer.experience || '',
            hire_date: carer.hire_date || '',
          }}
          branchId={branchId}
        />
      )}

      {/* Transfer Dialog */}
      {carer && showTransferDialog && (
        <TransferBranchDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          staff={{
            id: carer.id,
            first_name: carer.first_name,
            last_name: carer.last_name,
            branch_id: branchId,
          }}
          currentBranchName={branchName || 'Current Branch'}
          onTransferComplete={() => {
            setShowTransferDialog(false);
            handleClose();
          }}
        />
      )}
    </>
  );
}
