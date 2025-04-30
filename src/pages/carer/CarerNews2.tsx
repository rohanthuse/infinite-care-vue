
import React, { useState } from "react";
import { Search, Filter, UserRound, AlertTriangle, ArrowUp, ArrowDown, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// Mock NEWS2 data
const mockPatientData = [
  {
    id: "1",
    name: "Emma Thompson",
    age: 72,
    score: 7,
    trend: "up",
    lastChecked: "30 min ago",
    vitals: {
      respiration: { value: 24, status: "high" },
      oxygen: { value: 92, status: "medium" },
      temperature: { value: 38.2, status: "medium" },
      bloodPressure: { value: "145/95", status: "medium" },
      heartRate: { value: 105, status: "medium" },
      consciousness: { value: "Alert", status: "normal" }
    }
  },
  {
    id: "2",
    name: "James Wilson",
    age: 65,
    score: 3,
    trend: "down",
    lastChecked: "1 hour ago",
    vitals: {
      respiration: { value: 18, status: "normal" },
      oxygen: { value: 95, status: "normal" },
      temperature: { value: 37.5, status: "normal" },
      bloodPressure: { value: "130/85", status: "normal" },
      heartRate: { value: 92, status: "medium" },
      consciousness: { value: "Alert", status: "normal" }
    }
  },
  {
    id: "3",
    name: "Margaret Brown",
    age: 80,
    score: 5,
    trend: "stable",
    lastChecked: "45 min ago",
    vitals: {
      respiration: { value: 21, status: "medium" },
      oxygen: { value: 93, status: "normal" },
      temperature: { value: 38.0, status: "medium" },
      bloodPressure: { value: "140/90", status: "medium" },
      heartRate: { value: 88, status: "normal" },
      consciousness: { value: "Alert", status: "normal" }
    }
  }
];

const CarerNews2: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-red-500";
    if (score >= 5) return "bg-orange-500";
    if (score >= 3) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUp className="h-4 w-4 text-red-500" />;
    if (trend === "down") return <ArrowDown className="h-4 w-4 text-green-500" />;
    return <span className="h-4 w-4">–</span>;
  };
  
  const getVitalStatusColor = (status: string) => {
    if (status === "high") return "text-red-500";
    if (status === "medium") return "text-orange-500";
    return "text-green-500";
  };
  
  const filteredPatients = mockPatientData.filter(patient => {
    const searchMatches = patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let urgencyMatches = true;
    if (urgencyFilter === "high") urgencyMatches = patient.score >= 7;
    else if (urgencyFilter === "medium") urgencyMatches = patient.score >= 5 && patient.score < 7;
    else if (urgencyFilter === "low") urgencyMatches = patient.score < 5;
    
    return searchMatches && urgencyMatches;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">NEWS2 Monitoring</h1>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            className="pl-8"
            placeholder="Search patients" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            <SelectItem value="high">High Risk (7+)</SelectItem>
            <SelectItem value="medium">Medium Risk (5-6)</SelectItem>
            <SelectItem value="low">Low Risk (0-4)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPatient(patient)}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                      {patient.name.split(" ").map(name => name[0]).join("")}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{patient.name}</h3>
                        <span className="text-sm text-gray-500">({patient.age} yrs)</span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Last checked: {patient.lastChecked}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-gray-500 mb-1">NEWS2 Score</div>
                      <div className={`w-8 h-8 rounded-full ${getScoreColor(patient.score)} text-white flex items-center justify-center font-bold`}>
                        {patient.score}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-gray-500 mb-1">Trend</div>
                      <div className="w-8 h-8 flex items-center justify-center">
                        {getTrendIcon(patient.trend)}
                      </div>
                    </div>
                    
                    <div>
                      <Button size="sm" variant="default">
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <UserRound className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery ? "Try a different search term" : "You have no patients assigned at this time"}
            </p>
          </div>
        )}
      </div>
      
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Patient Vital Signs</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
                  {selectedPatient.name.split(" ").map(name => name[0]).join("")}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedPatient.name}</h3>
                  <div className="text-sm text-gray-500">{selectedPatient.age} years old</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${getScoreColor(selectedPatient.score)} text-white flex items-center justify-center font-bold`}>
                    {selectedPatient.score}
                  </div>
                  {selectedPatient.score >= 7 && (
                    <Badge variant="destructive" className="ml-2">
                      <AlertTriangle className="h-3 w-3 mr-1" /> High Risk
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Respiration Rate</span>
                    <span className={getVitalStatusColor(selectedPatient.vitals.respiration.status)}>
                      {selectedPatient.vitals.respiration.value} /min
                    </span>
                  </div>
                  <Progress value={selectedPatient.vitals.respiration.value / 30 * 100} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Oxygen Saturation</span>
                    <span className={getVitalStatusColor(selectedPatient.vitals.oxygen.status)}>
                      {selectedPatient.vitals.oxygen.value}%
                    </span>
                  </div>
                  <Progress value={(selectedPatient.vitals.oxygen.value - 70) / 30 * 100} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Temperature</span>
                    <span className={getVitalStatusColor(selectedPatient.vitals.temperature.status)}>
                      {selectedPatient.vitals.temperature.value}°C
                    </span>
                  </div>
                  <Progress value={(selectedPatient.vitals.temperature.value - 35) / 5 * 100} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Blood Pressure</span>
                    <span className={getVitalStatusColor(selectedPatient.vitals.bloodPressure.status)}>
                      {selectedPatient.vitals.bloodPressure.value} mmHg
                    </span>
                  </div>
                  <Progress value={parseInt(selectedPatient.vitals.bloodPressure.value.split('/')[0]) / 200 * 100} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Heart Rate</span>
                    <span className={getVitalStatusColor(selectedPatient.vitals.heartRate.status)}>
                      {selectedPatient.vitals.heartRate.value} /min
                    </span>
                  </div>
                  <Progress value={selectedPatient.vitals.heartRate.value / 150 * 100} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Consciousness</span>
                    <span className={getVitalStatusColor(selectedPatient.vitals.consciousness.status)}>
                      {selectedPatient.vitals.consciousness.value}
                    </span>
                  </div>
                  <div className="h-2"></div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between">
                <div className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>Last updated: {selectedPatient.lastChecked}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedPatient(null)}>Close</Button>
                  <Button className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>Record New Vitals</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarerNews2;
