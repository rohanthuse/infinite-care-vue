
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { 
  User, Phone, Mail, MapPin, Calendar, FileText, Heart, 
  Briefcase, Users, CheckCircle, XCircle, Clock, AlertCircle, 
  Download, ChevronLeft, Edit, ArrowLeft, FileIcon
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for a single carer
const mockCarerData = {
  id: "CR-001",
  name: "Charuma, Charmaine",
  email: "charmaine.c@med-infinite.com",
  phone: "+44 20 7946 3344",
  location: "Milton Keynes, MK9 3NZ",
  status: "Active",
  avatar: "CC",
  experience: "3 years",
  specialization: "Home Care",
  availability: "Full-time",
  profileImage: null
};

// Mock data for essentials
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

// Mock data for employment history
const employmentHistory = [
  {
    company: "Sunrise Senior Living",
    position: "Home Care Assistant",
    startDate: "Jan 2020",
    endDate: "Dec 2022",
    description: "Provided home care services to elderly clients."
  },
  {
    company: "Care UK",
    position: "Personal Assistant",
    startDate: "Mar 2018",
    endDate: "Dec 2019",
    description: "Assisted with daily activities and medication management."
  }
];

// Mock data for training history
const trainingHistory = [
  {
    course: "First Aid Certification",
    provider: "Red Cross",
    date: "Feb 2023",
    expiry: "Feb 2025",
    status: "Valid"
  },
  {
    course: "Medication Management",
    provider: "Care Quality Commission",
    date: "Nov 2022",
    expiry: "Nov 2024",
    status: "Valid"
  },
  {
    course: "Moving and Handling",
    provider: "Health and Safety Executive",
    date: "July 2022",
    expiry: "July 2023",
    status: "Expired"
  }
];

// Mock data for meetings
const meetings = [
  {
    title: "Quarterly Review",
    date: "15 Jan 2023",
    attendees: "Jane Smith, John Doe",
    notes: "Discussed performance and goals for the next quarter."
  },
  {
    title: "Training Follow-up",
    date: "22 Mar 2023",
    attendees: "Training Department",
    notes: "Reviewed progress on required training modules."
  }
];

// Mock data for communication log
const communicationLog = [
  {
    date: "10 Apr 2023",
    type: "Phone Call",
    contact: "Supervisor",
    notes: "Discussed schedule changes for next week."
  },
  {
    date: "15 Mar 2023",
    type: "Email",
    contact: "HR Department",
    notes: "Submitted updated contact information."
  },
  {
    date: "02 Feb 2023",
    type: "Meeting",
    contact: "Team Lead",
    notes: "Quarterly performance review."
  }
];

// Mock data for attendance
const attendance = [
  {
    date: "05 May 2023",
    shift: "Morning",
    status: "Present",
    hoursWorked: 8
  },
  {
    date: "04 May 2023",
    shift: "Afternoon",
    status: "Present",
    hoursWorked: 6
  },
  {
    date: "03 May 2023",
    shift: "Morning",
    status: "Late",
    hoursWorked: 7,
    notes: "Arrived 30 minutes late due to traffic."
  },
  {
    date: "02 May 2023",
    shift: "Morning",
    status: "Absent",
    hoursWorked: 0,
    notes: "Called in sick."
  }
];

// Mock data for documents
const documents = [
  {
    name: "Contract.pdf",
    type: "Employment Contract",
    uploadDate: "10 Jan 2023",
    size: "2.5 MB"
  },
  {
    name: "ID_Verification.pdf",
    type: "Identification",
    uploadDate: "10 Jan 2023",
    size: "1.2 MB"
  },
  {
    name: "Training_Certificate.pdf",
    type: "Certification",
    uploadDate: "15 Feb 2023",
    size: "3.1 MB"
  }
];

// Mock data for important contacts
const importantContacts = [
  {
    name: "Jane Smith",
    relationship: "Emergency Contact",
    phone: "+44 20 7946 1234",
    email: "jane.smith@example.com"
  },
  {
    name: "Dr. Michael Brown",
    relationship: "Primary Doctor",
    phone: "+44 20 7946 5678",
    email: "dr.brown@example.com"
  }
];

// Mock data for hobbies
const hobbies = ["Reading", "Swimming", "Cooking", "Photography"];

// Mock data for type of work
const typeOfWork = ["Home Care", "Elderly Care", "Medication Management", "Personal Assistance"];

const CarerProfilePage = () => {
  const { id, branchName, carerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");

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
          <h1 className="text-2xl font-bold">Carer Profile</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar with basic info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarImage src={carer.profileImage} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                      {carer.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-center">{carer.name}</h3>
                  <p className="text-sm text-gray-500 text-center">{carer.specialization}</p>
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
                    <span className="text-sm">{carer.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{carer.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Experience: {carer.experience}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Availability: {carer.availability}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="personal" onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 gap-4 mb-6 w-full">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="essentials">Essentials</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm text-gray-500 mb-1">Full Name</h4>
                            <p>Charmaine Charuma</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500 mb-1">Date of Birth</h4>
                            <p>15/05/1990</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500 mb-1">Nationality</h4>
                            <p>British</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500 mb-1">National Insurance Number</h4>
                            <p>AB123456C</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Important Contacts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {importantContacts.map((contact, index) => (
                            <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                              <h4 className="font-medium">{contact.name}</h4>
                              <p className="text-sm text-gray-500">{contact.relationship}</p>
                              <div className="mt-2 text-sm">
                                <div className="flex items-center">
                                  <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                  <span>{contact.phone}</span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                  <span>{contact.email}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Type of Work</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {typeOfWork.map((work, index) => (
                              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-0">
                                {work}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Hobbies & Interests</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {hobbies.map((hobby, index) => (
                              <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-0">
                                {hobby}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Supporting Statement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">
                          I am a dedicated care professional with over 3 years of experience in home and elderly care. 
                          I am passionate about providing high-quality care that respects the dignity and independence of clients. 
                          My approach is person-centered, focusing on building relationships based on trust and understanding individual needs.
                        </p>
                        <p className="text-gray-700 mt-4">
                          I am reliable, compassionate, and committed to continuous professional development to enhance my skills and knowledge in the care sector.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="essentials" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Required Documents & Verifications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {essentials.map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between p-4 bg-white rounded-lg border"
                            >
                              <span className="font-medium">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`
                                    ${item.status === "completed" ? "bg-green-50 text-green-700 border-0" : ""}
                                    ${item.status === "missing" ? "bg-red-50 text-red-700 border-0" : ""}
                                    ${item.status === "pending" ? "bg-gray-50 text-gray-700 border-0" : ""}
                                  `}
                                >
                                  {item.status === "completed" && (
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                  )}
                                  {item.status === "missing" && (
                                    <XCircle className="w-4 h-4 mr-1" />
                                  )}
                                  {item.status === "pending" && (
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                  )}
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Badge>
                                <Button variant="ghost" size="icon">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Employment History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {employmentHistory.map((job, index) => (
                            <div key={index} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{job.position}</h4>
                                  <p className="text-sm text-gray-500">{job.company}</p>
                                </div>
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-0">
                                  {job.startDate} - {job.endDate}
                                </Badge>
                              </div>
                              <p className="mt-2 text-gray-700 text-sm">{job.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Training History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {trainingHistory.map((training, index) => (
                            <div key={index} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                              <div>
                                <h4 className="font-medium">{training.course}</h4>
                                <p className="text-sm text-gray-500">{training.provider}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Completed: {training.date} | Expires: {training.expiry}
                                </p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${training.status === "Valid" ? "bg-green-50 text-green-700 border-0" : ""}
                                  ${training.status === "Expired" ? "bg-red-50 text-red-700 border-0" : ""}
                                `}
                              >
                                {training.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Meetings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {meetings.map((meeting, index) => (
                            <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium">{meeting.title}</h4>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                                  {meeting.date}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">Attendees: {meeting.attendees}</p>
                              <p className="mt-2 text-gray-700 text-sm">{meeting.notes}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Communication Log</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {communicationLog.map((log, index) => (
                            <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium">{log.type}</h4>
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-0">
                                  {log.date}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">Contact: {log.contact}</p>
                              <p className="mt-2 text-gray-700 text-sm">{log.notes}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Attendance Record</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {attendance.map((record, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.shift}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge 
                                      variant="outline" 
                                      className={`
                                        ${record.status === "Present" ? "bg-green-50 text-green-700 border-0" : ""}
                                        ${record.status === "Late" ? "bg-amber-50 text-amber-700 border-0" : ""}
                                        ${record.status === "Absent" ? "bg-red-50 text-red-700 border-0" : ""}
                                      `}
                                    >
                                      {record.status}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.hoursWorked}</td>
                                  <td className="px-6 py-4 text-sm text-gray-500">{record.notes || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Files & Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                              <div className="flex items-center">
                                <div className="bg-blue-50 p-2 rounded-full mr-3">
                                  <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{doc.name}</h4>
                                  <p className="text-xs text-gray-500">
                                    {doc.type} • {doc.size} • Uploaded on {doc.uploadDate}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CarerProfilePage;
