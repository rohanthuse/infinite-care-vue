
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity, ChevronLeft,
  ChevronRight, FileEdit, Download, ArrowLeft, 
  ShieldAlert, Utensils, Bath, Wrench, ClipboardList, FileBarChart2,
  MapPin, Phone, Mail, Flag, Heart, AlertCircle, CircleUser, AlarmClock
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

// Define interfaces for our data structures
interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
}

interface AboutMe {
  preferences: string[];
  routines: string[];
  interests: string[];
  dislikes: string[];
}

interface Goal {
  title: string;
  status: string;
  target: string;
  notes: string;
}

interface Activity {
  date: Date;
  action: string;
  performer: string;
  status: string;
}

interface Note {
  date: Date;
  author: string;
  content: string;
}

interface Document {
  name: string;
  date: Date;
  type: string;
  author: string;
}

interface Assessment {
  name: string;
  date: Date;
  status: string;
  performer: string;
  results: string;
}

interface VitalSign {
  date: Date;
  type: string;
  value: string;
  notes: string;
}

interface CareTeamMember {
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface FamilyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

interface Nutrition {
  dietaryRestrictions: string[];
  mealPreferences: string[];
  hydrationPlan: string;
  nutritionalNotes: string;
}

interface SocialWorker {
  name: string;
  phone: string;
  email: string;
  lastVisit: Date;
  nextVisit: Date;
  notes: string;
}

interface Equipment {
  name: string;
  type: string;
  status: string;
  notes: string;
  lastInspection: Date;
}

interface DietaryRestriction {
  name: string;
  reason: string;
  severity: string;
}

interface Supplement {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
}

interface DietaryRequirements {
  mealPlan: string;
  restrictions: DietaryRestriction[];
  preferences: string[];
  supplements: Supplement[];
  notes: string;
  hydrationPlan: string;
  nutritionalNotes: string;
}

interface PersonalCareActivity {
  activity: string;
  frequency: string;
  assistance: string;
  notes: string;
}

interface MobilityStatus {
  status: string;
  transferAbility: string;
  walkingDistance: string;
  stairs: string;
  notes: string;
}

interface PersonalCare {
  routines: PersonalCareActivity[];
  preferences: string[];
  mobility: MobilityStatus;
}

interface RiskAssessment {
  type: string;
  level: string;
  lastAssessed: Date;
  assessedBy: string;
  mitigationPlan: string;
  reviewDate: Date;
}

interface LongTermGoal {
  goal: string;
  targetDate: Date;
  status: string;
  progress: string;
}

interface IndividualizedPlan {
  longTermGoals: LongTermGoal[];
  strengths: string[];
  challenges: string[];
  preferences: string[];
}

interface ServiceAction {
  service: string;
  provider: string;
  frequency: string;
  duration: string;
  schedule: string;
  goals: string[];
  progress: string;
}

interface PatientData {
  gender: string;
  dateOfBirth: Date;
  address: string;
  phone: string;
  email: string;
  emergencyContact: string;
  preferredLanguage: string;
  allergies: string[];
  medicalConditions: string[];
  medications: Medication[];
  aboutMe: AboutMe;
  goals: Goal[];
  activities: Activity[];
  notes: Note[];
  documents: Document[];
  assessments: Assessment[];
  vitalSigns: VitalSign[];
  careTeam: CareTeamMember[];
  familyContacts: FamilyContact[];
  nutrition: Nutrition;
  socialWorker: SocialWorker;
  equipment: Equipment[];
  dietaryRequirements: DietaryRequirements;
  personalCare: PersonalCare;
  riskAssessments: RiskAssessment[];
  individualizedPlan: IndividualizedPlan;
  serviceActions: ServiceAction[];
}

interface CarePlan {
  id: string;
  patientName: string;
  patientId: string;
  dateCreated: Date;
  lastUpdated: Date;
  status: string;
  assignedTo: string;
  avatar: string;
}

// Mock data with the correct typing
const mockPatientData: PatientData = {
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
    notes: "Patient struggles with appetite in the evenings. Family members have been advised to offer light protein-rich snacks in the afternoon.",
    hydrationPlan: "Minimum 8 glasses of water daily, monitored with checklist",
    nutritionalNotes: "Patient struggles with maintaining adequate hydration. Family has been advised to encourage fluid intake throughout the day."
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
const mockCarePlans: CarePlan[] = [
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
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);

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
          {/* Enhanced Header with Logo */}
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
              {/* Patient Header - Enhanced */}
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
                {/* Left sidebar - Enhanced */}
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
                            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Record Incident</span>
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-blue-50 border-blue-100">
                            <FileCheck className="h-4 w-4 mr-2 text-green-600" />
                            <span>Update Status</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Main content area - Enhanced with Tabs */}
                <div className="flex-1">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4 w-full md:w-auto">
                      <TabsTrigger value="personal" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Personal</span>
                      </TabsTrigger>
                      <TabsTrigger value="medical" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>Medical</span>
                      </TabsTrigger>
                      <TabsTrigger value="diet" className="flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        <span>Diet</span>
                      </TabsTrigger>
                      <TabsTrigger value="care" className="flex items-center gap-2">
                        <Bath className="h-4 w-4" />
                        <span>Care</span>
                      </TabsTrigger>
                      <TabsTrigger value="risks" className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        <span>Risks</span>
                      </TabsTrigger>
                      <TabsTrigger value="equipment" className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        <span>Equipment</span>
                      </TabsTrigger>
                      <TabsTrigger value="plan" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        <span>Plan</span>
                      </TabsTrigger>
                      <TabsTrigger value="reports" className="flex items-center gap-2">
                        <FileBarChart2 className="h-4 w-4" />
                        <span>Reports</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Personal Tab Content - Enhanced, modern UI */}
                    <TabsContent value="personal" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-blue-100">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                            <div className="flex items-center gap-2">
                              <CircleUser className="h-5 w-5 text-blue-600" />
                              <CardTitle className="text-lg font-bold text-gray-800">Personal Information</CardTitle>
                            </div>
                            <CardDescription>Basic information and demographics</CardDescription>
                          </CardHeader>
                          <CardContent className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                <p className="text-xs font-medium text-gray-500">Gender</p>
                                <p className="text-sm font-medium">{mockPatientData.gender}</p>
                              </div>
                              <div className="space-y-1 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                <p className="text-xs font-medium text-gray-500">Date of Birth</p>
                                <p className="text-sm font-medium">{format(mockPatientData.dateOfBirth, 'MMMM d, yyyy')} ({new Date().getFullYear() - mockPatientData.dateOfBirth.getFullYear()} years)</p>
                              </div>
                              <div className="space-y-1 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                <p className="text-xs font-medium text-gray-500">Language</p>
                                <p className="text-sm font-medium">{mockPatientData.preferredLanguage}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <h3 className="text-sm font-semibold">Address</h3>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                <p className="text-sm">{mockPatientData.address}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-blue-600" />
                                  <h3 className="text-sm font-semibold">Phone</h3>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                  <p className="text-sm">{mockPatientData.phone}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-blue-600" />
                                  <h3 className="text-sm font-semibold">Email</h3>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                  <p className="text-sm">{mockPatientData.email}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <h3 className="text-sm font-semibold">Emergency Contact</h3>
                              </div>
                              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                <p className="text-sm">{mockPatientData.emergencyContact}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* About Me Section */}
                        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-blue-100">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                            <div className="flex items-center gap-2">
                              <Heart className="h-5 w-5 text-pink-500" />
                              <CardTitle className="text-lg font-bold text-gray-800">About Me</CardTitle>
                            </div>
                            <CardDescription>Preferences, routines and interests</CardDescription>
                          </CardHeader>
                          <CardContent className="p-5 space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Flag className="h-4 w-4 text-green-500" />
                                <h3 className="text-sm font-semibold">Preferences</h3>
                              </div>
                              <div className="space-y-2">
                                {mockPatientData.aboutMe.preferences.map((preference, index) => (
                                  <div key={index} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-200 hover:shadow-sm transition-all duration-200">
                                    <p className="text-sm">{preference}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <AlarmClock className="h-4 w-4 text-amber-500" />
                                <h3 className="text-sm font-semibold">Daily Routines</h3>
                              </div>
                              <div className="space-y-2">
                                {mockPatientData.aboutMe.routines.map((routine, index) => (
                                  <div key={index} className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-200 hover:shadow-sm transition-all duration-200">
                                    <p className="text-sm">{routine}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Heart className="h-4 w-4 text-red-500" />
                                  <h3 className="text-sm font-semibold">Interests</h3>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex flex-wrap gap-2">
                                    {mockPatientData.aboutMe.interests.map((interest, index) => (
                                      <Badge key={index} variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
                                        {interest}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                  <h3 className="text-sm font-semibold">Dislikes</h3>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex flex-wrap gap-2">
                                    {mockPatientData.aboutMe.dislikes.map((dislike, index) => (
                                      <Badge key={index} variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50">
                                        {dislike}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Family Contacts */}
                        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-blue-100 md:col-span-2">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-purple-600" />
                              <CardTitle className="text-lg font-bold text-gray-800">Family Contacts</CardTitle>
                            </div>
                            <CardDescription>Family members and primary contacts</CardDescription>
                          </CardHeader>
                          <CardContent className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {mockPatientData.familyContacts.map((contact, index) => (
                                <div 
                                  key={index} 
                                  className={`p-4 rounded-lg border ${contact.isPrimary ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'} hover:shadow-md transition-all duration-300`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className={`h-10 w-10 rounded-lg ${contact.isPrimary ? 'bg-purple-600' : 'bg-gray-500'}`}>
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                          {contact.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                      </Avatar>
                                      <div>
                                        <h4 className="font-semibold">{contact.name}</h4>
                                        <p className="text-sm text-gray-600">{contact.relationship}</p>
                                      </div>
                                    </div>
                                    {contact.isPrimary && (
                                      <Badge variant="outline" className="bg-purple-100 border-purple-200 text-purple-700">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="mt-4 grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="h-3.5 w-3.5 text-gray-500" />
                                      <span>{contact.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="h-3.5 w-3.5 text-gray-500" />
                                      <span>{contact.email}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Medical Tab Content - Placeholder */}
                    <TabsContent value="medical">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Medical Information</CardTitle>
                            <CardDescription>Conditions, medications, and assessments</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Medical information would go here */}
                            <p>Medical information tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Diet Tab Content - Placeholder */}
                    <TabsContent value="diet">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Dietary Requirements</CardTitle>
                            <CardDescription>Nutrition plan and restrictions</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Diet information would go here */}
                            <p>Diet tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Care Tab Content - Placeholder */}
                    <TabsContent value="care">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Personal Care</CardTitle>
                            <CardDescription>Care routines and assistance needed</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Personal care information would go here */}
                            <p>Care tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Risks Tab Content - Placeholder */}
                    <TabsContent value="risks">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Risk Assessments</CardTitle>
                            <CardDescription>Identified risks and mitigation plans</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Risk information would go here */}
                            <p>Risks tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Equipment Tab Content - Placeholder */}
                    <TabsContent value="equipment">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Equipment</CardTitle>
                            <CardDescription>Assistive devices and medical equipment</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Equipment information would go here */}
                            <p>Equipment tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Plan Tab Content - Placeholder */}
                    <TabsContent value="plan">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Care Plan</CardTitle>
                            <CardDescription>Goals, services, and individualized plan</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Care plan information would go here */}
                            <p>Plan tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Reports Tab Content - Placeholder */}
                    <TabsContent value="reports">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Reports</CardTitle>
                            <CardDescription>Generated reports and analytics</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Reports information would go here */}
                            <p>Reports tab content</p>
                          </CardContent>
                        </Card>
                      </div>
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
