
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Search, FileDown, Filter, ArrowUpDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { mockNews2Patients, News2Patient, getScoreStatusColor } from "@/data/mockNews2Data";
import { useNavigate } from "react-router-dom";

interface News2DashboardProps {
  branchId: string;
}

export const News2Dashboard: React.FC<News2DashboardProps> = ({ branchId }) => {
  const [patients, setPatients] = useState<News2Patient[]>(mockNews2Patients);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredPatients, setFilteredPatients] = useState<News2Patient[]>(mockNews2Patients);
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof News2Patient; direction: 'asc' | 'desc' | null }>({ key: 'name', direction: null });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    let result = [...patients];
    
    // Apply search query filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(patient => 
        patient.name.toLowerCase().includes(lowerCaseQuery) || 
        patient.id.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    // Apply score filter
    if (scoreFilter === "low") {
      result = result.filter(patient => (patient.latestScore !== undefined && patient.latestScore < 5));
    } else if (scoreFilter === "medium") {
      result = result.filter(patient => (patient.latestScore !== undefined && patient.latestScore >= 5 && patient.latestScore < 7));
    } else if (scoreFilter === "high") {
      result = result.filter(patient => (patient.latestScore !== undefined && patient.latestScore >= 7));
    }
    
    // Apply sorting
    if (sortConfig.direction) {
      result.sort((a, b) => {
        // Handle undefined values
        if (a[sortConfig.key] === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (b[sortConfig.key] === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Special handling for dates
        if (sortConfig.key === 'latestTimestamp') {
          const valueA = a.latestTimestamp?.getTime() || 0;
          const valueB = b.latestTimestamp?.getTime() || 0;
          return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        // Standard comparison
        if (a[sortConfig.key]! < b[sortConfig.key]!) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key]! > b[sortConfig.key]!) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredPatients(result);
  }, [patients, searchQuery, scoreFilter, sortConfig]);
  
  const handleSort = (key: keyof News2Patient) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key, direction });
  };
  
  const handlePatientClick = (patientId: string) => {
    navigate(`/branch-dashboard/${branchId}/news2/patient/${patientId}`);
  };
  
  const getSortIcon = (key: keyof News2Patient) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    if (sortConfig.direction === 'asc') return <ArrowUpDown className="ml-2 h-4 w-4 text-blue-600" />;
    if (sortConfig.direction === 'desc') return <ArrowUpDown className="ml-2 h-4 w-4 text-blue-600 rotate-180" />;
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            NEWS2 Dashboard
            <Badge variant="default" className="ml-2">Beta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search patients by name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="low">Low Risk (0-4)</SelectItem>
                  <SelectItem value="medium">Medium Risk (5-6)</SelectItem>
                  <SelectItem value="high">High Risk (7+)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <FileDown className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-[250px] cursor-pointer hover:bg-gray-50" 
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Patient Name
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="w-[100px] text-center cursor-pointer hover:bg-gray-50" 
                    onClick={() => handleSort('age')}
                  >
                    <div className="flex items-center">
                      Age
                      {getSortIcon('age')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="w-[100px] text-center cursor-pointer hover:bg-gray-50" 
                    onClick={() => handleSort('latestScore')}
                  >
                    <div className="flex items-center">
                      NEWS2 Score
                      {getSortIcon('latestScore')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="w-[200px] text-center cursor-pointer hover:bg-gray-50" 
                    onClick={() => handleSort('latestTimestamp')}
                  >
                    <div className="flex items-center">
                      Last Observation
                      {getSortIcon('latestTimestamp')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px] text-center">Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow 
                      key={patient.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handlePatientClick(patient.id)}
                    >
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell className="text-center">{patient.age}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${patient.latestScore !== undefined ? getScoreStatusColor(patient.latestScore) : "bg-gray-100 text-gray-500"}`}>
                          {patient.latestScore !== undefined ? patient.latestScore : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {patient.latestTimestamp ? format(patient.latestTimestamp, 'PPp') : "No data"}
                      </TableCell>
                      <TableCell className="text-center">
                        {patient.latestScore !== undefined && (
                          <Badge variant="outline" className={`${getScoreStatusColor(patient.latestScore)} border-0`}>
                            {patient.latestScore >= 7 ? "High Risk" : 
                             patient.latestScore >= 5 ? "Medium Risk" : "Low Risk"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No patients match your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Showing {filteredPatients.length} of {patients.length} patients</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
