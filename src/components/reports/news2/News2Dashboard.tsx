
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Clock, Filter, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getNews2Patients } from "./news2Data";
import { News2Patient } from "./news2Types";
import { format } from "date-fns";
import { toast } from "sonner";
import { generateNews2PDF } from "@/utils/pdfGenerator";

interface News2DashboardProps {
  branchId: string;
  branchName: string;
}

export const News2Dashboard = ({ branchId, branchName }: News2DashboardProps) => {
  const [patients, setPatients] = useState<News2Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<News2Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      
      setTimeout(() => {
        const data = getNews2Patients();
        setPatients(data);
        setFilteredPatients(data);
        setIsLoading(false);
      }, 600);
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    // Apply filters when search query or risk filter changes
    let result = [...patients];
    
    // Text search
    if (searchQuery) {
      result = result.filter(patient => 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Risk filter
    if (riskFilter !== "all") {
      if (riskFilter === "high") {
        result = result.filter(patient => patient.latestScore >= 7);
      } else if (riskFilter === "medium") {
        result = result.filter(patient => patient.latestScore >= 5 && patient.latestScore < 7);
      } else if (riskFilter === "low") {
        result = result.filter(patient => patient.latestScore < 5);
      }
    }
    
    setFilteredPatients(result);
  }, [searchQuery, riskFilter, patients]);
  
  const handleExportPatient = (patient: News2Patient) => {
    try {
      generateNews2PDF(patient, branchName);
      toast.success("PDF exported successfully", {
        description: `NEWS2 report for ${patient.name} has been downloaded`
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "There was a problem exporting the report"
      });
    }
  };
  
  const getRiskBadge = (score: number) => {
    if (score >= 7) {
      return <Badge variant="destructive" className="whitespace-nowrap">High Risk</Badge>;
    } else if (score >= 5) {
      return <Badge variant="warning" className="bg-orange-500 whitespace-nowrap">Medium Risk</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 whitespace-nowrap">Low Risk</Badge>;
  };
  
  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUp className="h-4 w-4 text-red-500" />;
    if (trend === "down") return <ArrowDown className="h-4 w-4 text-green-500" />;
    return <span>–</span>;
  };
  
  // Calculate summary stats
  const highRiskCount = patients.filter(p => p.latestScore >= 7).length;
  const mediumRiskCount = patients.filter(p => p.latestScore >= 5 && p.latestScore < 7).length;
  const lowRiskCount = patients.filter(p => p.latestScore < 5).length;
  
  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500">High Risk</h3>
                <p className="text-2xl font-bold">{highRiskCount}</p>
              </div>
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                NEWS2 ≥ 7
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Medium Risk</h3>
                <p className="text-2xl font-bold">{mediumRiskCount}</p>
              </div>
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                NEWS2 5-6
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Low Risk</h3>
                <p className="text-2xl font-bold">{lowRiskCount}</p>
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                NEWS2 &lt; 5
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            className="pl-8"
            placeholder="Search patients by name or ID" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            <SelectItem value="high">High Risk (7+)</SelectItem>
            <SelectItem value="medium">Medium Risk (5-6)</SelectItem>
            <SelectItem value="low">Low Risk (0-4)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Patient NEWS2 Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading patient data...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No patients match the current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Latest Score</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-gray-500">ID: {patient.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                          patient.latestScore >= 7 
                            ? "bg-red-500" 
                            : patient.latestScore >= 5 
                              ? "bg-orange-500" 
                              : "bg-green-500"
                        }`}>
                          {patient.latestScore}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(patient.latestScore)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(patient.trend)}
                          <span className="text-sm">
                            {patient.trend === "up" 
                              ? "Increasing" 
                              : patient.trend === "down" 
                                ? "Decreasing" 
                                : "Stable"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(patient.lastUpdated), "dd MMM, HH:mm")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleExportPatient(patient)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
