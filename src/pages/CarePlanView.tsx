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

const mockPatientData = {
  // ... (same mockPatientData as before)
};

const mockCarePlans = [
  // ... (same mockCarePlans as before)
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active": return "text-green-600 bg-green-50 border-green-200";
      case "In Progress": return "text-blue-600 bg-blue-50 border-blue-200";
      case "Completed": return "text-purple-600 bg-purple-50 border-purple-200";
      case "Under Review": return "text-amber-600 bg-amber-50 border-amber-200";
      case "Archived": return "text-gray-600 bg-gray-50 border-gray-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskLevelClass = (level: string) => {
    switch (level) {
      case "High": return "text-red-600 bg-red-50 border-red-200";
      case "Moderate": return "text-amber-600 bg-amber-50 border-amber-200";
      case "Low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <BranchInfoHeader 
        branchId={branchId || ""} 
        branchName={branchName || ""} 
        onNewBooking={handleNewBooking} 
      />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">
        <TabNavigation
          activeTab="care-plan"
          onChange={(tab) => navigate(`/branch-dashboard/${branchId}/${branchName}/${tab}`)}
        />
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mr-4 bg-white p-3 rounded-lg shadow-sm border border-blue-200">
                  <h3 className="text-blue-700 text-lg font-bold">Med-Infinite</h3>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Care Plan Management</h1>
                  <p className="text-gray-600">Comprehensive patient care documentation</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/branch-dashboard/${branchId}/${branchName}/care-plan`)}
                  className="h-9 w-9 rounded-full bg-white shadow-sm border border-gray-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Care Plan Details</h2>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handlePrintCarePlan} className="flex items-center gap-2 bg-white">
                  <Download className="h-4 w-4" />
                  <span>Export PDF</span>
                </Button>
                <Button variant="default" className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4" />
                  <span>Edit Plan</span>
                </Button>
              </div>
            </div>
          </div>
          
          {carePlan && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100 shadow-sm mb-6">
                <div className="w-20 h-20 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                  {carePlan.avatar}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold">{carePlan.patientName}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 text-sm">
                    <div className="flex items-center px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                      <User className="h-3 w-3 mr-1 text-blue-600" />
                      <span>Patient ID: {carePlan.patientId}</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                      <FileText className="h-3 w-3 mr-1 text-blue-600" />
                      <span>Plan ID: {carePlan.id}</span>
                    </div>
                    <Badge variant="outline" className={`${getStatusBadgeClass(carePlan.status)} px-3 py-1 rounded-full`}>
                      {carePlan.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end text-sm">
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 mb-2">
                    <Calendar className="h-3 w-3 text-blue-600" />
                    <span>Created: {format(carePlan.dateCreated, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span>Updated: {format(carePlan.lastUpdated, 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/4">
                  <Card className="sticky top-6 shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-3">
                      <CardTitle className="text-lg text-gray-800">Care Plan Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                        <Badge variant="outline" className={`${getStatusBadgeClass(carePlan.status)} text-sm py-1 px-3`}>
                          {carePlan.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Assigned To</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                            <div className="bg-blue-600 text-white w-full h-full flex items-center justify-center text-xs font-bold">
                              {carePlan.assignedTo.split(' ').map(n => n[0]).join('')}
                            </div>
                          </Avatar>
                          <span className="text-sm font-medium">{carePlan.assignedTo}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Created On</p>
                        <p className="text-sm flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-blue-600" />
                          {format(carePlan.dateCreated, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                        <p className="text-sm flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-blue-600" />
                          {format(carePlan.lastUpdated, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Quick Actions</p>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-blue-50 border-blue-100">
                            <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                            <span>Add Note</span>
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-blue-50 border-blue-100">
                            <Clock className="h-4 w-4 mr-2 text-blue-600" />
                            <span>Schedule Follow-up</span>
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-blue-50 border-blue-100">
                            <Activity className="h-4 w-4 mr-2 text-blue-600" />
                            <span>Record Activity</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="w-full lg:w-3/4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg border border-blue-100 p-2 sticky top-0 z-10">
                      <TabsList className="w-full bg-white/80 backdrop-blur-sm border border-gray-100 rounded-lg shadow-sm">
                        <TabsTrigger value="personal" className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Personal</span>
                        </TabsTrigger>
                        <TabsTrigger value="aboutme" className="flex items-center gap-1">
                          <Info className="h-4 w-4" />
                          <span>About Me</span>
                        </TabsTrigger>
                        <TabsTrigger value="goals" className="flex items-center gap-1">
                          <FileCheck className="h-4 w-4" />
                          <span>Goals</span>
                        </TabsTrigger>
                        <TabsTrigger value="equipment" className="flex items-center gap-1">
                          <Wrench className="h-4 w-4" />
                          <span>Equipment</span>
                        </TabsTrigger>
                        <TabsTrigger value="dietary" className="flex items-center gap-1">
                          <Utensils className="h-4 w-4" />
                          <span>Dietary</span>
                        </TabsTrigger>
                        <TabsTrigger value="personal-care" className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>Personal Care</span>
                        </TabsTrigger>
                        <TabsTrigger value="risk" className="flex items-center gap-1">
                          <ShieldAlert className="h-4 w-4" />
                          <span>Risk</span>
                        </TabsTrigger>
                        <TabsTrigger value="service-plan" className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" />
                          <span>Service Plan</span>
                        </TabsTrigger>
                        <TabsTrigger value="actions" className="flex items-center gap-1">
                          <FileBarChart2 className="h-4 w-4" />
                          <span>Service Actions</span>
                        </TabsTrigger>
                        <TabsTrigger value="activities" className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Activities</span>
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>Notes</span>
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>Documents</span>
                        </TabsTrigger>
                        <TabsTrigger value="assessments" className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Assessments</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="personal" className="space-y-6 mt-6">
                      <Card className="overflow-hidden shadow-sm border-blue-100">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Personal Information
                          </CardTitle>
                          <CardDescription>Basic patient demographic information</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
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
                                  <div key={index} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                      <div>
                                        <p className="font-medium">{medication.name} ({medication.dosage})</p>
                                        <p className="text-sm text-gray-600">{medication.frequency}</p>
                                      </div>
                                      <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200 self-start">
                                        {medication.purpose}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="aboutme" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            About Me
                          </CardTitle>
                          <CardDescription>Patient preferences and personal information</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-medium text-gray-700 mb-2">Preferences</h3>
                                <ul className="space-y-2">
                                  {mockPatientData.aboutMe.preferences.map((pref, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <span>{pref}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-700 mb-2">Interests</h3>
                                <ul className="space-y-2">
                                  {mockPatientData.aboutMe.interests.map((interest, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                      <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <span>{interest}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-medium text-gray-700 mb-2">Routines</h3>
                                <ul className="space-y-2">
                                  {mockPatientData.aboutMe.routines.map((routine, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                      <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <span>{routine}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-700 mb-2">Dislikes</h3>
                                <ul className="space-y-2">
                                  {mockPatientData.aboutMe.dislikes.map((dislike, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                      <div className="h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <span>{dislike}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Other tabs would be implemented similarly */}
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
