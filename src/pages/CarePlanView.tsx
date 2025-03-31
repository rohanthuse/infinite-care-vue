import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity, ChevronLeft,
  ChevronRight, FileEdit, Download, ArrowLeft, 
  ShieldAlert, Utensils, Bath, Wrench, ClipboardList, FileBarChart2
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { generatePDF } from "@/utils/pdfGenerator";
import { toast } from "@/components/ui/use-toast";
import { PatientHeader } from "@/components/care/PatientHeader";
import { AboutMeTab } from "@/components/care/tabs/AboutMeTab";
import { GoalsTab } from "@/components/care/tabs/GoalsTab";
import { CarePlanTabBar } from "@/components/care/CarePlanTabBar";
import { NotesTab } from "@/components/care/tabs/NotesTab";
import { DocumentsTab } from "@/components/care/tabs/DocumentsTab";
import { AssessmentsTab } from "@/components/care/tabs/AssessmentsTab";
import { ActivitiesTab } from "@/components/care/tabs/ActivitiesTab";
import { EquipmentTab } from "@/components/care/tabs/EquipmentTab";
import { DietaryTab } from "@/components/care/tabs/DietaryTab";
import { PersonalCareTab } from "@/components/care/tabs/PersonalCareTab";
import { RiskTab } from "@/components/care/tabs/RiskTab";
import { ServicePlanTab } from "@/components/care/tabs/ServicePlanTab";
import { ServiceActionsTab } from "@/components/care/tabs/ServiceActionsTab";
import { getStatusBadgeClass, getRiskLevelClass, calculateProgressPercentage } from "@/utils/statusHelpers";
import { mockPatientData } from "@/data/mockPatientData";

const mockCarePlans = [
  {
    id: "CP-001",
    patientName: "John Michael",
    patientId: "PT-2356",
    dateCreated: new Date("2023-10-15"),
    lastUpdated: new Date("2023-11-05"),
    status: "Active",
    assignedTo: "Dr. Sarah Johnson",
    avatar: "JM"
  },
  {
    id: "CP-002",
    patientName: "Emma Thompson",
    patientId: "PT-1122",
    dateCreated: new Date("2023-09-22"),
    lastUpdated: new Date("2023-10-30"),
    status: "Under Review",
    assignedTo: "Dr. James Wilson",
    avatar: "ET"
  }
];

