
import React, { useState } from "react";
import { 
  X, User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity,
  ChevronRight, FileEdit, Download, Pill 
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { generatePDF } from "@/utils/pdfGenerator";

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
}

// Mock data for the care plan details
const mockPatientData = {
  gender: "Male",
  dateOfBirth: new Date("1956-03-15"),
  address: "123 Main Street, Cityville, State, 12345",
  phone: "(555) 123-4567",
  email: "john.michael@example.com",
  emergencyContact: "Sarah Michael (Daughter) - (555) 987-6543",
  preferredLanguage: "English",
  allergies: ["Penicillin", "Shellfish"],
  medicalConditions: ["Hypertension", "Type 2 Diabetes", "Arthritis"],
  medications: [
    { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", purpose: "Blood pressure" },
    { name: "Metformin", dosage: "500mg", frequency: "Twice daily", purpose: "Diabetes management" },
    { name: "Ibuprofen", dosage: "400mg", frequency: "As needed", purpose: "Pain relief" }
  ],
  aboutMe: {
    preferences: [
      "Prefers to be called 'John' rather than 'Mr. Michael'",
      "Enjoys reading the newspaper in the morning",
      "Prefers showers in the evening rather than morning",
      "Enjoys classical music during relaxation time"
    ],
    routines: [
      "Morning walk after breakfast (weather permitting)",
      "Afternoon nap between 2-3 PM",
      "Evening television from 7-9 PM",
      "Bedtime reading for 30 minutes before sleep"
    ],
    interests: [
      "Classical music (particularly Mozart and Beethoven)",
      "Gardening (maintains a small herb garden)",
      "Chess (intermediate player)",
      "History documentaries"
    ],
    dislikes: [
      "Loud environments",
      "Spicy food",
      "Being rushed during activities",
      "Cold room temperatures"
    ]
  },
  goals: [
    { title: "Improve mobility", status: "In Progress", target: "Walk unassisted for 15 minutes", notes: "Currently at 8 minutes with walking frame" },
    { title: "Medication adherence", status: "Active", target: "100% medication compliance", notes: "Using pill organizer effectively" },
    { title: "Blood glucose management", status: "Active", target: "Maintain levels between 80-130 mg/dL", notes: "Morning readings occasionally high" },
  ],
  activities: [
    { date: new Date("2023-11-10"), action: "Medication review", performer: "Dr. Emma Lewis", status: "Completed" },
    { date: new Date("2023-11-05"), action: "Physical assessment", performer: "Nurse David Brown", status: "Completed" },
    { date: new Date("2023-10-25"), action: "Care plan update", performer: "Dr. Sarah Johnson", status: "Completed" },
  ],
  notes: [
    { date: new Date("2023-11-08"), author: "Nurse David Brown", content: "Patient reported mild discomfort in left knee. Applied cold compress and recommended rest. Will monitor." },
    { date: new Date("2023-11-01"), author: "Dr. Sarah Johnson", content: "Blood pressure readings have improved with current medication. Continuing current dosage and monitoring." },
    { date: new Date("2023-10-20"), author: "Dr. Emma Lewis", content: "Patient has been adhering well to diabetes management plan. Blood glucose levels stable." },
  ],
  documents: [
    { name: "Medical History Summary", date: new Date("2023-09-15"), type: "PDF", author: "Dr. Emma Lewis" },
    { name: "Diabetes Management Plan", date: new Date("2023-09-20"), type: "DOCX", author: "Dr. Sarah Johnson" },
    { name: "Physical Therapy Assessment", date: new Date("2023-10-10"), type: "PDF", author: "Nurse David Brown" },
  ],
  assessments: [
    { 
      name: "Mobility Assessment", 
      date: new Date("2023-10-15"), 
      status: "Completed", 
      performer: "Nurse David Brown",
      results: "Patient shows limited mobility in left leg. Can walk with frame for 8-10 minutes before requiring rest. Balance is fair but should be monitored."
    },
    { 
      name: "Cognitive Assessment", 
      date: new Date("2023-09-25"), 
      status: "Completed", 
      performer: "Dr. Emma Lewis",
      results: "Patient is alert and oriented. Memory function is good, with slight delay in recall of recent events. No significant cognitive concerns noted."
    },
  ]
};

export const CarePlanDetail: React.FC<CarePlanDetailProps> = ({ carePlan, onClose }) => {
  const [activeTab, setActiveTab] = useState("personal");

  if (!carePlan) return null;

  const handlePrintCarePlan = () => {
    // Use the PDF generator utility
    generatePDF({
      id: parseInt(carePlan.id.replace('CP-', '')),
      title: `Care Plan for ${carePlan.patientName}`,
      date: format(carePlan.lastUpdated, 'yyyy-MM-dd'),
      status: carePlan.status,
      signedBy: carePlan.assignedTo
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b rounded-t-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xl font-medium shadow-sm">
              {carePlan.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{carePlan.patientName}</h2>
              <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500">
                <span className="bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Patient ID: {carePlan.patientId}</span>
                <span className="bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Plan ID: {carePlan.id}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePrintCarePlan} className="flex items-center gap-1 bg-white">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-1 bg-white">
              <FileEdit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full bg-white hover:bg-red-50 hover:text-red-600">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content with scrolling */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Left column - Summary */}
            <div className="w-full md:w-1/3">
              <Card className="shadow-md border-blue-100 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-2">
                  <CardTitle className="text-lg">Care Plan Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    <Badge variant="outline" className={`${getStatusBadgeClass(carePlan.status)} py-1 px-2`}>
                      {carePlan.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Assigned To</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                        <div className="bg-blue-600 text-white w-full h-full flex items-center justify-center text-xs font-bold">
                          {carePlan.assignedTo.split(' ').map(n => n[0]).join('')}
                        </div>
                      </Avatar>
                      <span className="text-sm font-medium">{carePlan.assignedTo}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <div className="sm:w-1/2">
                      <p className="text-sm font-medium text-gray-500 mb-1">Created On</p>
                      <p className="text-sm flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-blue-600" />
                        {format(carePlan.dateCreated, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    
                    <div className="sm:w-1/2 mt-3 sm:mt-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                      <p className="text-sm flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1 text-blue-600" />
                        {format(carePlan.lastUpdated, 'MMM dd, yyyy')}
                      </p>
                    </div>
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
            
            {/* Right column - Tabs */}
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-1 mb-4 sticky top-0 z-10">
                  <TabsList className="w-full bg-gray-50/80 backdrop-blur-sm">
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
                
                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-4">
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                            <p className="text-base font-medium">{carePlan.patientName}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-500 mb-1">Gender</p>
                            <p className="text-base">{mockPatientData.gender}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-500 mb-1">Date of Birth</p>
                            <p className="text-base">{format(mockPatientData.dateOfBirth, 'MMM dd, yyyy')}</p>
                            <p className="text-sm text-gray-500">Age: {new Date().getFullYear() - mockPatientData.dateOfBirth.getFullYear()} years</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-500 mb-1">Patient ID</p>
                            <p className="text-base font-medium">{carePlan.patientId}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                            <p className="text-base">{mockPatientData.phone}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                            <p className="text-base">{mockPatientData.email}</p>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                          <p className="text-base">{mockPatientData.address}</p>
                        </div>
                        
                        <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-sm font-medium text-gray-500 mb-1">Emergency Contact</p>
                          <p className="text-base">{mockPatientData.emergencyContact}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Medical Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="space-y-5">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
                          <div className="flex flex-wrap gap-2">
                            {mockPatientData.allergies.map((allergy, index) => (
                              <Badge key={index} variant="outline" className="text-red-600 bg-red-50 border-red-200 px-3 py-1">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Medical Conditions</p>
                          <div className="flex flex-wrap gap-2">
                            {mockPatientData.medicalConditions.map((condition, index) => (
                              <Badge key={index} variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 px-3 py-1">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Medications</p>
                          <div className="grid grid-cols-1 gap-3">
                            {mockPatientData.medications.map((medication, index) => (
                              <div key={index} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="mr-3 p-2 bg-blue-100 rounded-lg">
                                  <Pill className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{medication.name} ({medication.dosage})</p>
                                  <p className="text-sm text-gray-500">{medication.frequency} - {medication.purpose}</p>
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
                
                {/* About Me Tab */}
                <TabsContent value="aboutme" className="space-y-4">
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        Preferences
                      </CardTitle>
                      <CardDescription>Personal preferences to be aware of when providing care</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <ul className="space-y-2">
                        {mockPatientData.aboutMe.preferences.map((pref, index) => (
                          <li key={index} className="flex items-start p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                            <span className="text-gray-700">{pref}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Daily Routines
                      </CardTitle>
                      <CardDescription>Regular activities and schedule preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <ul className="space-y-2">
                        {mockPatientData.aboutMe.routines.map((routine, index) => (
                          <li key={index} className="flex items-start p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                            <span className="text-gray-700">{routine}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="shadow-md border-blue-100 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="text-green-600">Interests & Hobbies</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5">
                        <ul className="space-y-2">
                          {mockPatientData.aboutMe.interests.map((interest, index) => (
                            <li key={index} className="flex items-start p-2 bg-gray-50 rounded-lg border border-gray-100">
                              <span className="text-green-600 mr-2 flex-shrink-0">•</span>
                              <span className="text-gray-700">{interest}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-md border-blue-100 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="text-red-600">Dislikes & Concerns</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5">
                        <ul className="space-y-2">
                          {mockPatientData.aboutMe.dislikes.map((dislike, index) => (
                            <li key={index} className="flex items-start p-2 bg-gray-50 rounded-lg border border-gray-100">
                              <span className="text-red-600 mr-2 flex-shrink-0">•</span>
                              <span className="text-gray-700">{dislike}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Goals Tab */}
                <TabsContent value="goals" className="space-y-4">
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                        Care Goals
                      </CardTitle>
                      <CardDescription>Tracking progress toward objectives</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {mockPatientData.goals.map((goal, index) => (
                          <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                              <h3 className="font-medium flex items-center">
                                <FileCheck className="h-4 w-4 mr-2 text-blue-600" />
                                {goal.title}
                              </h3>
                              <Badge variant="outline" className={getStatusBadgeClass(goal.status)}>
                                {goal.status}
                              </Badge>
                            </div>
                            <div className="p-3">
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-500 mb-1">Target</p>
                                  <p className="p-2 bg-gray-50 rounded border border-gray-100">{goal.target}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                                  <p className="p-2 bg-gray-50 rounded border border-gray-100">{goal.notes}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Activities Tab */}
                <TabsContent value="activities" className="space-y-4">
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Recent Activities
                      </CardTitle>
                      <CardDescription>Care activities and interventions</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {mockPatientData.activities.map((activity, index) => (
                          <div key={index} className="flex items-start border-b last:border-0 pb-3 last:pb-0">
                            <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                                <p className="font-medium">{activity.action}</p>
                                <p className="text-sm text-gray-500">{format(activity.date, 'MMM dd, yyyy')}</p>
                              </div>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <p className="text-sm">{activity.performer}</p>
                                <Badge variant="outline" className={getStatusBadgeClass(activity.status)}>
                                  {activity.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4">
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                          Care Notes
                        </CardTitle>
                        <CardDescription>Observations and updates</CardDescription>
                      </div>
                      <Button size="sm" className="bg-blue-600">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {mockPatientData.notes.map((note, index) => (
                          <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <Avatar className="h-7 w-7 mr-2">
                                  <div className="bg-blue-600 text-white w-full h-full flex items-center justify-center text-xs font-bold">
                                    {note.author.split(' ').map(n => n[0]).join('')}
                                  </div>
                                </Avatar>
                                <p className="font-medium">{note.author}</p>
                              </div>
                              <p className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                {format(note.date, 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <p className="p-3 bg-gray-50 rounded-lg border border-gray-100">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Related Documents
                        </CardTitle>
                        <CardDescription>Reports and medical documentation</CardDescription>
                      </div>
                      <Button size="sm" className="bg-blue-600">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        {mockPatientData.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-gray-500">By {doc.author} • {format(doc.date, 'MMM dd, yyyy')}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="px-3 py-1 bg-gray-50">{doc.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Assessments Tab */}
                <TabsContent value="assessments" className="space-y-4">
                  <Card className="shadow-md border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-blue-600" />
                          Clinical Assessments
                        </CardTitle>
                        <CardDescription>Evaluations and findings</CardDescription>
                      </div>
                      <Button size="sm" className="bg-blue-600">
                        <FileCheck className="h-4 w-4 mr-2" />
                        New Assessment
                      </Button>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {mockPatientData.assessments.map((assessment, index) => (
                          <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-3 border-b bg-gray-50">
                              <div className="flex items-center">
                                <FileCheck className="h-5 w-5 text-blue-600 mr-2" />
                                <h3 className="font-medium">{assessment.name}</h3>
                              </div>
                              <div className="flex items-center mt-2 md:mt-0">
                                <p className="text-sm text-gray-500 mr-2">{format(assessment.date, 'MMM dd, yyyy')}</p>
                                <Badge variant="outline" className={getStatusBadgeClass(assessment.status)}>
                                  {assessment.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-3 space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Performed By</p>
                                <p className="p-2 bg-gray-50 rounded border border-gray-100">{assessment.performer}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Results</p>
                                <p className="p-2 bg-gray-50 rounded border border-gray-100">{assessment.results}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
