
import React, { useState } from "react";
import { X, FileEdit, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { generatePDF } from "@/utils/pdfGenerator";

import { PatientHeader } from "./PatientHeader";
import { CarePlanSidebar } from "./CarePlanSidebar";
import { CarePlanTabBar } from "./CarePlanTabBar";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { AboutMeTab } from "./tabs/AboutMeTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { DietaryTab } from "./tabs/DietaryTab";

import { mockPatientData } from "@/data/mockPatientData";

interface CarePlanDetailProps {
  carePlan: {
    id: string;
    patientName: string;
    patientId: string;
    dateCreated: Date;
    lastUpdated: Date;
    status: string;
    assignedTo: string;
    avatar: string;
  } | null;
  onClose: () => void;
  onAddNote?: () => void;
  onScheduleFollowUp?: () => void;
  onRecordActivity?: () => void;
  onUploadDocument?: () => void;
}

export const CarePlanDetail: React.FC<CarePlanDetailProps> = ({ 
  carePlan, 
  onClose,
  onAddNote,
  onScheduleFollowUp,
  onRecordActivity,
  onUploadDocument
}) => {
  const [activeTab, setActiveTab] = useState("personal");

  if (!carePlan) return null;

  const handlePrintCarePlan = () => {
    generatePDF({
      id: parseInt(carePlan.id.replace('CP-', '')),
      title: `Care Plan for ${carePlan.patientName}`,
      date: format(carePlan.lastUpdated, 'yyyy-MM-dd'),
      status: carePlan.status,
      signedBy: carePlan.assignedTo
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
              {carePlan.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold">{carePlan.patientName}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Patient ID: {carePlan.patientId}</span>
                <span>•</span>
                <span>Plan ID: {carePlan.id}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePrintCarePlan} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-full md:w-1/3">
              <CarePlanSidebar 
                carePlan={carePlan}
                onAddNote={onAddNote}
                onScheduleFollowUp={onScheduleFollowUp}
                onRecordActivity={onRecordActivity}
                onUploadDocument={onUploadDocument}
              />
            </div>
            
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
                
                <TabsContent value="personal">
                  <PersonalInfoTab carePlan={carePlan} mockPatientData={mockPatientData} />
                </TabsContent>
                
                <TabsContent value="aboutme">
                  <AboutMeTab aboutMe={mockPatientData.aboutMe} />
                </TabsContent>
                
                <TabsContent value="goals">
                  <GoalsTab goals={mockPatientData.goals} />
                </TabsContent>
                
                <TabsContent value="activities">
                  {/* Activities tab content will be implemented */}
                </TabsContent>
                
                <TabsContent value="notes">
                  {/* Notes tab content will be implemented */}
                </TabsContent>
                
                <TabsContent value="documents">
                  {/* Documents tab content will be implemented */}
                </TabsContent>
                
                <TabsContent value="assessments">
                  {/* Assessments tab content will be implemented */}
                </TabsContent>
                
                <TabsContent value="equipment">
                  {/* Equipment tab content will be implemented */}
                </TabsContent>
                
                <TabsContent value="dietary">
                  <DietaryTab dietaryRequirements={mockPatientData.dietaryRequirements} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
