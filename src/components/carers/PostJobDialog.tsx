
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Eye, Upload } from "lucide-react";

interface PostJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPostJob: (jobData: any) => void;
}

export const PostJobDialog = ({ isOpen, onClose, onPostJob }: PostJobDialogProps) => {
  const [jobData, setJobData] = useState({
    title: "",
    location: "",
    type: "",
    description: "",
    minQualifications: "",
    experience: "",
    minSalary: "",
    maxSalary: "",
    benefits: "",
    deadline: "",
    positions: ""
  });

  const handleChange = (field: string, value: string) => {
    setJobData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPostJob(jobData);
    setJobData({
      title: "",
      location: "",
      type: "",
      description: "",
      minQualifications: "",
      experience: "",
      minSalary: "",
      maxSalary: "",
      benefits: "",
      deadline: "",
      positions: ""
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post New Job</DialogTitle>
          <DialogDescription>
            Create a new job posting or use a predefined template.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-blue-900">Select Job Template</h3>
                <div className="mt-2 space-y-3">
                  <div>
                    <Label>Template Type</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a Template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carer">Home Carer</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
                        <SelectItem value="custom">Custom Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview Template
                    </Button>
                    <Button type="button" variant="secondary" size="sm" className="flex items-center">
                      <Upload className="h-4 w-4 mr-1" />
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg flex items-start space-x-3">
              <div className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</div>
              <div className="w-full">
                <h3 className="font-semibold">Job Details</h3>
                <div className="mt-3 space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input 
                      id="jobTitle" 
                      placeholder="Enter job title" 
                      value={jobData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="jobDescription">Job Description</Label>
                    <div className="border border-input rounded-md p-1 mb-1 flex gap-1">
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2">B</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 italic">I</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 underline">U</Button>
                    </div>
                    <Textarea 
                      id="jobDescription" 
                      placeholder="Enter job description" 
                      className="min-h-[120px]"
                      value={jobData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jobRole">Job Role</Label>
                      <Select 
                        onValueChange={(value) => handleChange("type", value)}
                        value={jobData.type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Home Carer">Home Carer</SelectItem>
                          <SelectItem value="Nurse">Nurse</SelectItem>
                          <SelectItem value="Physiotherapist">Physiotherapist</SelectItem>
                          <SelectItem value="Mental Health Support">Mental Health Support</SelectItem>
                          <SelectItem value="Care Coordinator">Care Coordinator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="jobType">Job Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Temporary">Temporary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      placeholder="Enter location" 
                      value={jobData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg flex items-start space-x-3">
              <div className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</div>
              <div className="w-full">
                <h3 className="font-semibold">Job Requirements</h3>
                <div className="mt-3 space-y-4">
                  <div>
                    <Label htmlFor="minQualifications">Minimum Qualifications</Label>
                    <Textarea 
                      id="minQualifications" 
                      placeholder="Enter minimum qualifications" 
                      value={jobData.minQualifications}
                      onChange={(e) => handleChange("minQualifications", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="experience">Experience Required</Label>
                    <Select 
                      onValueChange={(value) => handleChange("experience", value)}
                      value={jobData.experience}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entry level">Entry level</SelectItem>
                        <SelectItem value="1-2 years">1-2 years</SelectItem>
                        <SelectItem value="3-5 years">3-5 years</SelectItem>
                        <SelectItem value="5+ years">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="skills">Skills Required</Label>
                    <div className="p-3 border rounded-md">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <div className="bg-gray-100 text-sm px-3 py-1 rounded-full flex items-center">
                          Patient care <button className="ml-1 text-gray-500">×</button>
                        </div>
                        <div className="bg-gray-100 text-sm px-3 py-1 rounded-full flex items-center">
                          Medical records <button className="ml-1 text-gray-500">×</button>
                        </div>
                        <div className="bg-gray-100 text-sm px-3 py-1 rounded-full flex items-center">
                          First Aid <button className="ml-1 text-gray-500">×</button>
                        </div>
                        <div className="bg-gray-100 text-sm px-3 py-1 rounded-full flex items-center">
                          Communication <button className="ml-1 text-gray-500">×</button>
                        </div>
                        <div className="bg-gray-100 text-sm px-3 py-1 rounded-full flex items-center">
                          Team management <button className="ml-1 text-gray-500">×</button>
                        </div>
                      </div>
                      <Input placeholder="Type to add more skills..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg flex items-start space-x-3">
              <div className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</div>
              <div className="w-full">
                <h3 className="font-semibold">Compensation and Benefits</h3>
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minSalary">Minimum Salary</Label>
                      <Input 
                        id="minSalary" 
                        placeholder="e.g. £25,000" 
                        value={jobData.minSalary}
                        onChange={(e) => handleChange("minSalary", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxSalary">Maximum Salary</Label>
                      <Input 
                        id="maxSalary" 
                        placeholder="e.g. £35,000" 
                        value={jobData.maxSalary}
                        onChange={(e) => handleChange("maxSalary", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="benefits">Benefits</Label>
                    <Textarea 
                      id="benefits" 
                      placeholder="Enter benefits" 
                      value={jobData.benefits}
                      onChange={(e) => handleChange("benefits", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg flex items-start space-x-3">
              <div className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">5</div>
              <div className="w-full">
                <h3 className="font-semibold">Application Details</h3>
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deadline">Application Deadline</Label>
                      <div className="relative">
                        <Input 
                          id="deadline" 
                          placeholder="mm/dd/yyyy" 
                          type="date"
                          value={jobData.deadline}
                          onChange={(e) => handleChange("deadline", e.target.value)}
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="positions">Number of Positions</Label>
                      <Input 
                        id="positions" 
                        placeholder="Enter number of positions" 
                        type="number"
                        value={jobData.positions}
                        onChange={(e) => handleChange("positions", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="attachments">Attachments Allowed</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="resume" defaultChecked />
                        <label htmlFor="resume" className="text-sm">Resume/CV (Required)</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="coverLetter" defaultChecked />
                        <label htmlFor="coverLetter" className="text-sm">Cover Letter</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="certificates" />
                        <label htmlFor="certificates" className="text-sm">Certificates</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="otherDocs" />
                        <label htmlFor="otherDocs" className="text-sm">Other Documents</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button type="submit">
                Post Job
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
