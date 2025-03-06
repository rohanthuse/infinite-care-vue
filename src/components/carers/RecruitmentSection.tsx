import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Filter, 
  EyeIcon, 
  CheckCircle, 
  XCircle, 
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const mockCandidates = [
  {
    id: "APP-001",
    name: "John Smith",
    position: "Home Care Assistant",
    location: "Milton Keynes",
    applicationDate: "2023-10-15",
    status: "New",
    experience: "2 years",
  },
  {
    id: "APP-002",
    name: "Sarah Johnson",
    position: "Registered Nurse",
    location: "London",
    applicationDate: "2023-10-14",
    status: "Reviewing",
    experience: "5 years",
  },
  {
    id: "APP-003",
    name: "Michael Brown",
    position: "Care Coordinator",
    location: "Birmingham",
    applicationDate: "2023-10-12",
    status: "Interview",
    experience: "3 years",
  },
  {
    id: "APP-004",
    name: "Emily Davis",
    position: "Home Care Assistant",
    location: "Milton Keynes",
    applicationDate: "2023-10-10",
    status: "Hired",
    experience: "1 year",
  },
  {
    id: "APP-005",
    name: "David Wilson",
    position: "Physiotherapist",
    location: "Cambridge",
    applicationDate: "2023-10-09",
    status: "Rejected",
    experience: "4 years",
  },
  {
    id: "APP-006",
    name: "Lisa Taylor",
    position: "Registered Nurse",
    location: "London",
    applicationDate: "2023-10-08",
    status: "New",
    experience: "6 years",
  },
];

const mockRecruitmentData = [
  {
    id: "APP-001",
    name: "John Smith",
    role: "Home Care Assistant",
    status: "New",
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
    status: "Reviewing",
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
    status: "Interview",
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
    status: "Hired",
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
    status: "Rejected",
    date: "2023-10-09",
    source: "Job Board",
    stage: "Rejected",
    email: "david.w@example.com",
    phone: "+44 7700 900654"
  },
  {
    id: "APP-006",
    name: "Lisa Taylor",
    role: "Registered Nurse",
    status: "New",
    date: "2023-10-08",
    source: "Website",
    stage: "New",
    email: "lisa.t@example.com",
    phone: "+44 7700 900987"
  }
];

const mockJobPostings = [
  {
    id: "JOB-001",
    title: "Home Care Assistant",
    location: "Milton Keynes",
    type: "Full-time",
    postedDate: "2023-10-01",
    closingDate: "2023-10-31",
    status: "Active",
    applicants: 12,
  },
  {
    id: "JOB-002",
    title: "Registered Nurse",
    location: "London",
    type: "Part-time",
    postedDate: "2023-09-25",
    closingDate: "2023-10-25",
    status: "Active",
    applicants: 8,
  },
  {
    id: "JOB-003",
    title: "Care Coordinator",
    location: "Birmingham",
    type: "Full-time",
    postedDate: "2023-09-20",
    closingDate: "2023-10-20",
    status: "Active",
    applicants: 5,
  },
  {
    id: "JOB-004",
    title: "Physiotherapist",
    location: "Cambridge",
    type: "Contract",
    postedDate: "2023-09-15",
    closingDate: "2023-10-15",
    status: "Closed",
    applicants: 4,
  },
];

