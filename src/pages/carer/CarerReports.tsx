
import React, { useState } from "react";
import { FileBarChart, Calendar, Download, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

// Mock reports data
const mockReports = [
  {
    id: "1",
    name: "Monthly Activity Summary",
    description: "Summary of all care activities performed during the month",
    generatedDate: new Date("2024-04-01"),
    category: "activity",
    format: "PDF"
  },
  {
    id: "2",
    name: "Client Visit Log",
    description: "Detailed log of all client visits",
    generatedDate: new Date("2024-04-10"),
    category: "visits",
    format: "PDF"
  },
  {
    id: "3",
    name: "Medication Administration Record",
    description: "Record of all medications administered during the month",
    generatedDate: new Date("2024-04-15"),
    category: "medication",
    format: "Excel"
  },
  {
    id: "4",
    name: "Hours & Attendance Report",
    description: "Summary of working hours and attendance",
    generatedDate: new Date("2024-04-20"),
    category: "attendance",
    format: "PDF"
  },
  {
    id: "5",
    name: "Weekly Client Progress Notes",
    description: "Weekly progress notes for all assigned clients",
    generatedDate: new Date("2024-04-25"),
    category: "progress",
    format: "PDF"
  }
];

const CarerReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  
  const filteredReports = mockReports.filter(report => {
    if (activeTab !== "all" && report.category !== activeTab) {
      return false;
    }
    
    if (dateFilter === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return report.generatedDate >= lastMonth;
    }
    
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Reports</h1>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
            <TabsTrigger value="medication">Medication</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-3">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>More Filters</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">Generate New Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Activity Summary</SelectItem>
                    <SelectItem value="visits">Visit Log</SelectItem>
                    <SelectItem value="medication">Medication Record</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                    <SelectItem value="progress">Progress Notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input type="date" className="pl-10" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input type="date" className="pl-10" />
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Button className="w-full">Generate Report</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">Report Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold">42</div>
                <div className="text-sm text-gray-500">Total visits this month</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold">87%</div>
                <div className="text-sm text-gray-500">Documentation compliance</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold">156</div>
                <div className="text-sm text-gray-500">Care tasks completed</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold">98.2%</div>
                <div className="text-sm text-gray-500">On-time attendance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
      
      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <Card key={report.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                      <FileBarChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <p className="text-sm text-gray-500">{report.description}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        Generated on {format(report.generatedDate, "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                      {report.format}
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="group-hover:bg-gray-100">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileBarChart className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
            <p className="text-gray-500 mt-2">Try changing your filters or generate a new report</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarerReports;
