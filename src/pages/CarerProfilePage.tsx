<lov-code>
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { 
  User, Phone, Mail, MapPin, Calendar, FileText, Heart, 
  Briefcase, Users, CheckCircle, XCircle, Clock, AlertCircle, 
  Download, ChevronLeft, Edit, ArrowLeft, FileIcon, Star,
  Clipboard, Award, UserCheck, HeartHandshake, ListChecks, Newspaper,
  Plus, ChevronDown
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Enhanced mock data for a single carer based on the screenshots
const mockCarerData = {
  id: "CR-001",
  carerId: "111111",
  name: "Ayo-Famure, Opeyemi",
  firstName: "Opeyemi",
  middleName: "Olumide",
  surname: "Ayo-Famure",
  knownAs: "",
  title: "Mrs",
  jobTitle: "Administrator",
  email: "opeawoz@gmail.com",
  phone: "+44 20 7946 3344",
  mobile: "+44 07846427297",
  location: "Milton Keynes, MK9 3NZ",
  status: "Active",
  avatar: "OA",
  experience: "1 year 2 months 27 days",
  specialization: "Home Care",
  availability: "Full-time",
  profileImage: null,
  dateOfBirth: "28-12-1987",
  gender: "Female",
  pronouns: "",
  joinedOn: "07/12/2023",
  nationality: "British",
  countryCode: "England",
  supervisor: "Iyaniwura, Ifeoluwa",
  introductionMethod: "Online Search",
  rating: 5,
  profileCompletion: 91
};

// Updated essentials items with status
const essentials = [
  { name: "Work Permit & Nationality", status: "completed" },
  { name: "Vaccination", status: "completed" },
  { name: "Car Insurance", status: "completed" },
  { name: "Name Change", status: "completed" },
  { name: "Driving License", status: "completed" },
  { name: "NI Number", status: "completed" },
  { name: "P45", status: "completed" },
  { name: "Proof of Address", status: "completed" },
  { name: "DBS", status: "completed" },
  { name: "Bank Details", status: "missing" },
  { name: "Individualised", status: "pending" },
  { name: "Documents & Additional Information", status: "pending" }
];

// Updated employment history to match the screenshots
const employmentHistory = [
  {
    company: "Volkswagen",
    position: "Administrator",
    startDate: "Mar 2023",
    endDate: "Mar 2024",
    referenceDate: "09/01/2025",
    referenceType: "Professional",
    status: "Confirmed"
  },
  {
    company: "Open University",
    position: "Administrator",
    startDate: "Aug 2022",
    endDate: "Jan 2023",
    referenceDate: "09/01/2025",
    referenceType: "Professional",
    status: "Confirmed"
  },
  {
    company: "Krones LCS",
    position: "Administrator",
    startDate: "Apr 2016",
    endDate: "Feb 2022",
    referenceDate: "",
    referenceType: "Professional",
    status: "Confirmed"
  }
];

// Mock data for supporting statement
const supportingStatement = {
  whyInterested: "I am interested in working with Brielle because of your dedication to providing high-quality, client-centered care. Your emphasis on being Safe, Well-led, Caring, Responsive, and Effective resonates strongly with my professional values, and I am eager to contribute my skills to support your mission.",
  vulnerableExperience: "While I don't have formal on-field experience, I have personal experience caring for a family member who required support due to illness. This involved assisting with daily tasks, offering emotional support, and ensuring their comfort and well-being. Through this, I've developed compassion, patience, and a deep understanding of the needs of vulnerable individuals.",
  strengths: "My strengths lie in my strong organisational skills, attention to detail, and ability to communicate effectively. I excel in managing schedules, ensuring smooth operations, and providing support to both staff and clients. My aspiration is to contribute to the seamless functioning of Brielle by maintaining high standards of efficiency and professionalism.\n\nWhat sets me apart is my proactive approach to problem-solving and my commitment to creating a supportive environment where everyone feels valued. I take pride in being adaptable, approachable, and always willing to go the extra mile to ensure that tasks are completed efficiently and effectively."
};

// Mock data for documents
const documents = [
  {
    name: "Right_to_work_opeyemi.jpg",
    type: "Work Permit",
    uploadDate: "10 Jan 2023",
    size: "0.07 KB"
  },
  {
    name: "ID_Verification.pdf",
    type: "Identification",
    uploadDate: "10 Jan 2023",
    size: "1.2 MB"
  },
  {
    name: "Vaccination_Certificate.pdf",
    type: "Health Document",
    uploadDate: "15 Feb 2023",
    size: "3.1 MB"
  }
];

// Mock data for skills
const skills = [
  "Patience", "Friendly", "Cheerful", "Ability to think quickly", 
  "A good listener", "Kind", "Willingness to go the extra mile",
  "Pleasant", "Personable", "Ability to multi-task", "Punctual",
  "Empathetic", "Ability to take responsibility", "Knowledge of dementia",
  "Knowledge of Learning Disability", "Knowledge of Mental Health",
  "Challenging Behaviour Experience", "Lone Working Experience",
  "Knowledge of Safeguarding", "Good Communicator", "First Aid Experience",
  "Supervision Experience", "Knowledge of Mental Capacity Act"
];

// Mock data for type of work
const typeOfWork = ["Personal Care", "Urgent Responder", "Home Help"];

// Mock data for hobbies
const hobbies = ["Listening to Music", "Cooking", "Reading"];

// Mock employee information
const employeeInfo = {
  employeeType: "PAYE",
  joinDate: "07-12-2023",
  agreement: "",
  manager: "Iyaniwura, Ifeoluwa",
  expiryDate: false,
  travelRate: "",
  payslipConfig: "", 
  payrollNumber: "",
  canBookUrgent: false,
  showInTaskMatrix: true,
  showInTrainingMatrix: true,
  showInFormMatrix: true,
  enableMaxHours: false
};

// Profile completion checklist items
const profileCompletionItems = [
  { name: "Personal Details", completed: true },
  { name: "Address", completed: true },
  { name: "Essentials", completed: false },
  { name: "Important Contact", completed: true },
  { name: "Supporting Statement", completed: true },
  { name: "Attendance", completed: true },
  { name: "Employment History", completed: true },
  { name: "Files", completed: true },
  { name: "Hobbies", completed: true }, 
  { name: "Skills", completed: true },
  { name: "Type of Work", completed: true }
];

const CarerProfilePage = () => {
  const { id, branchName, carerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const handleBack = () => {
    navigate(`/branch-dashboard/${id}/${branchName}`);
  };

  // In a real app, you would fetch the carer data based on carerId
  const carer = mockCarerData;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container px-4 pt-4 pb-20 md:py-6 mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Carer Profile</h1>
            <div className="text-sm text-gray-500 flex items-center">
              <span className="mr-2">Branch: {branchName}</span>
              <span>•</span>
              <span className="ml-2">ID: {carer.carerId}</span>
            </div>
          </div>
          <Button variant="outline" className="mr-2">
            <Edit className="h-4 w-4 mr-1" />
            Edit Profile
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar with basic info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarImage src={carer.profileImage} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                      {carer.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-center">{carer.name}</h3>
                  <p className="text-sm text-gray-500 text-center">{carer.jobTitle}</p>
                  <Badge 
                    variant="outline" 
                    className={`
                      mt-2
                      ${carer.status === "Active" ? "bg-green-50 text-green-700 border-0" : ""}
                      ${carer.status === "Inactive" ? "bg-red-50 text-red-700 border-0" : ""}
                      ${carer.status === "On Leave" ? "bg-amber-50 text-amber-700 border-0" : ""}
                    `}
                  >
                    {carer.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm break-all">{carer.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{carer.mobile}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{carer.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Joined: {carer.joinedOn}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <UserCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Supervisor: {carer.supervisor}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-medium text-sm mb-2">Profile Completion</h4>
                  <div className="flex items-center mb-2">
                    <Progress value={carer.profileCompletion} className="h-2 flex-1" />
                    <span className="ml-2 text-sm font-medium">{carer.profileCompletion}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Complete all required fields to activate this profile</p>
                  
                  <div className="space-y-1.5">
                    {profileCompletionItems.map((item, index) => (
                      <div key={index} className="flex items-center text-sm">
                        {item.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className={item.completed ? "text-gray-700" : "text-red-500 font-medium"}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-6 gap-2 mb-6 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="personal">Personal Details</TabsTrigger>
                <TabsTrigger value="essentials">Essentials</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="statements">Statements</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-500">ID No:</h3>
                          <p>{carer.carerId}</p>
                        </div>
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-500">Joined On:</h3>
                          <p>{carer.joinedOn}</p>
                        </div>
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-500">Location:</h3>
                          <p>{carer.location}</p>
                        </div>
                      </div>
                      <div>
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-500">Telephone:</h3>
                          <p>{carer.phone}</p>
                        </div>
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-500">Mobile:</h3>
                          <p>{carer.mobile}</p>
                        </div>
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-500">Email:</h3>
                          <p>{carer.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <Card className="bg-cyan-500 text-white">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-medium mb-2">Supervisor</h3>
                          <p className="text-lg font-semibold">{carer.supervisor}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-600 text-white">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-medium mb-2">Length of Service</h3>
                          <p className="text-lg font-semibold">{carer.experience}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-green-500 text-white">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-medium mb-2">Rating</h3>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-white" />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Profile Completion Percentage</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex justify-center">
                        <div className="relative w-36 h-36">
                          <div className="w-36 h-36 rounded-full bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">{carer.profileCompletion}%</div>
                              <div className="text-xs text-gray-500">Complete</div>
                            </div>
                          </div>
                          <svg className="absolute top-0 left-0 w-36 h-36" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#4CAF50"
                              strokeWidth="2"
                              strokeDasharray={`${carer.profileCompletion}, 100`}
                              strokeLinecap="round"
                              transform="rotate(-90, 18, 18)"
                            />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {profileCompletionItems.slice(0, 6).map((item, index) => (
                          <div key={index} className="flex items-center">
                            {item.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        {profileCompletionItems.slice(6).map((item, index) => (
                          <div key={index} className="flex items-center">
                            {item.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personal Details Tab */}
              <TabsContent value="personal">
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-gray-600" />
                      <CardTitle className="text-xl">Personal Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="personal-info">
                      <TabsList className="mb-4">
                        <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
                        <TabsTrigger value="address">Address</TabsTrigger>
                        <TabsTrigger value="about-me">About Me</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="personal-info">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs text-red-500 mb-1">* Required</Label>
                              <div className="flex flex-col space-y-4">
                                <div>
                                  <Label htmlFor="jobTitle" className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">Job Title</Label>
                                  <Input id="jobTitle" value={carer.jobTitle} readOnly />
                                </div>
                                
                                <div>
                                  <Label htmlFor="title" className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">Title</Label>
                                  <Input id="title" value={carer.title} readOnly />
                                </div>
                                
                                <div>
                                  <Label htmlFor="firstName" className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">First Name</Label>
                                  <Input id="firstName" value={carer.firstName} readOnly />
                                </div>
                                
                                <div>
                                  <Label htmlFor="middleName" className="mb-1">Middle Name</Label>
                                  <Input id="middleName" value={carer.middleName} readOnly />
                                </div>
                                
                                <div>
                                  <Label htmlFor="surname" className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">Surname</Label>
                                  <Input id="surname" value={carer.surname} readOnly />
                                </div>
                                
                                <div>
                                  <Label htmlFor="knownAs" className="mb-1">Known As</Label>
                                  <Input id="knownAs" value={carer.knownAs} readOnly />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex flex-col space-y-4">
                              <div>
                                <Label htmlFor="email" className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">Email</Label>
                                <Input id="email" value={carer.email} readOnly />
                              </div>
                              
                              <div>
                                <Label className="mb-1">Gender</Label>
                                <RadioGroup defaultValue={carer.gender.toLowerCase()}>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="male" id="male" disabled />
                                      <Label htmlFor="male">Male</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="female" id="female" disabled />
                                      <Label htmlFor="female">Female</Label>
                                    </div>
                                  </div>
                                </RadioGroup>
                              </div>
                              
                              <div>
                                <Label htmlFor="pronouns" className="mb-1">Pronouns</Label>
                                <Input id="pronouns" value={carer.pronouns} readOnly />
                              </div>
                              
                              <div>
                                <Label htmlFor="dob" className="mb-1">Date of Birth</Label>
                                <Input id="dob" value={carer.dateOfBirth} readOnly />
                              </div>
                              
                              <div>
                                <Label htmlFor="telephone" className="mb-1">Telephone Number</Label>
                                <Input id="telephone" value={carer.phone} readOnly />
                              </div>
                              
                              <div>
                                <Label htmlFor="countryCode" className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">Country Code</Label>
                                <Input id="countryCode" value={carer.countryCode} readOnly />
                              </div>
                              
                              <div>
                                <Label htmlFor="mobile" className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">Mobile Number</Label>
                                <Input id="mobile" value={carer.mobile.replace("+44 ", "")} readOnly />
                              </div>
                              
                              <div>
                                <Label htmlFor="introduction" className="mb-1">Introduction Method</Label>
                                <Input id="introduction" value={carer.introductionMethod} readOnly />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="address">
                        <p className="text-gray-500 italic">Address information would be displayed here.</p>
                      </TabsContent>
                      
                      <TabsContent value="about-me">
                        <p className="text-gray-500 italic">Additional personal information would be displayed here.</p>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Essentials Tab */}
              <TabsContent value="essentials">
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center">
                      <Clipboard className="h-5 w-5 mr-2 text-gray-600" />
                      <CardTitle className="text-xl">Essentials</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="work-permit" className="bg-gray-50 p-4 rounded-lg border-0 mb-4">
                          <AccordionTrigger className="py-0 hover:no-underline">
                            <div className="flex items-center w-full justify-between pr-2">
                              <div className="flex items-center">
                                <CheckCircle className="text-green-600 h-5 w-5 mr-2" />
                                <h3 className="font-medium">Work Permit & Nationality</h3>
                              </div>
                              <Badge className="ml-auto bg-green-600 mr-2">Completed</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <div className="space-y-4">
                              <div>
                                <Label className="mb-1">N/A</Label>
                              </div>
                              
                              <div>
                                <Label className="mb-1">Work Permit:</Label>
                                <div className="border rounded-md p-2 bg-white">Other</div>
                              </div>
                              
                              <div>
                                <Label className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">Specify:</Label>
                                <div className="border rounded-md p-2 bg-white">BRP</div>
                              </div>
                              
                              <div>
                                <Label className="mb-1">How many hours are you allowed to work in the UK per week?</Label>
                                <div className="border rounded-md p-2 bg-white">Full-Time</div>
                              </div>
                              
                              <div>
                                <Label className="mb-1">Expiry Date:</Label>
                                <div className="border rounded-md p-2 bg-white">13-05-2028</div>
                              </div>
                              
                              <div>
                                <Label className="mb-1 after:content-['*'] after:text-red-500 after:ml-0.5">Upload a Copy:</Label>
                                <div className="border rounded p-3 bg-white mt-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-5 w-5 text-blue-500" />
                                      <div>
                                        <p className="text-sm font-medium">Right to work_opeyemi.jpg</p>
                                        <p className="text-xs text-gray-500">0.07 KB</p>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="mb-1">Right to Work/ECS Check:</Label>
                                <div className="border rounded-md p-2 bg-gray-100 text-center text-gray-500 text-sm">
                                  No file uploaded
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm">Full Name: Opeyemi Ayo-Famure</p>
                                  <p className="text-sm">Confirmed By: Ayo-Famure, Opeyemi</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm">Confirmed On: 09/01/2025</p>
                                  <Button variant="destructive" size="sm" className="mt-1">Unconfirm</Button>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Convert remaining essentials to accordion items */}
                        {["Vaccination", "Car Insurance", "Name Change", "Driving License", "NI Number", "P45", "Proof of Address", "DBS"].map((item, index) => (
                          <AccordionItem 
                            key={index} 
                            value={`item-${index}`} 
                            className="border rounded-lg overflow-hidden border-0 mb-4"
                          >
                            <AccordionTrigger className="px-4 py-4 hover:no-underline bg-white">
                              <div className="flex items-center w-full justify-between pr-2">
                                <div className="flex items-center">
                                  <CheckCircle className="text-green-600 h-5 w-5 mr-2" />
                                  <h3 className="font-medium">{item}</h3>
                                </div>
                                <Badge className="ml-auto bg-green-600 mr-2">Completed</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-2 bg-white">
                              <p className="text-gray-500">Details for {item} would be displayed here.</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                        
                        {/* Incomplete essentials */}
                        <AccordionItem value="bank-details" className="border rounded-lg overflow-hidden border-red-200 mb-4">
                          <AccordionTrigger className="px-4 py-4 hover:no-underline bg-white">
                            <div className="flex items-center w-full justify-between pr-2">
                              <div className="flex items-center">
                                <XCircle className="text-red-500 h-5 w-5 mr-2" />
                                <h3 className="font-medium">Bank Details</h3>
                              </div>
                              <Badge variant="outline" className="ml-auto bg-red-50 text-red-600 mr-2">Missing</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 pt-2 bg-white">
                            <div className="p-4 bg-red-50 rounded-md">
                              <p className="text-red-600 text-sm">This information needs to be provided.</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Pending essentials */}
                        {["Individualised", "Documents & Additional Information"].map((item, index) => (
                          <AccordionItem 
                            key={index} 
                            value={`pending-${index}`} 
                            className="border rounded-lg overflow-hidden border-amber-200 mb-4"
                          >
                            <AccordionTrigger className="px-4 py-4 hover:no-underline bg-white">
                              <div className="flex items-center w-full justify-between pr-2">
                                <div className="flex items-center">
                                  <Clock className="text-amber-500 h-5 w-5 mr-2" />
                                  <h3 className="font-medium">{item}</h3>
                                </div>
                                <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-600 mr-2">Pending</Badge>
