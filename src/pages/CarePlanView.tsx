
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity, ChevronLeft,
  ChevronRight, FileEdit, Download, ArrowLeft
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
  ],
  vitalSigns: [
    { date: new Date("2023-11-10"), type: "Blood Pressure", value: "128/82 mmHg", notes: "Slightly elevated, continue monitoring" },
    { date: new Date("2023-11-10"), type: "Heart Rate", value: "76 bpm", notes: "Within normal range" },
    { date: new Date("2023-11-10"), type: "Temperature", value: "98.6°F (37°C)", notes: "Normal" },
    { date: new Date("2023-11-10"), type: "Respiratory Rate", value: "16 breaths/min", notes: "Normal" },
    { date: new Date("2023-11-10"), type: "Oxygen Saturation", value: "97%", notes: "Within normal range" },
    { date: new Date("2023-11-05"), type: "Blood Glucose", value: "118 mg/dL", notes: "Pre-breakfast reading" },
  ],
  careTeam: [
    { name: "Dr. Sarah Johnson", role: "Primary Care Physician", phone: "(555) 444-3333", email: "sarah.johnson@medinfinity.com" },
    { name: "Nurse David Brown", role: "Home Care Nurse", phone: "(555) 222-1111", email: "david.brown@medinfinity.com" },
    { name: "Dr. Emma Lewis", role: "Endocrinologist", phone: "(555) 666-7777", email: "emma.lewis@medinfinity.com" },
    { name: "Therapist Michael Scott", role: "Physical Therapist", phone: "(555) 888-9999", email: "michael.scott@medinfinity.com" },
  ],
  familyContacts: [
    { name: "Sarah Michael", relationship: "Daughter", phone: "(555) 987-6543", email: "sarah.michael@example.com", isPrimary: true },
    { name: "Robert Michael", relationship: "Son", phone: "(555) 123-4567", email: "robert.michael@example.com", isPrimary: false },
  ],
  nutrition: {
    dietaryRestrictions: ["Low sodium", "Diabetic diet", "No shellfish (allergy)"],
    mealPreferences: [
      "Prefers smaller, more frequent meals",
      "Enjoys fruit with breakfast",
      "Prefers tea over coffee",
      "Dislikes dairy products except for cheese"
    ],
    hydrationPlan: "Minimum 8 glasses of water daily, monitored with checklist",
    nutritionalNotes: "Patient struggles with maintaining adequate hydration. Family has been advised to encourage fluid intake throughout the day."
  },
  socialWorker: {
    name: "Jessica Martinez",
    phone: "(555) 222-3333",
    email: "jessica.martinez@medinfinity.com",
    lastVisit: new Date("2023-10-15"),
    nextVisit: new Date("2023-12-10"),
    notes: "Reviewing eligibility for additional home support services. Will coordinate with family regarding transportation to medical appointments."
  }
};

// Placeholder for care plan data
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
  // More care plans...
];

