
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CheckCircle, AlertCircle, FileText, User, Activity, Target, Utensils, Shield, Wrench, Calendar, ClipboardList, Upload, XCircle, Pill, Syringe, ClipboardCheck, Heart, ListChecks } from "lucide-react";
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

interface WizardStep14ReviewProps {
  form: UseFormReturn<any>;
}

export function WizardStep14Review({ form }: WizardStep14ReviewProps) {
  const formData = form.watch();

  const getSectionStatus = (sectionData: any) => {
    if (!sectionData) return "empty";
    if (typeof sectionData === "object" && Object.keys(sectionData).length === 0) return "empty";
    if (Array.isArray(sectionData) && sectionData.length === 0) return "empty";
    return "completed";
  };

  const sections = [
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
      id: "consent",
      title: "Consent",
      icon: ClipboardCheck,
      data: formData.consent
    },
    {
      id: "medication",
      title: "Medication",
      icon: Pill,
      data: formData.medical_info?.medication_manager?.medications,
      status: formData.medical_info?.medication_manager?.applicable !== false 
        ? (formData.medical_info?.medication_manager?.medications?.length > 0 
            ? `Applicable (${formData.medical_info?.medication_manager?.medications?.length} medication${formData.medical_info?.medication_manager?.medications?.length !== 1 ? 's' : ''})` 
            : 'Applicable (No medications added)')
        : 'Not Applicable'
    },
    {
      id: "admin_medication",
      title: "Admin Medication",
      icon: Syringe,
      data: formData.medical_info?.admin_medication
    },
    {
      id: "medical_info",
      title: "Medical Information",
      icon: ClipboardList,
      data: formData.medical_info
    },
    {
      id: "goals",
      title: "Goals",
      icon: Target,
      data: formData.goals
    },
    {
      id: "activities",
      title: "Activities",
      icon: Activity,
      data: formData.activities
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
      data: formData.risk_assessments
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
      data: formData.service_plans
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
      data: formData.documents
    }
  ];

  const completedSections = sections.filter(section => getSectionStatus(section.data) === "completed");
  const emptySections = sections.filter(section => getSectionStatus(section.data) === "empty");

  // Check if care plan has enough content to be finalized
  const hasMinimumContent = completedSections.length >= 3; // Require at least 3 sections to be complete

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review & Finalize</h2>
        <p className="text-gray-600">
          Review all information and finalize the care plan. You can go back to any section to make changes.
        </p>
      </div>

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
              const status = getSectionStatus(section.data);
              const Icon = section.icon;
              
              // Special handling for medication section with custom status
              const displayStatus = (section as any).status || (status === "completed" ? "Complete" : "Empty");
              const badgeVariant = status === "completed" ? "default" : "secondary";
              
              return (
                <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{section.title}</span>
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
                  This care plan will be sent for staff approval before becoming active. 
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
