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
  },
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
    notes: "Patient struggles with appetite in the evenings. Family members have been advised to offer light protein-rich snacks in the afternoon."
  },
  
  personalCare: {
    routines: [
      { activity: "Bathing", frequency: "Daily", assistance: "Minimal", notes: "Prefers evening showers, needs supervision but minimal physical assistance" },
      { activity: "Grooming", frequency: "Daily", assistance: "Partial", notes: "Can brush teeth independently, needs help with shaving and hair styling" },
      { activity: "Dressing", frequency: "Daily", assistance: "Moderate", notes: "Can put on shirts and pants with assistance, struggles with buttons and zippers" },
      { activity: "Toileting", frequency: "As needed", assistance: "Minimal", notes: "Uses toilet independently but requires handrails for safety" },
    ],
    preferences: [
      "Prefers to wear button-down shirts for ease of dressing",
      "Likes to have personal hygiene tasks done in privacy",
      "Prefers warm water for bathing",
      "Likes to have personal care tasks done in the morning"
    ],
    mobility: {
      status: "Limited - requires walking frame",
      transferAbility: "Can transfer from bed to chair with minimal assistance",
      walkingDistance: "Up to 50 feet with walking frame before requiring rest",
      stairs: "Unable to navigate stairs independently",
      notes: "Balance is improving with physical therapy but still requires monitoring"
    }
  },
  
  riskAssessments: [
    { 
      type: "Fall Risk", 
      level: "High", 
      lastAssessed: new Date("2023-11-01"),
      assessedBy: "Nurse David Brown",
      mitigationPlan: "Walking frame at all times, clear pathways, night lights, non-slip mats in bathroom, call button within reach",
      reviewDate: new Date("2023-12-01")
    },
    { 
      type: "Pressure Ulcer Risk", 
      level: "Moderate", 
      lastAssessed: new Date("2023-10-15"),
      assessedBy: "Dr. Emma Lewis",
      mitigationPlan: "Pressure-relieving mattress, position change every 2 hours when in bed, daily skin inspection",
      reviewDate: new Date("2023-11-15")
    },
    { 
      type: "Medication Error Risk", 
      level: "Low", 
      lastAssessed: new Date("2023-10-20"),
      assessedBy: "Nurse David Brown",
      mitigationPlan: "Pill organizer prepared weekly, medication administration record, verification process",
      reviewDate: new Date("2024-01-20")
    },
    { 
      type: "Nutrition Risk", 
      level: "Moderate", 
      lastAssessed: new Date("2023-10-10"),
      assessedBy: "Dietitian Mary Wilson",
      mitigationPlan: "Regular weight monitoring, meal supplements, food diary, dietitian review monthly",
      reviewDate: new Date("2023-11-10")
    }
  ],
  
  individualizedPlan: {
    longTermGoals: [
      {
        goal: "Improved independence with activities of daily living",
        targetDate: new Date("2024-03-15"),
        status: "In Progress",
        progress: "Making steady progress with physical therapy. Now able to dress upper body with minimal assistance."
      },
      {
        goal: "Stable blood glucose levels",
        targetDate: new Date("2024-02-01"),
        status: "In Progress",
        progress: "Blood glucose readings showing improvement with diet adherence and medication compliance."
      },
      {
        goal: "Return to community engagement activities",
        targetDate: new Date("2024-04-30"),
        status: "Not Started",
        progress: "Will begin community reintegration once mobility improves."
      }
    ],
    strengths: [
      "Strong motivation for recovery",
      "Good cognitive function",
      "Supportive family network",
      "Adherence to medication regimen",
      "Positive attitude toward therapy"
    ],
    challenges: [
      "Limited physical mobility",
      "Fatigue with extended activity",
      "Some reluctance to ask for help",
      "Occasional forgetfulness with appointments"
    ],
    preferences: [
      "Prefers morning appointments",
      "Enjoys social interactions during care",
      "Values independence in decision making"
    ]
  },
  
  serviceActions: [
    {
      service: "Physical Therapy",
      provider: "Therapist Michael Scott",
      frequency: "3 times weekly",
      duration: "45 minutes",
      schedule: "Monday, Wednesday, Friday - 10:00 AM",
      goals: [
        "Improve walking distance with frame",
        "Strengthen lower limbs",
        "Improve balance and coordination"
      ],
      progress: "Showing good improvement in strength, balance still challenging but improving."
    },
    {
      service: "Medication Management",
      provider: "Nurse David Brown",
      frequency: "Weekly",
      duration: "30 minutes",
      schedule: "Thursday - 2:00 PM",
      goals: [
        "Ensure medication compliance",
        "Monitor for side effects",
        "Adjust dosages as needed per physician orders"
      ],
      progress: "Good medication adherence with pill organizer, no reported side effects."
    },
    {
      service: "Dietary Counseling",
      provider: "Dietitian Mary Wilson",
      frequency: "Monthly",
      duration: "45 minutes",
      schedule: "First Monday - 11:00 AM",
      goals: [
        "Maintain diabetic diet plan",
        "Ensure adequate nutrition",
        "Prevent weight loss"
      ],
      progress: "Diet adherence improving, weight has stabilized."
    },
    {
      service: "Home Health Aide",
      provider: "Various Staff",
      frequency: "Daily",
      duration: "1 hour",
      schedule: "Daily - 8:00 AM and 7:00 PM",
      goals: [
        "Assist with personal care",
        "Support meal preparation",
        "Ensure safe home environment"
      ],
      progress: "Client becoming more independent with morning routine, still requires evening assistance."
    }
  ]
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

  const handleNewBooking = () => {
    // Display a toast message for now, in a real app this would open a booking form
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
          {/* Page Header with Logo */}
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
                    </TabsContent>
                    
                    {/* About Me Tab */}
                    <TabsContent value="aboutme" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">About Me</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Preferences</p>
                              <ul className="list-disc list-inside">
                                {mockPatientData.aboutMe.preferences.map((pref, index) => (
                                  <li key={index} className="text-sm">{pref}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Routines</p>
                              <ul className="list-disc list-inside">
                                {mockPatientData.aboutMe.routines.map((routine, index) => (
                                  <li key={index} className="text-sm">{routine}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Interests</p>
                              <ul className="list-disc list-inside">
                                {mockPatientData.aboutMe.interests.map((interest, index) => (
                                  <li key={index} className="text-sm">{interest}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Dislikes</p>
                              <ul className="list-disc list-inside">
                                {mockPatientData.aboutMe.dislikes.map((dislike, index) => (
                                  <li key={index} className="text-sm">{dislike}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Goals Tab */}
                    <TabsContent value="goals" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Goals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.goals.map((goal, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{goal.title}</p>
                                  <p className="text-sm text-gray-500">{goal.status}</p>
                                </div>
                                <p className="text-sm text-gray-500">{goal.target}</p>
                                <p className="text-sm text-gray-500">{goal.notes}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Equipment Tab */}
                    <TabsContent value="equipment" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Equipment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.equipment.map((equipment, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{equipment.name}</p>
                                  <p className="text-sm text-gray-500">{equipment.type}</p>
                                </div>
                                <p className="text-sm text-gray-500">{equipment.status}</p>
                                <p className="text-sm text-gray-500">{equipment.notes}</p>
                                <p className="text-sm text-gray-500">{format(equipment.lastInspection, 'MMM dd, yyyy')}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Dietary Tab */}
                    <TabsContent value="dietary" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Dietary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Dietary Restrictions</p>
                              <div className="flex flex-wrap gap-1">
                                {mockPatientData.dietaryRequirements.restrictions.map((restriction, index) => (
                                  <Badge key={index} variant="outline" className="text-red-600 bg-red-50 border-red-200">
                                    {restriction.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Meal Preferences</p>
                              <div className="flex flex-wrap gap-1">
                                {mockPatientData.dietaryRequirements.preferences.map((pref, index) => (
                                  <Badge key={index} variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                                    {pref}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Hydration Plan</p>
                              <p className="text-sm">{mockPatientData.dietaryRequirements.hydrationPlan}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Nutritional Notes</p>
                              <p className="text-sm">{mockPatientData.dietaryRequirements.nutritionalNotes}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Personal Care Tab */}
                    <TabsContent value="personal-care" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Personal Care</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Routines</p>
                              <ul className="list-disc list-inside">
                                {mockPatientData.personalCare.routines.map((routine, index) => (
                                  <li key={index} className="text-sm">{routine.activity} ({routine.frequency})</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Preferences</p>
                              <ul className="list-disc list-inside">
                                {mockPatientData.personalCare.preferences.map((pref, index) => (
                                  <li key={index} className="text-sm">{pref}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Mobility</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm">{mockPatientData.personalCare.mobility.status}</p>
                                <p className="text-sm">{mockPatientData.personalCare.mobility.transferAbility}</p>
                                <p className="text-sm">{mockPatientData.personalCare.mobility.walkingDistance}</p>
                                <p className="text-sm">{mockPatientData.personalCare.mobility.stairs}</p>
                                <p className="text-sm">{mockPatientData.personalCare.mobility.notes}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Risk Tab */}
                    <TabsContent value="risk" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.riskAssessments.map((risk, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{risk.type}</p>
                                  <p className="text-sm text-gray-500">{risk.level}</p>
                                </div>
                                <p className="text-sm text-gray-500">{format(risk.lastAssessed, 'MMM dd, yyyy')}</p>
                                <p className="text-sm text-gray-500">{risk.assessedBy}</p>
                                <p className="text-sm text-gray-500">{risk.mitigationPlan}</p>
                                <p className="text-sm text-gray-500">{format(risk.reviewDate, 'MMM dd, yyyy')}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Service Plan Tab */}
                    <TabsContent value="service-plan" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Service Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.serviceActions.map((service, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{service.service}</p>
                                  <p className="text-sm text-gray-500">{service.provider}</p>
                                </div>
                                <p className="text-sm text-gray-500">{service.frequency}</p>
                                <p className="text-sm text-gray-500">{service.duration}</p>
                                <p className="text-sm text-gray-500">{service.schedule}</p>
                                <p className="text-sm text-gray-500">{service.goals.map((goal, goalIndex) => (
                                  <span key={goalIndex} className="text-sm">{goal}</span>
                                ))}</p>
                                <p className="text-sm text-gray-500">{service.progress}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Service Actions Tab */}
                    <TabsContent value="actions" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Service Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.serviceActions.map((service, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{service.service}</p>
                                  <p className="text-sm text-gray-500">{service.provider}</p>
                                </div>
                                <p className="text-sm text-gray-500">{service.frequency}</p>
                                <p className="text-sm text-gray-500">{service.duration}</p>
                                <p className="text-sm text-gray-500">{service.schedule}</p>
                                <p className="text-sm text-gray-500">{service.goals.map((goal, goalIndex) => (
                                  <span key={goalIndex} className="text-sm">{goal}</span>
                                ))}</p>
                                <p className="text-sm text-gray-500">{service.progress}</p>
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
                          <CardTitle className="text-lg">Activities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.activities.map((activity, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{activity.action}</p>
                                  <p className="text-sm text-gray-500">{activity.performer}</p>
                                </div>
                                <p className="text-sm text-gray-500">{activity.status}</p>
                                <p className="text-sm text-gray-500">{format(activity.date, 'MMM dd, yyyy')}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Notes Tab */}
                    <TabsContent value="notes" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.notes.map((note, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{note.author}</p>
                                  <p className="text-sm text-gray-500">{format(note.date, 'MMM dd, yyyy')}</p>
                                </div>
                                <p className="text-sm text-gray-500">{note.content}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Documents Tab */}
                    <TabsContent value="documents" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.documents.map((document, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{document.name}</p>
                                  <p className="text-sm text-gray-500">{document.type}</p>
                                </div>
                                <p className="text-sm text-gray-500">{format(document.date, 'MMM dd, yyyy')}</p>
                                <p className="text-sm text-gray-500">{document.author}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Assessments Tab */}
                    <TabsContent value="assessments" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Assessments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPatientData.assessments.map((assessment, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{assessment.name}</p>
                                  <p className="text-sm text-gray-500">{assessment.status}</p>
                                </div>
                                <p className="text-sm text-gray-500">{format(assessment.date, 'MMM dd, yyyy')}</p>
                                <p className="text-sm text-gray-500">{assessment.performer}</p>
                                <p className="text-sm text-gray-500">{assessment.results}</p>
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
