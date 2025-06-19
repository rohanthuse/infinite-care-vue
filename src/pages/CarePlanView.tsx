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

  // Mock care plan data - in a real app, this would come from the API
  const carePlan = {
    id: carePlanId || "CP-001",
    patientName: "Sarah Johnson",
    patientId: "client-001",
    dateCreated: new Date("2024-01-15"),
    lastUpdated: new Date("2024-03-10"),
    status: "Active",
    assignedTo: "Dr. Emily Chen",
    avatar: "SJ"
  };

  // Fetch comprehensive care plan data
  const {
    data: comprehensiveData,
    isLoading,
    error
  } = useComprehensiveCarePlanData(carePlan.patientId);

  // Get the actual client UUID from comprehensive data
  const clientId = comprehensiveData?.client?.id || carePlan.patientId;
  
  // Fetch medical information
  const { data: medicalInfo } = useClientMedicalInfo(clientId);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading care plan data</p>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-gray-500">Plan ID: {carePlan.id}</p>
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
