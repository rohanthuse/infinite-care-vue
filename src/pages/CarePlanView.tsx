
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, FileEdit, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PatientHeader } from "@/components/care/PatientHeader";
import { CarePlanSidebar } from "@/components/care/CarePlanSidebar";
import { CarePlanTabBar } from "@/components/care/CarePlanTabBar";
import { PersonalInfoTab } from "@/components/care/tabs/PersonalInfoTab";
import { EditMedicalInfoDialog } from "@/components/care/dialogs/EditMedicalInfoDialog";
import { useComprehensiveCarePlanData } from "@/hooks/useCarePlanData";
import { useClientMedicalInfo, useUpdateClientMedicalInfo } from "@/hooks/useClientMedicalInfo";
import { toast } from "@/hooks/use-toast";

export default function CarePlanView() {
  const { carePlanId } = useParams();
  const [activeTab, setActiveTab] = useState("personal");
  const [medicalInfoDialogOpen, setMedicalInfoDialogOpen] = useState(false);

  // Fetch comprehensive care plan data using the ID from URL params
  const {
    data: comprehensiveData,
    isLoading,
    error
  } = useComprehensiveCarePlanData(carePlanId || "");

  // Get the actual client UUID from comprehensive data
  const clientId = comprehensiveData?.client?.id;
  
  // Fetch medical information
  const { data: medicalInfo } = useClientMedicalInfo(clientId || "");
  const updateMedicalInfoMutation = useUpdateClientMedicalInfo();

  const handleEditMedicalInfo = () => {
    console.log('[CarePlanView] Edit medical info button clicked');
    setMedicalInfoDialogOpen(true);
  };

  const handleSaveMedicalInfo = async (data: any) => {
    console.log('[CarePlanView] handleSaveMedicalInfo called with data:', data);
    
    if (!clientId) {
      console.error('[CarePlanView] No client ID found for medical info save');
      toast({
        title: "Error",
        description: "Client ID not found. Cannot save medical information.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[CarePlanView] Attempting to save medical info...');
      const result = await updateMedicalInfoMutation.mutateAsync({
        client_id: clientId,
        ...data
      });
      
      console.log('[CarePlanView] Medical info save successful:', result);

      setMedicalInfoDialogOpen(false);
      toast({
        title: "Medical information updated",
        description: "The medical information has been successfully updated."
      });
    } catch (error) {
      console.error('[CarePlanView] Error updating medical info:', error);
      toast({
        title: "Error",
        description: "Failed to update medical information. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading care plan...</p>
        </div>
      </div>
    );
  }

  if (error || !comprehensiveData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Care Plan Not Found</h3>
          <p className="text-gray-600 mb-4">
            The care plan with ID "{carePlanId}" could not be found. It may have been moved or deleted.
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/branch-dashboard'} className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Create care plan object from the fetched data
  const carePlan = {
    id: comprehensiveData.id,
    patientName: `${comprehensiveData.client?.first_name || ''} ${comprehensiveData.client?.last_name || ''}`.trim(),
    patientId: comprehensiveData.client?.id || '',
    dateCreated: new Date(comprehensiveData.created_at),
    lastUpdated: new Date(comprehensiveData.updated_at),
    status: comprehensiveData.status,
    assignedTo: comprehensiveData.provider_name,
    avatar: comprehensiveData.client?.avatar_initials || 
             `${comprehensiveData.client?.first_name?.[0] || ''}${comprehensiveData.client?.last_name?.[0] || ''}` || 'N/A'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Care Plan Details</h1>
                <p className="text-sm text-gray-500">Plan ID: {carePlanId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileEdit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <CarePlanSidebar carePlan={carePlan} />
          </div>
          
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
              
              <TabsContent value="personal" className="mt-6">
                <PersonalInfoTab 
                  client={comprehensiveData?.client}
                  personalInfo={comprehensiveData?.personalInfo}
                  medicalInfo={medicalInfo}
                  onEditMedicalInfo={handleEditMedicalInfo}
                />
              </TabsContent>
              
              {/* Other tabs would go here */}
            </Tabs>
          </div>
        </div>
      </div>

      <EditMedicalInfoDialog
        open={medicalInfoDialogOpen}
        onOpenChange={setMedicalInfoDialogOpen}
        onSave={handleSaveMedicalInfo}
        medicalInfo={medicalInfo}
        isLoading={updateMedicalInfoMutation.isPending}
      />
    </div>
  );
}