const CarePlanView = () => {
  const { id: branchId, branchName, carePlanId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [carePlan, setCarePlan] = useState<typeof mockCarePlans[0] | null>(null);

  useEffect(() => {
    // In a real app, fetch care plan data from API
    const plan = mockCarePlans.find(p => p.id === carePlanId);
    if (plan) {
      setCarePlan(plan);
    }
  }, [carePlanId]);

  const handlePrintCarePlan = () => {
    if (!carePlan) return;
    
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
    <div className="flex flex-col min-h-screen">
      <BranchInfoHeader branchId={branchId} branchName={branchName} />
      
      <div className="flex-1 p-6 space-y-6">
        <TabNavigation
          activeTab="care-plan"
          onChange={(tab) => navigate(`/branch-dashboard/${branchId}/${branchName}/${tab}`)}
        />
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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
              {/* Patient Header */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
                  {carePlan.avatar}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{carePlan.patientName}</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Patient ID: {carePlan.patientId}</span>
                    <span>•</span>
                    <span>Plan ID: {carePlan.id}</span>
                    <span>•</span>
                    <Badge variant="outline" className={getStatusBadgeClass(carePlan.status)}>
                      {carePlan.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left sidebar */}
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
                
                {/* Main content */}
                <div className="w-full md:w-3/4">
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
                    </TabsList>
                    
                    {/* Personal Information Tab */}
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
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Vital Signs</CardTitle>
                          <CardDescription>Latest recorded measurements</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.vitalSigns.map((vital, index) => (
                              <div key={index} className="border rounded-md p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium">{vital.type}</p>
                                  <p className="text-xs text-gray-500">{format(vital.date, 'MMM dd, yyyy')}</p>
                                </div>
                                <p className="text-lg font-bold">{vital.value}</p>
                                <p className="text-sm text-gray-600">{vital.notes}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Care Team</CardTitle>
                          <CardDescription>Healthcare professionals involved in patient's care</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-3">
                            {mockPatientData.careTeam.map((member, index) => (
                              <div key={index} className="flex items-start gap-3 border-b last:border-0 pb-3 last:pb-0">
                                <Avatar className="h-10 w-10">
                                  <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-sm">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-gray-600">{member.role}</p>
                                  <div className="flex flex-col sm:flex-row sm:gap-3 text-xs text-gray-500 mt-1">
                                    <span>{member.phone}</span>
                                    <span>{member.email}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Family Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-3">
                            {mockPatientData.familyContacts.map((contact, index) => (
                              <div key={index} className="flex items-start gap-3 border-b last:border-0 pb-3 last:pb-0">
                                <Avatar className="h-10 w-10">
                                  <div className="bg-green-100 text-green-600 w-full h-full flex items-center justify-center text-sm">
                                    {contact.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">{contact.name}</p>
                                    {contact.isPrimary && (
                                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                        Primary Contact
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{contact.relationship}</p>
                                  <div className="flex flex-col sm:flex-row sm:gap-3 text-xs text-gray-500 mt-1">
                                    <span>{contact.phone}</span>
                                    <span>{contact.email}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Social Worker</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <div className="bg-purple-100 text-purple-600 w-full h-full flex items-center justify-center text-sm">
                                {mockPatientData.socialWorker.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            </Avatar>
                            <div>
                              <p className="font-medium">{mockPatientData.socialWorker.name}</p>
                              <div className="flex flex-col sm:flex-row sm:gap-3 text-xs text-gray-500 mt-1">
                                <span>{mockPatientData.socialWorker.phone}</span>
                                <span>{mockPatientData.socialWorker.email}</span>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-500">Last Visit</p>
                                <p className="text-sm">{format(mockPatientData.socialWorker.lastVisit, 'MMM dd, yyyy')}</p>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-500">Next Visit</p>
                                <p className="text-sm">{format(mockPatientData.socialWorker.nextVisit, 'MMM dd, yyyy')}</p>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-500">Notes</p>
                                <p className="text-sm">{mockPatientData.socialWorker.notes}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* About Me Tab */}
                    <TabsContent value="aboutme" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Preferences</CardTitle>
                          <CardDescription>Personal preferences to be aware of when providing care</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {mockPatientData.aboutMe.preferences.map((pref, index) => (
                              <li key={index} className="text-sm flex items-start">
                                <span className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0">•</span>
                                {pref}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Daily Routines</CardTitle>
                          <CardDescription>Regular activities and schedule preferences</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {mockPatientData.aboutMe.routines.map((routine, index) => (
                              <li key={index} className="text-sm flex items-start">
                                <span className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0">•</span>
                                {routine}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Interests & Hobbies</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1">
                              {mockPatientData.aboutMe.interests.map((interest, index) => (
                                <li key={index} className="text-sm flex items-start">
                                  <span className="h-5 w-5 mr-2 text-green-500 flex-shrink-0">•</span>
                                  {interest}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Dislikes & Concerns</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1">
                              {mockPatientData.aboutMe.dislikes.map((dislike, index) => (
                                <li key={index} className="text-sm flex items-start">
                                  <span className="h-5 w-5 mr-2 text-red-500 flex-shrink-0">•</span>
                                  {dislike}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Nutrition</CardTitle>
                          <CardDescription>Dietary needs and preferences</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Dietary Restrictions</p>
                              <div className="flex flex-wrap gap-1">
                                {mockPatientData.nutrition.dietaryRestrictions.map((restriction, index) => (
                                  <Badge key={index} variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                                    {restriction}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Meal Preferences</p>
                              <ul className="space-y-1">
                                {mockPatientData.nutrition.mealPreferences.map((pref, index) => (
                                  <li key={index} className="text-sm flex items-start">
                                    <span className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0">•</span>
                                    {pref}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Hydration Plan</p>
                              <p className="text-sm">{mockPatientData.nutrition.hydrationPlan}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                              <p className="text-sm">{mockPatientData.nutrition.nutritionalNotes}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Goals Tab */}
                    <TabsContent value="goals" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Care Goals</CardTitle>
                          <CardDescription>Tracking progress toward objectives</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {mockPatientData.goals.map((goal, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-medium">{goal.title}</h3>
                                  <Badge variant="outline" className={getStatusBadgeClass(goal.status)}>
                                    {goal.status}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Target</p>
                                    <p className="text-sm">{goal.target}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Notes</p>
                                    <p className="text-sm">{goal.notes}</p>
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
                    
                    {/* Notes Tab */}
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
                                  <p className="text-xs text-gray-500">{format(note.date, 'MMM dd, yyyy')}</p>
                                </div>
                                <p className="text-sm">{note.content}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Documents Tab */}
                    <TabsContent value="documents" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Related Documents</CardTitle>
                            <CardDescription>Reports and medical documentation</CardDescription>
                          </div>
                          <Button size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {mockPatientData.documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center mr-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{doc.name}</p>
                                    <p className="text-xs text-gray-500">By {doc.author} • {format(doc.date, 'MMM dd, yyyy')}</p>
                                  </div>
                                </div>
                                <Badge variant="outline">{doc.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Assessments Tab */}
                    <TabsContent value="assessments" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Clinical Assessments</CardTitle>
                            <CardDescription>Evaluations and findings</CardDescription>
                          </div>
                          <Button size="sm">
                            <FileCheck className="h-4 w-4 mr-2" />
                            New Assessment
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {mockPatientData.assessments.map((assessment, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
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
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Performed By</p>
                                    <p className="text-sm">{assessment.performer}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Results</p>
                                    <p className="text-sm">{assessment.results}</p>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default CarePlanView;
