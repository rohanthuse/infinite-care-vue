
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserPlus, Briefcase, Calendar, Filter, Clock, Plus, Search, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const mockRecruitmentData = [
  {
    id: "REC-001",
    name: "Johnson, Mark",
    role: "Home Carer",
    status: "Interview Scheduled",
    date: "2023-06-15",
    source: "Indeed",
    stage: "Interview",
    email: "mark.j@example.com",
    phone: "+44 7700 900123"
  },
  {
    id: "REC-002",
    name: "Williams, Sarah",
    role: "Nurse",
    status: "Application Review",
    date: "2023-06-12",
    source: "LinkedIn",
    stage: "Screening",
    email: "sarah.w@example.com",
    phone: "+44 7700 900456"
  },
  {
    id: "REC-003",
    name: "Brown, Robert",
    role: "Physiotherapist",
    status: "Assessment",
    date: "2023-06-10",
    source: "Referral",
    stage: "Assessment",
    email: "robert.b@example.com",
    phone: "+44 7700 900789"
  },
  {
    id: "REC-004",
    name: "Davies, Emily",
    role: "Home Carer",
    status: "Offer Sent",
    date: "2023-06-05",
    source: "Job Fair",
    stage: "Offer",
    email: "emily.d@example.com",
    phone: "+44 7700 900321"
  }
];

const mockJobPostings = [
  {
    id: "JOB-001",
    title: "Home Care Assistant",
    location: "Milton Keynes",
    type: "Full-time",
    postedDate: "2023-05-15",
    applicants: 12,
    status: "Active",
    description: "We are looking for compassionate individuals to join our team as Home Care Assistants.",
    salary: "£22,000 - £28,000",
    deadline: "2023-07-15"
  },
  {
    id: "JOB-002",
    title: "Registered Nurse",
    location: "London",
    type: "Full-time",
    postedDate: "2023-05-20",
    applicants: 8,
    status: "Active",
    description: "Seeking registered nurses with experience in geriatric care.",
    salary: "£32,000 - £40,000",
    deadline: "2023-07-20"
  },
  {
    id: "JOB-003",
    title: "Physiotherapist",
    location: "Cambridge",
    type: "Part-time",
    postedDate: "2023-05-25",
    applicants: 5,
    status: "Active",
    description: "Looking for a qualified physiotherapist to join our team on a part-time basis.",
    salary: "£30,000 - £35,000 pro rata",
    deadline: "2023-07-25"
  }
];

