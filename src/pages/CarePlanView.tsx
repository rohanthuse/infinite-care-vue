import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity, ChevronLeft,
  ChevronRight, FileEdit, Download, ArrowLeft, 
  ShieldAlert, Utensils, Bath, Wrench, ClipboardList, FileBarChart2,
  MapPin, Phone, Mail, Flag, Heart, AlertCircle, CircleUser, AlarmClock,
  Target, Award, CheckCircle, CheckCircle2, Hourglass, XCircle, BookOpen,
  UserCog, Rocket, BrainCircuit, ArrowUpRight, List, ListChecks, 
  Plus, Share, Edit
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

const mockPatientData: PatientData = {
  gender: "Male",
  dateOfBirth: new Date("1950-06-15"),
  address: "123 Main Street, Milton Keynes, MK9 3NZ",
  phone: "+44 7700 900123",
  email: "john.michael@example.com",
  emergencyContact: "Sarah Michael (Daughter) - +44 7700 900456",
  preferredLanguage: "English",
  allergies: ["Penicillin", "Dust", "Pollen"],
  medicalConditions: ["Type 2 Diabetes", "Hypertension", "Arthritis"],
  medications: [
    {
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      purpose: "Diabetes management"
    },
    {
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      purpose: "Blood pressure control"
    },
    {
      name: "Paracetamol",
      dosage: "500mg",
      frequency: "As needed",
      purpose: "Pain relief"
    }
  ],
  aboutMe: {
    preferences: [
      "Prefers to be called 'John' rather than 'Mr. Michael'",
      "Likes to have a cup of tea before bed",
      "Prefers shower in the morning rather than evening"
    ],
    routines: [
      "Wakes up at 7:00 AM",
      "Takes morning medication with breakfast at 8:00 AM",
      "Afternoon walk at 2:00 PM weather permitting",
      "Evening medication at 8:00 PM"
    ],
    interests: ["Reading", "Classical Music", "Chess", "Gardening", "History"],
    dislikes: ["Loud environments", "Spicy food", "Being rushed"]
  },
  goals: [
    {
      title: "Improve mobility",
      status: "In Progress",
      target: "Walk without a cane by December",
      notes: "Making good progress with physical therapy"
    },
    {
      title: "Better diabetes management",
      status: "Active",
      target: "Maintain HbA1c below 7.0",
      notes: "Diet adjustments needed"
    }
  ],
  activities: [
    {
      date: new Date("2023-10-20"),
      action: "Physical Therapy Session",
      performer: "Sarah Johnson",
      status: "Completed"
    },
    {
      date: new Date("2023-10-18"),
      action: "Blood Pressure Check",
      performer: "Dr. Robert Chen",
      status: "Completed"
    }
  ],
  notes: [
    {
      date: new Date("2023-10-15"),
      author: "Dr. Sarah Johnson",
      content: "Patient reported increased pain in left knee. Recommended gentle exercises and temporary increase in pain medication."
    },
    {
      date: new Date("2023-10-10"),
      author: "Nurse Michael Smith",
      content: "Medication review completed. No changes to current regimen needed."
    }
  ],
  documents: [
    {
      name: "Hospital Discharge Summary",
      date: new Date("2023-09-15"),
      type: "Medical Record",
      author: "Dr. Williams"
    },
    {
      name: "Physical Therapy Plan",
      date: new Date("2023-09-20"),
      type: "Care Plan",
      author: "Sarah Johnson, PT"
    }
  ],
  assessments: [
    {
      name: "Cognitive Assessment",
      date: new Date("2023-09-10"),
      status: "Completed",
      performer: "Dr. James Wilson",
      results: "Normal cognitive function for age"
    },
    {
      name: "Fall Risk Assessment",
      date: new Date("2023-09-12"),
      status: "Completed",
      performer: "Sarah Johnson, PT",
      results: "Moderate risk - preventive measures implemented"
    }
  ],
  vitalSigns: [
    {
      date: new Date("2023-10-20"),
      type: "Blood Pressure",
      value: "138/85 mmHg",
      notes: "Slightly elevated but within acceptable range"
    },
    {
      date: new Date("2023-10-20"),
      type: "Heart Rate",
      value: "72 bpm",
      notes: "Regular rhythm"
    }
  ],
  careTeam: [
    {
      name: "Dr. Sarah Johnson",
      role: "Primary Care Physician",
      phone: "+44 7700 900789",
      email: "s.johnson@medinfinite.com"
    },
    {
      name: "Michael Smith",
      role: "Registered Nurse",
      phone: "+44 7700 900321",
      email: "m.smith@medinfinite.com"
    }
  ],
  familyContacts: [
    {
      name: "Sarah Michael",
      relationship: "Daughter",
      phone: "+44 7700 900456",
      email: "sarah.michael@example.com",
      isPrimary: true
    },
    {
      name: "James Michael",
      relationship: "Son",
      phone: "+44 7700 900457",
      email: "james.michael@example.com",
      isPrimary: false
    }
  ],
  nutrition: {
    dietaryRestrictions: ["Low sodium", "Diabetic diet"],
    mealPreferences: ["Enjoys fish", "Prefers vegetables to be well-cooked"],
    hydrationPlan: "Minimum 8 glasses of water daily",
    nutritionalNotes: "Monitor fruit intake due to diabetes"
  },
  socialWorker: {
    name: "Emma Watson",
    phone: "+44 7700 900654",
    email: "e.watson@medinfinite.com",
    lastVisit: new Date("2023-10-05"),
    nextVisit: new Date("2023-11-05"),
    notes: "Discussing community resources for social engagement"
  },
  equipment: [
    {
      name: "Walker",
      type: "Mobility Aid",
      status: "In use",
      notes: "Patient using it for longer walks outside",
      lastInspection: new Date("2023-09-01")
    },
    {
      name: "Shower Chair",
      type: "Bathroom Safety",
      status: "In use",
      notes: "Working well, no issues",
      lastInspection: new Date("2023-09-01")
    }
  ],
  dietaryRequirements: {
    mealPlan: "Diabetic meal plan - 1800 calories daily",
    restrictions: [
      {
        name: "Sugar",
        reason: "Diabetes management",
        severity: "High"
      },
      {
        name: "Salt",
        reason: "Hypertension management",
        severity: "Moderate"
      }
    ],
    preferences: ["Fish", "Chicken", "Green vegetables"],
    supplements: [
      {
        name: "Vitamin D",
        dosage: "1000 IU",
        frequency: "Once daily",
        purpose: "Bone health"
      },
      {
        name: "Calcium",
        dosage: "600mg",
        frequency: "Once daily with meal",
        purpose: "Bone health"
      }
    ],
    notes: "Patient dislikes red meat",
    hydrationPlan: "8-10 glasses of water daily",
    nutritionalNotes: "Encourage whole grains and complex carbohydrates"
  },
  personalCare: {
    routines: [
      {
        activity: "Bathing",
        frequency: "Daily",
        assistance: "Minimal assistance entering/exiting shower",
        notes: "Prefers morning showers"
      },
      {
        activity: "Grooming",
        frequency: "Daily",
        assistance: "Independent",
        notes: "May need occasional reminders"
      }
    ],
    preferences: ["Prefers electric razor", "Likes to wear own clothes"],
    mobility: {
      status: "Ambulatory with assistance",
      transferAbility: "Requires minimal assistance",
      walkingDistance: "Up to 100 meters with walker",
      stairs: "Can manage 5-6 steps with handrail",
      notes: "Better mobility in the morning, fatigue in evening"
    }
  },
  riskAssessments: [
    {
      type: "Fall Risk",
      level: "Moderate",
      lastAssessed: new Date("2023-09-15"),
      assessedBy: "Sarah Johnson, PT",
      mitigationPlan: "Use of walker, removal of trip hazards, night light",
      reviewDate: new Date("2023-12-15")
    },
    {
      type: "Skin Integrity",
      level: "Low",
      lastAssessed: new Date("2023-09-15"),
      assessedBy: "Michael Smith, RN",
      mitigationPlan: "Regular position changes, proper hydration",
      reviewDate: new Date("2023-12-15")
    }
  ],
  individualizedPlan: {
    longTermGoals: [
      {
        goal: "Improve mobility to walk independently",
        targetDate: new Date("2024-03-01"),
        status: "In Progress",
        progress: "Currently using walker for support, working on strength exercises"
      },
      {
        goal: "Better manage blood sugar levels",
        targetDate: new Date("2023-12-31"),
        status: "In Progress",
        progress: "Diet adjustments ongoing, monitoring blood glucose regularly"
      },
      {
        goal: "Increase social engagement",
        targetDate: new Date("2024-01-15"),
        status: "Not Started",
        progress: "Planning to attend community center activities starting next month"
      }
    ],
    strengths: [
      "Strong motivation to improve health",
      "Good cognitive function",
      "Supportive family network",
      "Adherent to medication regimen"
    ],
    challenges: [
      "Mobility limitations due to arthritis",
      "Managing multiple chronic conditions",
      "Occasional memory lapses with daily routines",
      "Limited social engagement outside family"
    ],
    preferences: [
      "Prefers morning appointments",
      "Likes to be involved in care decisions",
      "Prefers detailed explanations of care changes",
      "Values consistency in caregivers"
    ]
  },
  serviceActions: [
    {
      service: "Physical Therapy",
      provider: "Sarah Johnson, PT",
      frequency: "Twice weekly",
      duration: "45 minutes",
      schedule: "Mondays and Thursdays at 10:00 AM",
      goals: [
        "Improve strength in lower extremities",
        "Enhance balance and coordination",
        "Increase walking distance without assistance"
      ],
      progress: "Showing steady improvement in strength and balance"
    },
    {
      service: "Medication Management",
      provider: "Michael Smith, RN",
      frequency: "Weekly",
      duration: "30 minutes",
      schedule: "Wednesdays at 2:00 PM",
      goals: [
        "Ensure medication compliance",
        "Monitor for side effects",
        "Adjust medication timing for optimal effect"
      ],
      progress: "Good adherence to medication schedule, no significant side effects reported"
    },
    {
      service: "Dietary Counseling",
      provider: "Lisa Chen, Dietitian",
      frequency: "Monthly",
      duration: "60 minutes",
      schedule: "First Tuesday of each month at 11:00 AM",
      goals: [
        "Optimize diabetic diet",
        "Ensure adequate nutrition",
        "Manage weight appropriately"
      ],
      progress: "Diet adjustments helping with blood sugar control, weight stable"
    }
  ]
};

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
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
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
                    
                    <TabsContent value="personal" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <p className="text-xs font-medium text-gray-500">Address</p>
                                <p className="text-sm font-medium">{mockPatientData.address}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="medical" className="mt-6">
                      {/* Medical tab content will go here */}
                    </TabsContent>
                    
                    <TabsContent value="diet" className="mt-6">
                      {/* Diet tab content will go here */}
                    </TabsContent>
                    
                    <TabsContent value="care" className="mt-6">
                      {/* Care tab content will go here */}
                    </TabsContent>
                    
                    <TabsContent value="risks" className="mt-6">
                      {/* Risks tab content will go here */}
                    </TabsContent>
                    
                    <TabsContent value="equipment" className="mt-6">
                      {/* Equipment tab content will go here */}
                    </TabsContent>
                    
                    <TabsContent value="plan" className="mt-6">
                      {/* Plan tab content will go here */}
                    </TabsContent>
                    
                    <TabsContent value="reports" className="mt-6">
                      {/* Reports tab content will go here */}
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
