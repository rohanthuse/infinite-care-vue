
import React, { useState } from "react";
import { Search, Filter, FileText, User, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

// Mock care plans data
const mockCarePlans = [
  {
    id: "1",
    clientName: "Emma Thompson",
    dateCreated: new Date("2024-03-15"),
    lastUpdated: new Date("2024-04-20"),
    status: "Active",
    type: "Home Care",
    alerts: 2,
    tasks: [
      { id: "t1", name: "Morning medication", completed: true },
      { id: "t2", name: "Breakfast assistance", completed: true },
      { id: "t3", name: "Personal hygiene", completed: false },
      { id: "t4", name: "Blood pressure check", completed: false }
    ]
  },
  {
    id: "2",
    clientName: "James Wilson",
    dateCreated: new Date("2024-02-10"),
    lastUpdated: new Date("2024-04-18"),
    status: "Active",
    type: "Post-Surgery Recovery",
    alerts: 0,
    tasks: [
      { id: "t5", name: "Wound dressing", completed: true },
      { id: "t6", name: "Pain management", completed: true },
      { id: "t7", name: "Mobility exercises", completed: true },
      { id: "t8", name: "Vital signs monitoring", completed: false }
    ]
  },
  {
    id: "3",
    clientName: "Margaret Brown",
    dateCreated: new Date("2024-04-05"),
    lastUpdated: new Date("2024-04-21"),
    status: "Active",
    type: "Dementia Care",
    alerts: 1,
    tasks: [
      { id: "t9", name: "Medication administration", completed: false },
      { id: "t10", name: "Meal assistance", completed: false },
      { id: "t11", name: "Cognitive exercises", completed: false },
      { id: "t12", name: "Hygiene assistance", completed: false }
    ]
  }
];

const CarerCarePlans: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarePlan, setSelectedCarePlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const filteredCarePlans = mockCarePlans.filter(carePlan => {
    const searchMatches = 
      carePlan.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carePlan.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const tabMatches = 
      activeTab === "all" || 
      (activeTab === "alerts" && carePlan.alerts > 0);
    
    return searchMatches && tabMatches;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Care Plans</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-8"
              placeholder="Search care plans by client or type" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Care Plans</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Requires Attention
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {mockCarePlans.filter(plan => plan.alerts > 0).length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCarePlans.length > 0 ? (
          filteredCarePlans.map((carePlan) => (
            <Card key={carePlan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCarePlan(carePlan)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                      {carePlan.clientName.split(" ").map(name => name[0]).join("")}
                    </div>
                    <CardTitle className="text-lg">{carePlan.clientName}</CardTitle>
                  </div>
                  {carePlan.alerts > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{carePlan.alerts}</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 mb-3">{carePlan.type}</div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <div className="text-gray-500">Created:</div>
                    <div>{format(carePlan.dateCreated, "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Updated:</div>
                    <div>{format(carePlan.lastUpdated, "MMM d, yyyy")}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tasks</div>
                  <div className="space-y-1">
                    {carePlan.tasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center gap-2">
                        {task.completed ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-gray-300" />
                        )}
                        <span className="text-sm truncate">{task.name}</span>
                      </div>
                    ))}
                    {carePlan.tasks.length > 3 && (
                      <div className="text-sm text-gray-500 pl-5">+ {carePlan.tasks.length - 3} more tasks</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-1 md:col-span-3 py-12 text-center bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No care plans found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery ? "Try a different search term" : "You have no care plans assigned at this time"}
            </p>
          </div>
        )}
      </div>
      
      <Dialog open={!!selectedCarePlan} onOpenChange={() => setSelectedCarePlan(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Care Plan Details</DialogTitle>
          </DialogHeader>
          {selectedCarePlan && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
                  {selectedCarePlan.clientName.split(" ").map(name => name[0]).join("")}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedCarePlan.clientName}</h3>
                  <Badge>{selectedCarePlan.type}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Status</div>
                  <Badge variant="outline" className="mt-1">{selectedCarePlan.status}</Badge>
                </div>
                <div>
                  <div className="text-gray-500">Created</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(selectedCarePlan.dateCreated, "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Last Updated</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(selectedCarePlan.lastUpdated, "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Alerts</div>
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span>{selectedCarePlan.alerts}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tasks</h4>
                <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                  {selectedCarePlan.tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2">
                      {task.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300" />
                      )}
                      <span>{task.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedCarePlan(null)}>Close</Button>
                <Button>View Full Care Plan</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarerCarePlans;
