import React, { useState, useCallback, useMemo } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      { value: "statement", label: "Statement", icon: FileText },
      { value: "hobbies", label: "Hobbies", icon: Heart },
    ]
  },
  {
    id: "employment",
    label: "Employment",
    icon: Briefcase,
    tabs: [
      { value: "general", label: "General", icon: Sliders },
      { value: "employment", label: "History", icon: Briefcase },
      { value: "work-type", label: "Work Type", icon: Briefcase },
      { value: "skills", label: "Skills", icon: Award },
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
      { value: "training", label: "Training", icon: GraduationCap },
      { value: "forms", label: "Forms", icon: ClipboardList },
      { value: "quality", label: "Quality", icon: Star },
    ]
  },
  {
    id: "activity",
    label: "Activity",
    icon: MessageCircle,
    tabs: [
      { value: "notes", label: "Notes", icon: MessageCircle },
      { value: "communication", label: "Messages", icon: Mail },
      { value: "contacts", label: "Contacts", icon: Phone },
      { value: "meetings", label: "Meetings", icon: Calendar },
      { value: "suspend", label: "Status", icon: AlertTriangle },
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
  const [activeGroup, setActiveGroup] = useState("profile");
  const [activeTab, setActiveTab] = useState("overview");
  const [photoKey, setPhotoKey] = useState(0);

  const { data: carer, isLoading, error } = useCarerProfileById(carerId);

  // Get current group's sub-tabs
  const currentGroupTabs = useMemo(() => {
    return tabGroups.find(g => g.id === activeGroup)?.tabs || [];
  }, [activeGroup]);

  // Handle group change - auto-select first tab
  const handleGroupChange = useCallback((group: string) => {
    setActiveGroup(group);
    const firstTab = tabGroups.find(g => g.id === group)?.tabs[0];
    if (firstTab) setActiveTab(firstTab.value);
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

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

          {/* Primary Tab Bar - Group Level (Always visible at top) */}
          <div className="border-b border-border px-6 py-2 bg-muted/30">
            <Tabs value={activeGroup} onValueChange={handleGroupChange}>
              <TabsList className="h-9 bg-transparent p-0 gap-1">
                {tabGroups.map((group) => (
                  <TabsTrigger
                    key={group.id}
                    value={group.id}
                    className="gap-1.5 px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <group.icon className="h-4 w-4" />
                    {group.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Staff Profile Summary - Two Column, Always Visible */}
          <CarerProfileSummaryCard 
            carerId={carerId}
            carer={carer}
            onPhotoUpdate={() => setPhotoKey(prev => prev + 1)}
          />

          {/* Secondary Tab Bar - Sub-tabs for current group */}
          <div className="border-b border-border px-6 py-2 bg-background">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="h-8 bg-muted/50 p-0.5">
                {currentGroupTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="gap-1.5 px-3 py-1 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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
