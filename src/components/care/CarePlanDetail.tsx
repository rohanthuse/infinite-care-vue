import React, { useState } from "react";
import { 
  X, User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity,
  ChevronRight, FileEdit, Download, Heart, ListCheck,
  BookOpen, Music, ThumbsUp, Flame, Coffee, Target,
  Trophy, CheckCircle2, BarChart2, BadgeCheck, Wrench,
  Utensils, Battery, ScrollText, Droplets, ShieldAlert,
  AlertCircle, Map, Salad, Pizza, Apple, Wine, Clipboard,
  Pill
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
  ],
  equipment: [
    { name: "Walking Frame", type: "Mobility Aid", status: "In Use", notes: "Checked monthly", lastInspection: new Date("2023-10-30") },
    { name: "Shower Chair", type: "Bathroom Aid", status: "In Use", notes: "Stable condition", lastInspection: new Date("2023-11-05") },
    { name: "Hospital Bed", type: "Bedroom Aid", status: "In Use", notes: "Electric controls working properly", lastInspection: new Date("2023-10-15") },
    { name: "Oxygen Concentrator", type: "Medical Device", status: "Available", notes: "Only used when needed", lastInspection: new Date("2023-11-10") }
  ],
  
  dietaryRequirements: {
    mealPlan: "Low sodium diabetic diet plan",
    restrictions: [
      { name: "Low Sodium", reason: "Hypertension management", severity: "Strict" },
      { name: "Low Sugar", reason: "Diabetes management", severity: "Moderate" },
      { name: "No Shellfish", reason: "Allergy", severity: "Critical" }
    ],
    preferences: [
      "Prefers meals to be warm, not hot",
      "Enjoys fruit as dessert",
      "Prefers small, frequent meals",
      "Dislikes most dairy products except cheese"
    ],
    supplements: [
      { name: "Calcium + Vitamin D", dosage: "500mg", frequency: "Daily", purpose: "Bone health" },
      { name: "Multivitamin", dosage: "1 tablet", frequency: "Morning", purpose: "Nutritional supplement" }
    ],
    hydrationPlan: "Minimum 8 glasses of water daily, monitored with checklist",
    nutritionalNotes: "Patient struggles with maintaining adequate hydration. Family has been advised to encourage fluid intake throughout the day."
  }
};

export const CarePlanDetail: React.FC<CarePlanDetailProps> = ({ carePlan, onClose }) => {
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

  const calculateProgressPercentage = (status: string, notes: string) => {
    if (status === "Completed") return 100;
    if (status === "Active") return 60;
    if (status === "In Progress") {
      const match = notes.match(/Currently at (\d+)/);
      if (match && match[1]) {
        const current = parseInt(match[1]);
        const target = notes.match(/for (\d+)/) ? parseInt(notes.match(/for (\d+)/)?.[1] || "0") : 15;
        return Math.round((current / target) * 100);
      }
      return 40;
    }
    return 10;
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
            
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto mb-4">
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
                  <TabsTrigger value="equipment" className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    <span>Equipment</span>
                  </TabsTrigger>
                  <TabsTrigger value="dietary" className="flex items-center gap-1">
                    <Utensils className="h-4 w-4" />
                    <span>Dietary</span>
                  </TabsTrigger>
                </TabsList>
                
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="animate-in fade-in-50 duration-300">
                      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Heart className="h-5 w-5 text-blue-600" />
                          <span>Preferences</span>
                        </CardTitle>
                        <CardDescription>Personal preferences to be aware of when providing care</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {mockPatientData.aboutMe.preferences.map((pref, index) => (
                            <li key={index} className="text-sm flex items-start bg-blue-50/50 p-2 rounded-md border border-blue-100">
                              <ThumbsUp className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>{pref}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="animate-in fade-in-50 duration-300 delay-100">
                      <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ListCheck className="h-5 w-5 text-green-600" />
                          <span>Daily Routines</span>
                        </CardTitle>
                        <CardDescription>Regular activities and schedule preferences</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {mockPatientData.aboutMe.routines.map((routine, index) => (
                            <li key={index} className="text-sm flex items-start bg-green-50/50 p-2 rounded-md border border-green-100">
                              <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{routine}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="animate-in fade-in-50 duration-300 delay-200">
                      <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-purple-600" />
                          <span>Interests & Hobbies</span>
                        </CardTitle>
                        <CardDescription>Activities and topics the patient enjoys</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {mockPatientData.aboutMe.interests.map((interest, index) => (
                            <li key={index} className="text-sm flex items-start bg-purple-50/50 p-2 rounded-md border border-purple-100">
                              <Music className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                              <span>{interest}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="animate-in fade-in-50 duration-300 delay-300">
                      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Flame className="h-5 w-5 text-amber-600" />
                          <span>Dislikes & Concerns</span>
                        </CardTitle>
                        <CardDescription>Things to avoid or be mindful of</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {mockPatientData.aboutMe.dislikes.map((dislike, index) => (
                            <li key={index} className="text-sm flex items-start bg-amber-50/50 p-2 rounded-md border border-amber-100">
                              <Coffee className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>{dislike}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="goals" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span>Care Goals</span>
                      </CardTitle>
                      <CardDescription>Tracking progress toward objectives</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {mockPatientData.goals.map((goal, index) => {
                          const progressPercentage = calculateProgressPercentage(goal.status, goal.notes);
                          
                          return (
                            <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center">
                                    {goal.status === "Active" && (
                                      <div className="mr-3 p-2 rounded-full bg-blue-100">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                      </div>
                                    )}
                                    {goal.status === "In Progress" && (
                                      <div className="mr-3 p-2 rounded-full bg-amber-100">
                                        <BarChart2 className="h-5 w-5 text-amber-600" />
                                      </div>
                                    )}
                                    {goal.status === "Completed" && (
                                      <div className="mr-3 p-2 rounded-full bg-green-100">
                                        <Trophy className="h-5 w-5 text-green-600" />
                                      </div>
                                    )}
                                    <div>
                                      <h3 className="font-medium text-lg">{goal.title}</h3>
                                      <div className="flex items-center mt-1">
                                        <Badge variant="outline" className={getStatusBadgeClass(goal.status)}>
                                          {goal.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-gray-700">Target</p>
                                    <p className="text-sm text-gray-500">{progressPercentage}% Complete</p>
                                  </div>
                                  
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                      className={`h-2.5 rounded-full ${
                                        goal.status === "Completed" ? "bg-green-600" : 
                                        goal.status === "In Progress" ? "bg-amber-500" : "bg-blue-600"
                                      }`}
                                      style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                  </div>
                                  
                                  <p className="mt-2 text-sm font-medium flex items-center">
                                    <BadgeCheck className="h-4 w-4 mr-1.5 text-blue-600" />
                                    {goal.target}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                                  <p className="text-sm bg-gray-50 p-2 rounded-md border border-gray-100">
                                    {goal.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="activities" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Recent Activities</CardTitle>
                      <CardDescription>Care activities and interventions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockPatientData.activities.map((activity, index) => (
                          <div key={index} className="flex items-start border-b last:border-0 pb-3 last:pb-0">
                            <div className="w-12 text-center flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                                <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
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
                
                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Care Notes</CardTitle>
                        <CardDescription>Observations and updates</CardDescription>
                      </div>
                      <Button size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockPatientData.notes.map((note, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-xs">
                                    {note.author.split(' ').map(n => n[0]).join('')}
                                  </div>
                                </Avatar>
                                <p className="font-medium text-sm">{note.author}</p>
                              </div>
                              <p className="text-xs text-gray-50
