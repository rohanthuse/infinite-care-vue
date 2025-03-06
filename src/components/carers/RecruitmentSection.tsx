
import React, { useState } from "react";
import { UserPlus, Briefcase, FileCheck, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

const RecruitmentSection = () => {
  const [isNewCandidateDialogOpen, setIsNewCandidateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const filteredCandidates = mockRecruitmentData.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      candidate.role.toLowerCase().includes(searchValue.toLowerCase()) ||
      candidate.id.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStage = stageFilter === "all" || candidate.stage === stageFilter;
    
    if (activeTab === "all") {
      return matchesSearch && matchesStage;
    } else {
      return matchesSearch && matchesStage && candidate.stage === activeTab;
    }
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

  return (
    <div className="mt-8">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Recruitment</CardTitle>
              <CardDescription>Track candidate applications and recruitment progress</CardDescription>
            </div>
            <Button onClick={() => setIsNewCandidateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4 mb-4">
            <div className="relative w-full md:w-64">
              <Input
                placeholder="Search candidates..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
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

          <Tabs 
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-2"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Candidates</TabsTrigger>
              <TabsTrigger value="Screening">Screening</TabsTrigger>
              <TabsTrigger value="Interview">Interview</TabsTrigger>
              <TabsTrigger value="Assessment">Assessment</TabsTrigger>
              <TabsTrigger value="Offer">Offer</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {renderCandidatesList(filteredCandidates, getStatusColor)}
            </TabsContent>
            <TabsContent value="Screening" className="mt-0">
              {renderCandidatesList(filteredCandidates, getStatusColor)}
            </TabsContent>
            <TabsContent value="Interview" className="mt-0">
              {renderCandidatesList(filteredCandidates, getStatusColor)}
            </TabsContent>
            <TabsContent value="Assessment" className="mt-0">
              {renderCandidatesList(filteredCandidates, getStatusColor)}
            </TabsContent>
            <TabsContent value="Offer" className="mt-0">
              {renderCandidatesList(filteredCandidates, getStatusColor)}
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

const renderCandidatesList = (candidates, getStatusColor) => {
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
            <Button size="sm" variant="outline" className="ml-auto md:ml-0">
              <FileCheck className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecruitmentSection;