const RecruitmentSection = () => {
  const navigate = useNavigate();
  const { id, branchName } = useParams();
  
  const [activeTab, setActiveTab] = useState("candidates");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCandidates, setFilteredCandidates] = useState(mockCandidates);
  const [filteredJobs, setFilteredJobs] = useState(mockJobPostings);
  
  const itemsPerPage = 5;
  
  useEffect(() => {
    let results = mockCandidates;
    
    if (searchQuery) {
      results = results.filter(candidate => 
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      results = results.filter(candidate => candidate.status === statusFilter);
    }
    
    if (locationFilter !== "all") {
      results = results.filter(candidate => candidate.location === locationFilter);
    }
    
    if (positionFilter !== "all") {
      results = results.filter(candidate => candidate.position === positionFilter);
    }
    
    setFilteredCandidates(results);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, locationFilter, positionFilter]);
  
  useEffect(() => {
    let results = mockJobPostings;
    
    if (searchQuery) {
      results = results.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredJobs(results);
    setCurrentPage(1);
  }, [searchQuery]);
  
  const candidatesStart = (currentPage - 1) * itemsPerPage;
  const candidatesEnd = candidatesStart + itemsPerPage;
  const displayedCandidates = filteredCandidates.slice(candidatesStart, candidatesEnd);
  const candidatesPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  
  const jobsStart = (currentPage - 1) * itemsPerPage;
  const jobsEnd = jobsStart + itemsPerPage;
  const displayedJobs = filteredJobs.slice(jobsStart, jobsEnd);
  const jobsPages = Math.ceil(filteredJobs.length / itemsPerPage);
  
  const handleViewApplication = (candidateId: string) => {
    navigate(`/branch-dashboard/${id}/${branchName}/recruitment/application/${candidateId}`);
  };
  
  const handlePostJob = () => {
    navigate(`/branch-dashboard/${id}/${branchName}/recruitment/post-job`);
  };
  
  const handleEditJob = (jobId: string) => {
    navigate(`/branch-dashboard/${id}/${branchName}/recruitment/edit-job/${jobId}`);
  };
  
  return (
    <div className="w-full">
      <div className="mb-6">
        <Tabs defaultValue="candidates" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={activeTab === "candidates" ? "Search candidates..." : "Search jobs..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white rounded-md w-full sm:w-[280px]"
                />
              </div>
              
              {activeTab === "candidates" && (
                <>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Reviewing">Reviewing</SelectItem>
                      <SelectItem value="Interview">Interview</SelectItem>
                      <SelectItem value="Hired">Hired</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Milton Keynes">Milton Keynes</SelectItem>
                      <SelectItem value="London">London</SelectItem>
                      <SelectItem value="Birmingham">Birmingham</SelectItem>
                      <SelectItem value="Cambridge">Cambridge</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      <SelectItem value="Home Care Assistant">Home Care Assistant</SelectItem>
                      <SelectItem value="Registered Nurse">Registered Nurse</SelectItem>
                      <SelectItem value="Care Coordinator">Care Coordinator</SelectItem>
                      <SelectItem value="Physiotherapist">Physiotherapist</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                onClick={handlePostJob}
              >
                <Plus className="mr-2 h-4 w-4" /> Post Job
              </Button>
            </div>
          </div>
          
          <TabsContent value="candidates" className="space-y-4">
            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden md:table-cell">App. Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCandidates.length > 0 ? (
                    displayedCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.id}</TableCell>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell>{candidate.position}</TableCell>
                        <TableCell className="hidden md:table-cell">{candidate.location}</TableCell>
                        <TableCell className="hidden md:table-cell">{candidate.applicationDate}</TableCell>
                        <TableCell>
                          <Badge
                            className={`
                              ${candidate.status === "New" ? "bg-blue-100 text-blue-800" : ""}
                              ${candidate.status === "Reviewing" ? "bg-amber-100 text-amber-800" : ""}
                              ${candidate.status === "Interview" ? "bg-purple-100 text-purple-800" : ""}
                              ${candidate.status === "Hired" ? "bg-green-100 text-green-800" : ""}
                              ${candidate.status === "Rejected" ? "bg-red-100 text-red-800" : ""}
                            `}
                          >
                            {candidate.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => handleViewApplication(candidate.id)}
                          >
                            <EyeIcon className="h-4 w-4 mr-2" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                        No candidates found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {displayedCandidates.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {candidatesStart + 1} to {Math.min(candidatesEnd, filteredCandidates.length)} of {filteredCandidates.length} candidates
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === candidatesPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="jobs" className="space-y-4">
            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Location</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Posted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedJobs.length > 0 ? (
                    displayedJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.id}</TableCell>
                        <TableCell>{job.title}</TableCell>
                        <TableCell className="hidden sm:table-cell">{job.location}</TableCell>
                        <TableCell className="hidden md:table-cell">{job.type}</TableCell>
                        <TableCell className="hidden md:table-cell">{job.postedDate}</TableCell>
                        <TableCell>
                          <Badge
                            className={`
                              ${job.status === "Active" ? "bg-green-100 text-green-800" : ""}
                              ${job.status === "Closed" ? "bg-gray-100 text-gray-800" : ""}
                            `}
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => handleEditJob(job.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" /> Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                        No job postings found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {displayedJobs.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {jobsStart + 1} to {Math.min(jobsEnd, filteredJobs.length)} of {filteredJobs.length} job postings
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === jobsPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RecruitmentSection;
