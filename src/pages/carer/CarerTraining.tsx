
import React, { useState } from "react";
import { Search, Filter, GraduationCap, CheckCircle, Clock, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, addDays } from "date-fns";

// Mock training data
const mockTrainingCourses = [
  {
    id: "1",
    title: "Infection Control and Prevention",
    description: "Learn essential infection control measures for healthcare settings",
    status: "completed",
    completionDate: new Date("2024-03-15"),
    expiryDate: addDays(new Date("2024-03-15"), 365),
    progress: 100,
    duration: "2 hours",
    category: "Required",
    modules: [
      { name: "Introduction to Infection Control", completed: true },
      { name: "Hand Hygiene Procedures", completed: true },
      { name: "Personal Protective Equipment", completed: true },
      { name: "Preventing Cross-Contamination", completed: true }
    ]
  },
  {
    id: "2",
    title: "Moving and Handling",
    description: "Safe techniques for moving and handling patients",
    status: "completed",
    completionDate: new Date("2024-02-20"),
    expiryDate: addDays(new Date("2024-02-20"), 365),
    progress: 100,
    duration: "3 hours",
    category: "Required",
    modules: [
      { name: "Principles of Safe Moving", completed: true },
      { name: "Risk Assessment", completed: true },
      { name: "Manual Handling Techniques", completed: true },
      { name: "Using Mobility Aids", completed: true }
    ]
  },
  {
    id: "3",
    title: "Medication Management",
    description: "Proper handling and administration of medications",
    status: "in progress",
    completionDate: null,
    expiryDate: null,
    progress: 60,
    duration: "4 hours",
    category: "Required",
    modules: [
      { name: "Medication Basics", completed: true },
      { name: "Medication Administration", completed: true },
      { name: "Documentation and Reporting", completed: false },
      { name: "Common Medications and Side Effects", completed: false },
      { name: "Medication Errors Prevention", completed: false }
    ]
  },
  {
    id: "4",
    title: "Dementia Care",
    description: "Specialized care approaches for individuals with dementia",
    status: "not started",
    completionDate: null,
    expiryDate: null,
    progress: 0,
    duration: "5 hours",
    category: "Recommended",
    modules: [
      { name: "Understanding Dementia", completed: false },
      { name: "Communication Techniques", completed: false },
      { name: "Managing Challenging Behaviors", completed: false },
      { name: "Person-Centered Care", completed: false },
      { name: "Supporting Families", completed: false }
    ]
  },
  {
    id: "5",
    title: "Basic Life Support",
    description: "Emergency life-saving procedures and techniques",
    status: "expiring soon",
    completionDate: new Date("2023-05-10"),
    expiryDate: new Date("2024-05-10"),
    progress: 100,
    duration: "3 hours",
    category: "Required",
    modules: [
      { name: "CPR Techniques", completed: true },
      { name: "Using AED", completed: true },
      { name: "Choking Management", completed: true },
      { name: "Emergency Response", completed: true }
    ]
  }
];

// Upcoming scheduled training events
const mockScheduledTraining = [
  {
    id: "s1",
    title: "Advanced Wound Care",
    date: addDays(new Date(), 3),
    time: "10:00 AM - 12:00 PM",
    location: "Main Training Room",
    type: "In-person"
  },
  {
    id: "s2",
    title: "Medication Refresher Course",
    date: addDays(new Date(), 7),
    time: "2:00 PM - 4:00 PM",
    location: "Online Webinar",
    type: "Virtual"
  }
];

const CarerTraining: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "in progress": return "bg-blue-100 text-blue-700";
      case "not started": return "bg-gray-100 text-gray-700";
      case "expiring soon": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };
  
  const filteredCourses = mockTrainingCourses.filter(course => {
    const searchMatches = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const tabMatches = 
      activeTab === "all" || 
      (activeTab === "required" && course.category === "Required") ||
      (activeTab === "completed" && course.status === "completed") ||
      (activeTab === "inprogress" && course.status === "in progress") ||
      (activeTab === "expiring" && course.status === "expiring soon");
    
    return searchMatches && tabMatches;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Training</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Training Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Required Training</span>
                <span>4/5 Completed</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Recommended Training</span>
                <span>0/1 Completed</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Completion</span>
                <span>4/6 (67%)</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Upcoming Training</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockScheduledTraining.map((training) => (
              <div key={training.id} className="flex justify-between items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{training.title}</h3>
                    <p className="text-sm text-gray-500">
                      {format(training.date, "EEEE, MMMM d")} • {training.time}
                    </p>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {training.type}
                      </Badge>
                      <span className="mx-1">•</span>
                      {training.location}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">Add to Calendar</Button>
              </div>
            ))}
            
            {mockScheduledTraining.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">No upcoming training scheduled.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="required">Required</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="inprogress">In Progress</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-3">
          <div className="relative flex-1 sm:w-[250px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-8"
              placeholder="Search courses" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCourse(course)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <Badge className={getStatusColor(course.status)}>
                    {course.status === "expiring soon" ? "Renewal Due" : course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-500 mb-3">{course.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Progress</div>
                    <div className="flex items-center gap-2">
                      <Progress value={course.progress} className="h-2 flex-grow" />
                      <span className="text-sm font-medium">{course.progress}%</span>
                    </div>
                  </div>
                  
                  {course.completionDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Completed on {format(course.completionDate, "MMM d, yyyy")}</span>
                    </div>
                  )}
                  
                  {course.expiryDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>
                        {course.status === "expiring soon" ? "Expires" : "Valid until"} {format(course.expiryDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{course.duration}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-1 md:col-span-3 py-12 text-center bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No training courses found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery ? "Try a different search term" : "No training courses match the current filter"}
            </p>
          </div>
        )}
      </div>
      
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Training Course Details</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">{selectedCourse.title}</h2>
                <Badge className={`w-fit ${getStatusColor(selectedCourse.status)}`}>
                  {selectedCourse.status === "expiring soon" ? "Renewal Due" : selectedCourse.status.charAt(0).toUpperCase() + selectedCourse.status.slice(1)}
                </Badge>
                <p className="text-gray-600">{selectedCourse.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Category</div>
                  <div className="font-medium">{selectedCourse.category}</div>
                </div>
                <div>
                  <div className="text-gray-500">Duration</div>
                  <div className="font-medium">{selectedCourse.duration}</div>
                </div>
                {selectedCourse.completionDate && (
                  <div>
                    <div className="text-gray-500">Completed On</div>
                    <div className="font-medium">{format(selectedCourse.completionDate, "MMMM d, yyyy")}</div>
                  </div>
                )}
                {selectedCourse.expiryDate && (
                  <div>
                    <div className="text-gray-500">Valid Until</div>
                    <div className="font-medium">{format(selectedCourse.expiryDate, "MMMM d, yyyy")}</div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Completion Progress</div>
                <div className="flex items-center gap-2 mb-3">
                  <Progress value={selectedCourse.progress} className="h-2 flex-grow" />
                  <span className="text-sm font-medium">{selectedCourse.progress}%</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Modules</h3>
                <div className="space-y-2">
                  {selectedCourse.modules.map((module, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      {module.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300" />
                      )}
                      <span>{module.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCourse(null)}>Close</Button>
                {selectedCourse.status !== "completed" ? (
                  <Button>
                    {selectedCourse.status === "not started" ? "Start" : "Continue"} Training
                  </Button>
                ) : selectedCourse.status === "expiring soon" ? (
                  <Button>Renew Course</Button>
                ) : (
                  <Button>View Certificate</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarerTraining;
