
import React, { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  CheckCircle, AlertCircle, FileText, User, Activity, Target, 
  Utensils, Shield, Wrench, Calendar, ClipboardList, Upload, XCircle, 
  Pill, Syringe, ClipboardCheck, Heart, ListChecks, AlertTriangle, 
  GraduationCap, ShieldAlert, HeartPulse, Users, ArrowRight 
} from "lucide-react";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  hasAboutMe,
  hasMedicalInfo,
  hasDiagnosisInfo,
  hasNews2Monitoring,
  hasMedicationSchedule,
  hasMedicationAdministration,
  hasConsentInfo,
  hasRiskAssessments,
  hasEquipment,
  hasKeyContacts,
  hasAnyValue,
} from "@/utils/carePlanCompletionUtils";
import { useMedicationsByCarePlan } from "@/hooks/useMedications";

interface WizardStep14ReviewProps {
  form: UseFormReturn<any>;
  clientId?: string;
  isChild?: boolean;
  effectiveCarePlanId?: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  data: any;
  status?: string;
  childOnly?: boolean;
}

interface RequirementItem {
  id: string;
  label: string;
  isComplete: boolean;
  missingMessage?: string;
  stepToFix?: string;
}

export function WizardStep14Review({ form, clientId, isChild = false, effectiveCarePlanId }: WizardStep14ReviewProps) {
  const formData = form.watch();
  
  // Fetch DB medications to get accurate count
  const { data: dbMedications = [] } = useMedicationsByCarePlan(effectiveCarePlanId);
  
  // Calculate effective medication count (DB + any unsaved local meds)
  const effectiveMedicationCount = useMemo(() => {
    const localMeds = formData.medical_info?.medication_manager?.medications || [];
    const dbMedNames = new Set(dbMedications.map((m: any) => `${m.name}-${m.dosage}-${m.frequency}`.toLowerCase()));
    
    // Count unique local meds not already in DB
    const uniqueLocalCount = localMeds.filter((m: any) => 
      !dbMedNames.has(`${m.name}-${m.dosage}-${m.frequency}`.toLowerCase())
    ).length;
    
    return dbMedications.length + uniqueLocalCount;
  }, [dbMedications, formData.medical_info?.medication_manager?.medications]);

  // Use unified validation functions for consistent status across the app
  const getSectionStatus = (sectionId: string, sectionData: any): "completed" | "empty" => {
    switch (sectionId) {
      case "about_me":
        return hasAboutMe(sectionData) ? "completed" : "empty";
      case "medical_info":
        // Use hasDiagnosisInfo for proper diagnosis/medical_info detection
        return hasDiagnosisInfo(formData) ? "completed" : "empty";
      case "news2_monitoring":
        return hasNews2Monitoring(formData.medical_info) ? "completed" : "empty";
      case "medication_schedule":
        return hasMedicationSchedule(formData.medical_info, effectiveMedicationCount) ? "completed" : "empty";
      case "medication":
        return hasMedicationSchedule(formData.medical_info, effectiveMedicationCount) ? "completed" : "empty";
      case "admin_medication":
        return hasMedicationAdministration(formData) ? "completed" : "empty";
      case "consent":
        return hasConsentInfo(sectionData) ? "completed" : "empty";
      case "risk_assessments":
        return hasRiskAssessments(formData) ? "completed" : "empty";
      case "equipment":
        return hasEquipment(sectionData) ? "completed" : "empty";
      case "key_contacts":
        return hasKeyContacts(formData) ? "completed" : "empty";
      case "personal_care":
      case "dietary":
      case "behavior_support":
      case "education_development":
      case "safeguarding_risks":
        return hasAnyValue(sectionData) ? "completed" : "empty";
      case "goals":
      case "activities":
      case "service_plans":
      case "service_actions":
      case "documents":
        return Array.isArray(sectionData) && sectionData.length > 0 ? "completed" : "empty";
      case "basic_info":
      case "personal_info":
        // For basic/personal info, check if any field has content
        if (!sectionData) return "empty";
        if (typeof sectionData === "object" && Object.keys(sectionData).length === 0) return "empty";
        return hasAnyValue(sectionData) ? "completed" : "empty";
      default:
        // Fallback for any other sections
        if (!sectionData) return "empty";
        if (typeof sectionData === "object" && Object.keys(sectionData).length === 0) return "empty";
        if (Array.isArray(sectionData) && sectionData.length === 0) return "empty";
        return "completed";
    }
  };

  const allSections: Section[] = [
    {
      id: "basic_info",
      title: "Basic Information",
      icon: FileText,
      data: {
        title: formData.title,
        provider_type: formData.provider_type,
        start_date: formData.start_date,
        priority: formData.priority
      }
    },
    {
      id: "personal_info",
      title: "Personal Information",
      icon: User,
      data: formData.personal_info
    },
    {
      id: "about_me",
      title: "About Me",
      icon: User,
      data: formData.about_me
    },
    {
      id: "medical_info",
      title: "Diagnosis",
      icon: ClipboardList,
      data: formData.diagnosis ?? formData.medical_info
    },
    {
      id: "news2_monitoring",
      title: "NEWS2 Health Monitoring",
      icon: HeartPulse,
      data: formData.medical_info?.news2_monitoring,
      status: formData.news2_monitoring_enabled 
        ? `Enabled (${formData.news2_monitoring_frequency || 'Daily'})` 
        : formData.medical_info?.news2_monitoring 
          ? 'Configured' 
          : undefined
    },
    {
      id: "medication_schedule",
      title: "Medication Schedule",
      icon: Calendar,
      data: formData.medical_info?.medication_manager,
      status: formData.medical_info?.medication_manager?.applicable !== false 
        ? (effectiveMedicationCount > 0 
            ? `${effectiveMedicationCount} medication(s) scheduled` 
            : 'No medications scheduled')
        : 'Not Applicable'
    },
    {
      id: "medication",
      title: "Medication",
      icon: Pill,
      data: formData.medical_info?.medication_manager?.medications,
      status: formData.medical_info?.medication_manager?.applicable !== false 
        ? (effectiveMedicationCount > 0 
            ? `Applicable (${effectiveMedicationCount} medication${effectiveMedicationCount !== 1 ? 's' : ''})` 
            : 'Applicable (No medications added)')
        : 'Not Applicable'
    },
    {
      id: "admin_medication",
      title: "Medication Administration",
      icon: Syringe,
      data: formData.medical_info?.admin_medication
    },
    {
      id: "goals",
      title: "Goals",
      icon: Target,
      data: formData.goals,
      status: formData.goals?.length > 0 
        ? `${formData.goals.length} goal${formData.goals.length !== 1 ? 's' : ''} set` 
        : undefined
    },
    {
      id: "activities",
      title: "Activities",
      icon: Activity,
      data: formData.activities,
      status: formData.activities?.length > 0 
        ? `${formData.activities.length} activit${formData.activities.length !== 1 ? 'ies' : 'y'} planned` 
        : undefined
    },
    {
      id: "personal_care",
      title: "Personal Care",
      icon: User,
      data: formData.personal_care
    },
    {
      id: "dietary",
      title: "Dietary Requirements",
      icon: Utensils,
      data: formData.dietary
    },
    {
      id: "risk_assessments",
      title: "Risk Assessments",
      icon: Shield,
      data: formData.risk_assessments,
      status: formData.risk_assessments?.length > 0 
        ? `${formData.risk_assessments.length} assessment${formData.risk_assessments.length !== 1 ? 's' : ''} completed` 
        : undefined
    },
    {
      id: "equipment",
      title: "Equipment",
      icon: Wrench,
      data: formData.equipment
    },
    {
      id: "service_plans",
      title: "Service Plans",
      icon: Calendar,
      data: formData.service_plans,
      status: formData.service_plans?.length > 0 
        ? `${formData.service_plans.length} plan${formData.service_plans.length !== 1 ? 's' : ''} created` 
        : undefined
    },
    {
      id: "service_actions",
      title: "Service Actions",
      icon: Activity,
      data: formData.service_actions
    },
    {
      id: "documents",
      title: "Documents",
      icon: Upload,
      data: formData.documents,
      status: formData.documents?.length > 0 
        ? `${formData.documents.length} document${formData.documents.length !== 1 ? 's' : ''} uploaded` 
        : undefined
    },
    {
      id: "consent",
      title: "Consent",
      icon: ClipboardCheck,
      data: formData.consent
    },
    {
      id: "key_contacts",
      title: "Key Contacts",
      icon: Users,
      data: formData.key_contacts,
      status: formData.key_contacts?.length > 0 
        ? `${formData.key_contacts.length} contact${formData.key_contacts.length !== 1 ? 's' : ''} added` 
        : undefined
    },
    // Child-specific sections
    {
      id: "behavior_support",
      title: "Behavior Support",
      icon: AlertTriangle,
      data: formData.behavior_support,
      childOnly: true
    },
    {
      id: "education_development",
      title: "Education & Development",
      icon: GraduationCap,
      data: formData.education_development,
      childOnly: true
    },
    {
      id: "safeguarding_risks",
      title: "Safeguarding & Risks",
      icon: ShieldAlert,
      data: formData.safeguarding,
      childOnly: true
    }
  ];

  // Filter sections based on client type (child vs adult)
  const sections = isChild 
    ? allSections 
    : allSections.filter(section => !section.childOnly);

  const completedSections = sections.filter(section => getSectionStatus(section.id, section.data) === "completed");
  const emptySections = sections.filter(section => getSectionStatus(section.id, section.data) === "empty");

  // Check if care plan has enough content to be finalized
  const hasMinimumContent = completedSections.length >= 3; // Require at least 3 sections to be complete

  // Check provider requirements
  const hasTitle = !!formData.title?.trim();
  const hasProviderType = !!formData.provider_type;
  const hasProviderAssignment = formData.provider_type === 'staff' 
    ? !!formData.staff_id 
    : formData.provider_type === 'external' 
      ? !!formData.provider_name?.trim()
      : false;
  const hasProviderInfo = hasProviderType && hasProviderAssignment;

  // All publication requirements
  const publicationRequirements: RequirementItem[] = [
    {
      id: 'title',
      label: 'Care Plan Title',
      isComplete: hasTitle,
      missingMessage: 'Enter a title for the care plan',
      stepToFix: 'Step 1 (Basic Information)'
    },
    {
      id: 'provider_type',
      label: 'Provider Type Selected',
      isComplete: hasProviderType,
      missingMessage: 'Select whether the provider is Staff or External',
      stepToFix: 'Step 1 (Basic Information)'
    },
    {
      id: 'provider_assignment',
      label: formData.provider_type === 'staff' ? 'Staff Member Assigned' : formData.provider_type === 'external' ? 'External Provider Name' : 'Provider Assignment',
      isComplete: hasProviderAssignment,
      missingMessage: formData.provider_type === 'staff' 
        ? 'Select a staff member to assign to this care plan'
        : formData.provider_type === 'external'
          ? 'Enter the external provider name'
          : 'First select a provider type, then assign a provider',
      stepToFix: 'Step 1 (Basic Information)'
    },
    {
      id: 'minimum_content',
      label: `Minimum Content (${completedSections.length}/3 sections)`,
      isComplete: hasMinimumContent,
      missingMessage: `Complete at least 3 sections. Consider adding: Goals, Activities, Personal Care, or Medical Information`,
      stepToFix: 'Any content section (Steps 2-17)'
    }
  ];

  const canPublish = publicationRequirements.every(req => req.isComplete);
  const incompleteRequirements = publicationRequirements.filter(req => !req.isComplete);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review & Finalize</h2>
        <p className="text-gray-600">
          Review all information and finalize the care plan. You can go back to any section to make changes.
        </p>
      </div>

      {/* Publication Requirements Checklist - PROMINENT AT TOP */}
      <Card className={canPublish ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 ${canPublish ? "text-green-800" : "text-red-800"}`}>
            {canPublish ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Publication Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Requirements List */}
          <div className="space-y-2">
            {publicationRequirements.map((req) => (
              <div 
                key={req.id} 
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  req.isComplete ? 'bg-green-100/50' : 'bg-red-100/50'
                }`}
              >
                {req.isComplete ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${req.isComplete ? 'text-green-800' : 'text-red-800'}`}>
                    {req.label}
                  </p>
                  {!req.isComplete && req.missingMessage && (
                    <p className="text-sm text-red-600 mt-1">
                      {req.missingMessage}
                    </p>
                  )}
                  {!req.isComplete && req.stepToFix && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Go to: <span className="font-medium">{req.stepToFix}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Message */}
          <Separator />
          <div className={`p-3 rounded-lg ${canPublish ? 'bg-green-200/50' : 'bg-red-200/50'}`}>
            {canPublish ? (
              <p className="text-green-800 font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                All requirements met! You can now send this care plan for approval.
              </p>
            ) : (
              <div>
                <p className="text-red-800 font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {incompleteRequirements.length} requirement{incompleteRequirements.length !== 1 ? 's' : ''} must be completed before publishing
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Use the "Previous" button or step navigation to go back and complete the missing items.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completion Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Completion Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedSections.length}</div>
              <div className="text-sm text-gray-600">Completed Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{emptySections.length}</div>
              <div className="text-sm text-gray-600">Empty Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((completedSections.length / sections.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Overall Completion</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSections.length / sections.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Section Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sections.map((section) => {
              const status = getSectionStatus(section.id, section.data);
              const Icon = section.icon;
              
              // Special handling for section with custom status
              const displayStatus = section.status || (status === "completed" ? "Complete" : "Empty");
              const badgeVariant = status === "completed" ? "default" : "secondary";
              
              return (
                <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{section.title}</span>
                    {section.childOnly && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Child
                      </Badge>
                    )}
                  </div>
                  <Badge variant={badgeVariant}>
                    {displayStatus}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Information Summary */}
      {formData.title && (
        <Card>
          <CardHeader>
            <CardTitle>Care Plan Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-600">Care Plan Title</div>
                <div className="text-lg">{formData.title}</div>
              </div>
              
              {formData.provider_name && (
                <div>
                  <div className="text-sm font-medium text-gray-600">Provider</div>
                  <div className="text-lg">{formData.provider_name}</div>
                </div>
              )}
              
              {formData.start_date && (
                <div>
                  <div className="text-sm font-medium text-gray-600">Start Date</div>
                  <div className="text-lg">{format(new Date(formData.start_date), "PPP")}</div>
                </div>
              )}
              
              {formData.priority && (
                <div>
                  <div className="text-sm font-medium text-gray-600">Priority</div>
                  <Badge variant={formData.priority === "high" ? "destructive" : formData.priority === "medium" ? "default" : "secondary"}>
                    {formData.priority.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>

            {(formData.goals?.length > 0 || formData.activities?.length > 0) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.goals?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Goals ({formData.goals.length})</div>
                      <div className="space-y-1">
                        {formData.goals.slice(0, 3).map((goal: any, index: number) => (
                          <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                            {goal.description?.substring(0, 50)}{goal.description?.length > 50 ? "..." : ""}
                          </div>
                        ))}
                        {formData.goals.length > 3 && (
                          <div className="text-xs text-gray-500">+{formData.goals.length - 3} more goals</div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.activities?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Activities ({formData.activities.length})</div>
                      <div className="space-y-1">
                        {formData.activities.slice(0, 3).map((activity: any, index: number) => (
                          <div key={index} className="text-sm bg-green-50 p-2 rounded">
                            {activity.name}
                          </div>
                        ))}
                        {formData.activities.length > 3 && (
                          <div className="text-xs text-gray-500">+{formData.activities.length - 3} more activities</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Incomplete Sections Warning */}
      {emptySections.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Incomplete Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-3">
              The following sections are empty. While you can finalize the care plan now, 
              consider completing these sections for a more comprehensive plan:
            </p>
            <div className="flex flex-wrap gap-2">
              {emptySections.map((section) => (
                <Badge key={section.id} variant="outline" className="text-amber-700 border-amber-300">
                  {section.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insufficient Content Warning */}
      {!hasMinimumContent && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              Insufficient Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-3">
              This care plan needs more content before it can be finalized. Please complete at least 3 sections with meaningful information.
            </p>
            <p className="text-sm text-red-600">
              Currently completed: {completedSections.length} of {sections.length} sections (minimum required: 3)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      <Form {...form}>
        <FormField
          control={form.control}
          name="additional_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any final notes or instructions for this care plan..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>

      {/* Finalization Notice */}
      {hasMinimumContent ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">Ready to Finalize</h4>
                <p className="text-sm text-green-700">
                  This care plan will be sent to the client for approval before becoming active. 
                  You can still make changes during the approval process if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Not Ready for Finalization</h4>
                <p className="text-sm text-gray-700">
                  Please add more content to at least 3 sections before finalizing this care plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