const CarePlanView = () => {
  const { id: branchId, branchName, carePlanId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [carePlan, setCarePlan] = useState<typeof mockCarePlans[0] | null>(null);

  useEffect(() => {
    const plan = mockCarePlans.find(p => p.id === carePlanId);
    if (plan) {
      setCarePlan(plan);
    }
  }, [carePlanId]);

  const handlePrintCarePlan = () => {
    if (!carePlan) return;
    
    generatePDF({
      id: parseInt(carePlan.id.replace('CP-', '')),
      title: `Care Plan for ${carePlan.patientName}`,
      date: format(carePlan.lastUpdated, 'yyyy-MM-dd'),
      status: carePlan.status,
      signedBy: carePlan.assignedTo
    });
  };

  const handleNewBooking = () => {
    toast({
      title: "New Booking",
      description: "Booking functionality will be implemented soon.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BranchInfoHeader 
        branchId={branchId || ""} 
        branchName={branchName || ""} 
        onNewBooking={handleNewBooking} 
      />
      
      <div className="flex-1 p-6 space-y-6">
        <TabNavigation
          activeTab="care-plan"
          onChange={(tab) => navigate(`/branch-dashboard/${branchId}/${branchName}/${tab}`)}
        />
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="border-b pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 bg-blue-50 p-2 rounded-lg">
                  <h3 className="text-blue-700 font-bold">Med-Infinite</h3>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Care Plan Management</h1>
                  <p className="text-gray-500">Comprehensive patient care documentation</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/branch-dashboard/${branchId}/${branchName}/care-plan`)}
                className="h-8 w-8 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Care Plan Details</h1>
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
            </div>
          </div>
          
          {carePlan && (
            <div className="flex flex-col space-y-6">
              <PatientHeader carePlan={carePlan} />
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Care Plan Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <Badge variant="outline" className={getStatusBadgeClass(carePlan.status)}>
                          {carePlan.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Assigned To</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-xs">
                              {carePlan.assignedTo.split(' ').map(n => n[0]).join('')}
                            </div>
                          </Avatar>
                          <span className="text-sm">{carePlan.assignedTo}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Created On</p>
                        <p className="text-sm">{format(carePlan.dateCreated, 'MMM dd, yyyy')}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Updated</p>
                        <p className="text-sm">{format(carePlan.lastUpdated, 'MMM dd, yyyy')}</p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Quick Actions</p>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            <span>Add Note</span>
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Schedule Follow-up</span>
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Activity className="h-4 w-4 mr-2" />
                            <span>Record Activity</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="w-full md:w-3/4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <CarePlanTabBar activeTab={activeTab} onChange={setActiveTab} />
                    
                    <TabsContent value="personal" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Full Name</p>
                              <p className="text-sm">{carePlan.patientName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Patient ID</p>
                              <p className="text-sm">{carePlan.patientId}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Gender</p>
                              <p className="text-sm">{mockPatientData.gender}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                              <p className="text-sm">{format(mockPatientData.dateOfBirth, 'MMM dd, yyyy')} (Age: {new Date().getFullYear() - mockPatientData.dateOfBirth.getFullYear()})</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Address</p>
                              <p className="text-sm">{mockPatientData.address}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Phone</p>
                              <p className="text-sm">{mockPatientData.phone}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Email</p>
                              <p className="text-sm">{mockPatientData.email}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Preferred Language</p>
                              <p className="text-sm">{mockPatientData.preferredLanguage}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-500">Emergency Contact</p>
                              <p className="text-sm">{mockPatientData.emergencyContact}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Medical Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Allergies</p>
                              <div className="flex flex-wrap gap-1">
                                {mockPatientData.allergies.map((allergy, index) => (
                                  <Badge key={index} variant="outline" className="text-red-600 bg-red-50 border-red-200">
                                    {allergy}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Medical Conditions</p>
                              <div className="flex flex-wrap gap-1">
                                {mockPatientData.medicalConditions.map((condition, index) => (
                                  <Badge key={index} variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Medications</p>
                              <div className="grid grid-cols-1 gap-2">
                                {mockPatientData.medications.map((medication, index) => (
                                  <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-gray-50">
                                    <div>
                                      <p className="font-medium text-sm">{medication.name} ({medication.dosage})</p>
                                      <p className="text-xs text-gray-500">{medication.frequency} - {medication.purpose}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="aboutme" className="space-y-4">
                      <AboutMeTab aboutMe={mockPatientData.aboutMe} />
                    </TabsContent>
                    
                    <TabsContent value="goals" className="space-y-4">
                      <GoalsTab goals={mockPatientData.goals} />
                    </TabsContent>
                    
                    <TabsContent value="activities" className="space-y-4">
                      <ActivitiesTab activities={mockPatientData.activities} />
                    </TabsContent>
                    
                    <TabsContent value="notes" className="space-y-4">
                      <NotesTab notes={mockPatientData.notes} />
                    </TabsContent>
                    
                    <TabsContent value="documents" className="space-y-4">
                      <DocumentsTab documents={mockPatientData.documents} />
                    </TabsContent>
                    
                    <TabsContent value="assessments" className="space-y-4">
                      <AssessmentsTab assessments={mockPatientData.assessments} />
                    </TabsContent>
                    
                    <TabsContent value="equipment" className="space-y-4">
                      <EquipmentTab equipment={mockPatientData.equipment} />
                    </TabsContent>
                    
                    <TabsContent value="dietary" className="space-y-4">
                      <DietaryTab dietaryRequirements={mockPatientData.dietaryRequirements} />
                    </TabsContent>
                    
                    <TabsContent value="personalcare" className="space-y-4">
                      <PersonalCareTab personalCare={mockPatientData.personalCare} />
                    </TabsContent>
                    
                    <TabsContent value="risk" className="space-y-4">
                      <RiskTab riskAssessments={mockPatientData.riskAssessments} />
                    </TabsContent>
                    
                    <TabsContent value="serviceplan" className="space-y-4">
                      <ServicePlanTab serviceActions={mockPatientData.serviceActions} />
                    </TabsContent>
                    
                    <TabsContent value="serviceactions" className="space-y-4">
                      <ServiceActionsTab serviceActions={mockPatientData.serviceActions} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarePlanView;