const RecruitmentSection = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [isNewCandidateDialogOpen, setIsNewCandidateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("candidates");
  const [searchValue, setSearchValue] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [jobSearchValue, setJobSearchValue] = useState("");
  const { toast } = useToast();

  // Filter candidates based on search and stage
  const filteredCandidates = mockRecruitmentData.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      candidate.role.toLowerCase().includes(searchValue.toLowerCase()) ||
      candidate.id.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStage = stageFilter === "all" || candidate.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  // Filter job postings based on search and status
  const filteredJobs = mockJobPostings.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(jobSearchValue.toLowerCase()) ||
      job.location.toLowerCase().includes(jobSearchValue.toLowerCase()) ||
      job.id.toLowerCase().includes(jobSearchValue.toLowerCase());
    
    const matchesStatus = jobStatusFilter === "all" || job.status.toLowerCase() === jobStatusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const statusColors = {
      "Application Review": "bg-blue-50 text-blue-700",
      "Screening": "bg-purple-50 text-purple-700",
      "Interview Scheduled": "bg-amber-50 text-amber-700",
      "Assessment": "bg-indigo-50 text-indigo-700",
      "Offer Sent": "bg-green-50 text-green-700"
    };
    
    return statusColors[status] || "bg-gray-50 text-gray-700";
  };

  const handleViewApplication = (candidateId: string) => {
    navigate(`/branch-dashboard/${id}/${branchName}/recruitment/application/${candidateId}`);
  };

  const handlePostNewJob = () => {
    navigate(`/branch-dashboard/${id}/${branchName}/recruitment/post-job`);
  };

  const handleViewJob = (jobId: string) => {
    // This would navigate to a job details page in a real application
    toast({
      title: "Job Details",
      description: `Viewing details for job ${jobId}`,
      variant: "default",
    });
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Recruitment</CardTitle>
              <CardDescription>Track candidate applications and recruitment progress</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsNewCandidateDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
              <Button onClick={handlePostNewJob}>
                <Plus className="mr-2 h-4 w-4" />
                Post Job
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="candidates"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-2"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="jobs">Job Postings</TabsTrigger>
            </TabsList>

            <TabsContent value="candidates" className="mt-0">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4 mb-4">
                <div className="relative w-full md:w-64">
                  <Input
                    placeholder="Search candidates..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        <SelectItem value="Screening">Screening</SelectItem>
                        <SelectItem value="Interview">Interview</SelectItem>
                        <SelectItem value="Assessment">Assessment</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {renderCandidatesList(filteredCandidates, getStatusColor, handleViewApplication)}
            </TabsContent>

            <TabsContent value="jobs" className="mt-0">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4 mb-4">
                <div className="relative w-full md:w-64">
                  <Input
                    placeholder="Search job postings..."
                    className="pl-10"
                    value={jobSearchValue}
                    onChange={(e) => setJobSearchValue(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {renderJobsList(filteredJobs, handleViewJob)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isNewCandidateDialogOpen} onOpenChange={setIsNewCandidateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Candidate</DialogTitle>
            <DialogDescription>
              Enter the details of the new candidate to add them to your recruitment pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Full Name
              </label>
              <Input id="name" className="col-span-3" placeholder="John Doe" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right text-sm font-medium">
                Email
              </label>
              <Input id="email" className="col-span-3" placeholder="john.doe@example.com" type="email" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="role" className="text-right text-sm font-medium">
                Role
              </label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home-carer">Home Carer</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="source" className="text-right text-sm font-medium">
                Source
              </label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="job-fair">Job Fair</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsNewCandidateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => setIsNewCandidateDialogOpen(false)}>
              Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const renderCandidatesList = (candidates, getStatusColor, onViewApplication) => {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No candidates found matching your search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {candidates.map((candidate) => (
        <div 
          key={candidate.id}
          className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col space-y-2">
            <div className="flex items-start">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                {candidate.name.split(', ')[1].charAt(0)}{candidate.name.split(', ')[0].charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-medium">{candidate.name}</h3>
                <div className="flex flex-col md:flex-row md:space-x-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Briefcase className="h-3.5 w-3.5 mr-1 inline" />
                    {candidate.role}
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span>{candidate.email}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 mt-2 md:mt-0">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(candidate.status)} px-3 py-1 rounded-full`}
            >
              {candidate.status}
            </Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {new Date(candidate.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="ml-auto md:ml-0"
              onClick={() => onViewApplication(candidate.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Application
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const renderJobsList = (jobs, onViewJob) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No job postings found matching your search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div 
          key={job.id}
          className="flex flex-col p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-medium">{job.title}</h3>
                <Badge className="ml-2 bg-green-100 text-green-800 border-0">
                  {job.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-y-1 gap-x-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  {job.type}
                </span>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1113.314-7.071 8 8 0 01-2 8.071z" />
                  </svg>
                  {job.location}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Posted {new Date(job.postedDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                {job.applicants} Applications
              </Badge>
              <Button size="sm" className="ml-auto md:ml-0" variant="outline" onClick={() => onViewJob(job.id)}>
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center text-gray-500">
              <span className="font-medium text-gray-700 mr-1">Salary:</span> {job.salary}
            </div>
            <div className="flex items-center text-gray-500">
              <span className="font-medium text-gray-700 mr-1">Deadline:</span> {new Date(job.deadline).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost">Edit</Button>
              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">Close</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecruitmentSection;
