
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, MailIcon, MapPin, Phone, XCircle, Download, Clock, Briefcase, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data - would be replaced with actual data fetching in a real application
const mockRecruitmentData = [
  {
    id: "APP-001",
    name: "John Smith",
    role: "Home Care Assistant",
    status: "Interview Scheduled",
    date: "2023-10-15",
    source: "Indeed",
    stage: "Interview",
    email: "john.s@example.com",
    phone: "+44 7700 900123"
  },
  {
    id: "APP-002",
    name: "Sarah Johnson",
    role: "Registered Nurse",
    status: "Application Review",
    date: "2023-10-14",
    source: "LinkedIn",
    stage: "Screening",
    email: "sarah.j@example.com",
    phone: "+44 7700 900456"
  },
  {
    id: "APP-003",
    name: "Michael Brown",
    role: "Care Coordinator",
    status: "Assessment",
    date: "2023-10-12",
    source: "Referral",
    stage: "Assessment",
    email: "michael.b@example.com",
    phone: "+44 7700 900789"
  },
  {
    id: "APP-004",
    name: "Emily Davis",
    role: "Home Care Assistant",
    status: "Offer Sent",
    date: "2023-10-10",
    source: "Job Fair",
    stage: "Offer",
    email: "emily.d@example.com",
    phone: "+44 7700 900321"
  },
  {
    id: "APP-005",
    name: "David Wilson",
    role: "Physiotherapist",
    status: "Application Review",
    date: "2023-10-09",
    source: "Job Board",
    stage: "Screening",
    email: "david.w@example.com",
    phone: "+44 7700 900654"
  },
  {
    id: "APP-006",
    name: "Lisa Taylor",
    role: "Registered Nurse",
    status: "New Application",
    date: "2023-10-08",
    source: "Website",
    stage: "New",
    email: "lisa.t@example.com",
    phone: "+44 7700 900987"
  }
];

const mockExperience = {
  previousEmployment: "St. Mary's Hospital",
  keySkills: ["Patient Care", "Medication Administration", "Documentation"],
  education: "Bachelor of Nursing (BSc)",
  certifications: ["CPR Certification", "ACLS", "Wound Care Certification"]
};

const mockDocuments = [
  { name: "Resume.pdf", size: "1.2 MB", type: "application/pdf" },
  { name: "Cover Letter.docx", size: "842 KB", type: "application/msword" }
];

const ApplicationDetailsPage = () => {
  const { candidateId, id, branchName } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState("");
  const [applicationStatus, setApplicationStatus] = useState("pending");
  
  // Find the candidate based on the ID parameter
  const candidate = mockRecruitmentData.find(c => c.id === candidateId);
  
  useEffect(() => {
    // Set initial application status based on the candidate data
    if (candidate) {
      const statusMap = {
        "Interview Scheduled": "interview",
        "Application Review": "screening",
        "Assessment": "assessment",
        "Offer Sent": "approved",
        "New Application": "pending"
      };
      setApplicationStatus(statusMap[candidate.status] || "pending");
    }
  }, [candidate]);

  if (!candidate) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Candidate Not Found</h1>
        </div>
        <p>The candidate you're looking for could not be found. ID: {candidateId}</p>
      </div>
    );
  }

  const handleStatusChange = (status: string) => {
    setApplicationStatus(status);
    
    const statusMessages = {
      approved: "Application approved! An offer will be prepared.",
      rejected: "Application has been rejected.",
      interview: "Candidate has been moved to the interview stage.",
      assessment: "Candidate has been moved to the assessment stage."
    };
    
    const message = statusMessages[status] || "Application status updated.";
    
    toast({
      title: "Status Updated",
      description: message,
      variant: "default",
    });
  };

  const handleSaveNotes = () => {
    toast({
      title: "Notes Saved",
      description: "Admin notes have been saved successfully.",
      variant: "default",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/branch-dashboard/${id}/${branchName}`, { state: { activeTab: 'recruitment' } })} 
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Recruitment
          </Button>
          <div>
            <div className="text-sm breadcrumbs">
              <ul className="flex space-x-2">
                <li>Dashboard</li>
                <span className="mx-1">›</span>
                <li>Recruitment</li>
                <span className="mx-1">›</span>
                <li>Application Details</li>
              </ul>
            </div>
            <h1 className="text-2xl font-bold mt-1">
              Application Details for {candidate.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Applicant Details</h3>
                <Badge 
                  variant="outline" 
                  className="bg-amber-50 text-amber-700 border-0 px-3 py-1"
                >
                  {candidate.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">Application ID: {candidate.id}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Personal Information</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <MailIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span>{candidate.email}</span>
                    </li>
                    <li className="flex items-start">
                      <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span>{candidate.phone}</span>
                    </li>
                    <li className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span>123 Baker Street, London, UK</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Application Details</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Briefcase className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span>{candidate.role}</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span>{new Date(candidate.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>5 years experience</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Experience & Qualifications</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Previous Employment</h4>
                  <p>{mockExperience.previousEmployment}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Key Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {mockExperience.keySkills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Education & Certifications</h4>
                  <p className="mb-2">{mockExperience.education}</p>
                  <div className="flex flex-wrap gap-2">
                    {mockExperience.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-0">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Documents</h3>
              
              <div className="space-y-4">
                {mockDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded ${doc.type.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.size}</p>
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
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    Change Application Status
                  </label>
                  <Select 
                    value={applicationStatus} 
                    onValueChange={setApplicationStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Email Sent",
                      description: `Contact email has been sent to ${candidate.name}.`,
                    });
                  }}
                >
                  <MailIcon className="h-4 w-4 mr-2" />
                  Contact Applicant
                </Button>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    Assign next steps
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview">Schedule Interview</SelectItem>
                      <SelectItem value="assessment">Schedule Assessment</SelectItem>
                      <SelectItem value="background">Background Check</SelectItem>
                      <SelectItem value="references">Check References</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
                    onClick={() => handleStatusChange("approved")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-red-600 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => handleStatusChange("rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Admin Notes</h3>
              
              <div className="space-y-4">
                <Textarea 
                  placeholder="Add internal notes about this application..."
                  className="min-h-[120px]"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
                
                <Button className="w-full" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsPage;
