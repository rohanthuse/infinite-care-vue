
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpDown, 
  Bell, 
  Download, 
  Filter, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  Share2, 
  SlidersHorizontal 
} from "lucide-react";
import { News2PatientList } from "./News2PatientList";
import { NewObservationDialog } from "./NewObservationDialog";
import { AlertManagementDialog } from "./AlertManagementDialog";
import { getNews2Patients } from "./news2Data";

interface News2DashboardProps {
  branchId: string;
  branchName: string;
}

export function News2Dashboard({ branchId, branchName }: News2DashboardProps) {
  const [isNewObservationDialogOpen, setIsNewObservationDialogOpen] = useState(false);
  const [isAlertManagementOpen, setIsAlertManagementOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"all" | "high" | "medium" | "low">("all");
  
  // Get mock data
  const patients = getNews2Patients();
  
  const filteredPatients = patients.filter((patient) => {
    // Filter by active view
    if (activeView === "high" && patient.latestScore < 7) return false;
    if (activeView === "medium" && (patient.latestScore < 5 || patient.latestScore >= 7)) return false;
    if (activeView === "low" && patient.latestScore >= 5) return false;
    
    // Filter by search query
    if (searchQuery && !patient.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const patientsByRisk = {
    high: patients.filter(p => p.latestScore >= 7).length,
    medium: patients.filter(p => p.latestScore >= 5 && p.latestScore < 7).length,
    low: patients.filter(p => p.latestScore < 5).length
  };

  const getStatusColor = (value: number) => {
    return value >= 7 ? "bg-red-100 text-red-700" : 
          value >= 5 ? "bg-amber-100 text-amber-700" : 
          "bg-green-100 text-green-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search patients..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="text-blue-600" onClick={() => setIsAlertManagementOpen(true)}>
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </Button>
          <Button onClick={() => setIsNewObservationDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Observation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border-l-4 border-l-red-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{patientsByRisk.high}</div>
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">NEWS2 ≥ 7</div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-amber-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{patientsByRisk.medium}</div>
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">NEWS2 5-6</div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{patientsByRisk.low}</div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">NEWS2 < 5</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={activeView} onValueChange={(value) => setActiveView(value as "all" | "high" | "medium" | "low")}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All Patients</TabsTrigger>
            <TabsTrigger value="high">High Risk</TabsTrigger>
            <TabsTrigger value="medium">Medium Risk</TabsTrigger>
            <TabsTrigger value="low">Low Risk</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="m-0">
          <News2PatientList patients={filteredPatients} />
        </TabsContent>
        <TabsContent value="high" className="m-0">
          <News2PatientList patients={filteredPatients} />
        </TabsContent>
        <TabsContent value="medium" className="m-0">
          <News2PatientList patients={filteredPatients} />
        </TabsContent>
        <TabsContent value="low" className="m-0">
          <News2PatientList patients={filteredPatients} />
        </TabsContent>
      </Tabs>

      <NewObservationDialog 
        open={isNewObservationDialogOpen} 
        onOpenChange={setIsNewObservationDialogOpen} 
        patients={patients}
      />
      
      <AlertManagementDialog 
        open={isAlertManagementOpen} 
        onOpenChange={setIsAlertManagementOpen}
      />
    </div>
  );
}
