import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity, ChevronLeft,
  ChevronRight, FileEdit, Download, ArrowLeft, 
  ShieldAlert, Utensils, Bath, Wrench, ClipboardList, FileBarChart2,
  MapPin, Phone, Mail, Flag, Heart, AlertCircle, CircleUser, AlarmClock,
  Target, Award, CheckCircle, CheckCircle2, Hourglass, XCircle, BookOpen,
  UserCog, Rocket, BrainCircuit, ArrowUpRight, List, ListChecks, Timeline
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

const mockPatientData: PatientData = {
  // ... (same as original mockPatientData)
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
                    
                    <TabsContent value="medical">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Medical Information</CardTitle>
                            <CardDescription>Conditions, medications, and assessments</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Medical information tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="diet">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Dietary Requirements</CardTitle>
                            <CardDescription>Nutrition plan and restrictions</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Diet tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="care">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Personal Care</CardTitle>
                            <CardDescription>Care routines and assistance needed</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Care tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="risks">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Risk Assessments</CardTitle>
                            <CardDescription>Identified risks and mitigation plans</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Risks tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="equipment">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Equipment</CardTitle>
                            <CardDescription>Assistive devices and medical equipment</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Equipment tab content</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="plan" className="mt-6">
                      <div className="grid grid-cols-1 gap-6">
                        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-blue-100">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                            <div className="flex items-center gap-2">
                              <Target className="h-5 w-5 text-blue-600" />
                              <CardTitle className="text-lg font-bold text-gray-800">Long-Term Goals</CardTitle>
                            </div>
                            <CardDescription>Objectives and progress tracking</CardDescription>
                          </CardHeader>
                          <CardContent className="p-5 space-y-4">
                            {mockPatientData.individualizedPlan.longTermGoals.map((goal, index) => (
                              <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-all">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-start gap-3">
                                    {goal.status === "Completed" ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                    ) : goal.status === "In Progress" ? (
                                      <Hourglass className="h-5 w-5 text-amber-500 mt-0.5" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                    )}
                                    <div>
                                      <h3 className="font-medium text-gray-800">{goal.goal}</h3>
                                      <p className="text-sm text-gray-500 mt-1">{goal.progress}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Badge 
                                      variant="outline" 
                                      className={`
                                        ${goal.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" : 
                                          goal.status === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200" : 
                                          "bg-gray-50 text-gray-700 border-gray-200"}
                                      `}
                                    >
                                      {goal.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Target: {format(goal.targetDate, 'MMM dd, yyyy')}</span>
                                  </div>
                                  
                                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    Update Progress
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-blue-100">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                              <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-green-600" />
                                <CardTitle className="text-lg font-bold text-gray-800">Strengths & Abilities</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent className="p-5">
                              <ul className="space-y-2">
                                {mockPatientData.individualizedPlan.strengths.map((strength, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                          
                          <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-blue-100">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                <CardTitle className="text-lg font-bold text-gray-800">Challenges</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent className="p-5">
                              <ul className="space-y-2">
                                {mockPatientData.individualizedPlan.challenges.map((challenge, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{challenge}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-blue-100">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ListChecks className="h-5 w-5 text-purple-600" />
                              <CardTitle className="text-lg font-bold text-gray-800">Service Actions</CardTitle>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Plus className="h-4 w-4" />
                              Add Service
                            </Button>
                          </CardHeader>
                          <CardContent className="p-5 space-y-6">
                            {mockPatientData.serviceActions.map((service, index) => (
                              <div key={index} className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-4 border-b">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                      {service.service === "Physical Therapy" ? (
                                        <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                          <Activity className="h-5 w-5" />
                                        </div>
                                      ) : service.service === "Medication Management" ? (
                                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                          <FileCheck className="h-5 w-5" />
                                        </div>
                                      ) : service.service === "Dietary Counseling" ? (
                                        <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                          <Utensils className="h-5 w-5" />
                                        </div>
                                      ) : (
                                        <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                          <UserCog className="h-5 w-5" />
                                        </div>
                                      )}
                                      <div>
                                        <h3 className="font-medium">{service.service}</h3>
                                        <p className="text-sm text-gray-500">Provider: {service.provider}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant="outline" className="bg-white">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {service.frequency}
                                      </Badge>
                                      <Badge variant="outline" className="bg-white">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {service.schedule}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                        <Target className="h-4 w-4 text-blue-600" />
                                        Goals
                                      </h4>
                                      <ul className="space-y-1 pl-6 list-disc text-sm">
                                        {service.goals.map((goal, goalIndex) => (
                                          <li key={goalIndex}>{goal}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                        <Timeline className="h-4 w-4 text-green-600" />
                                        Progress
                                      </h4>
                                      <p className="text-sm bg-gray-50 p-3 rounded-md">{service.progress}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                        
                        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-blue-100">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                              <CardTitle className="text-lg font-bold text-gray-800">Individualized Care Approach</CardTitle>
                            </div>
                            <CardDescription>Care preferences and approaches</CardDescription>
                          </CardHeader>
                          <CardContent className="p-5">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-1 text-gray-700">
                                  <Flag className="h-4 w-4 text-blue-600" />
                                  Care Preferences
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {mockPatientData.individualizedPlan.preferences.map((preference, index) => (
                                    <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                      <p className="text-sm">{preference}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <FileText className="h-4 w-4" />
                                    Print Care Plan
                                  </Button>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Share className="h-4 w-4" />
                                    Share with Team
                                  </Button>
                                </div>
                                <Button variant="default" size="sm" className="gap-1">
                                  <Edit className="h-4 w-4" />
                                  Edit Plan
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="reports">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Reports</CardTitle>
                            <CardDescription>Generated reports and analytics</CardDescription>
                          </CardHeader>
                          <CardContent>
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
