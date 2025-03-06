
import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Filter, Download, ChevronDown, Search, Check, X, AlertCircle } from "lucide-react";

interface TaskData {
  id: number;
  name: string;
  percentage: number;
  workPermit: { status: string; date?: string; expiresIn?: number };
  carInsurance: { status: string; date?: string; expiresIn?: number };
  niNumber: { status: string };
  drivingLicense: { status: string; date?: string; expiresIn?: number };
  dvla: { status: string };
  dbs: { status: string; date?: string; expiresIn?: number };
}

const mockData: TaskData[] = [
  {
    id: 1,
    name: "Ayo-Famure, Opeyemi",
    percentage: 86,
    workPermit: { status: "pending", date: "13/05/2028", expiresIn: 1164 },
    carInsurance: { status: "n/a" },
    niNumber: { status: "completed" },
    drivingLicense: { status: "n/a" },
    dvla: { status: "n/a" },
    dbs: { status: "pending", date: "20/02/2027", expiresIn: 716 }
  },
  {
    id: 2,
    name: "Johnson, Michael",
    percentage: 67,
    workPermit: { status: "completed" },
    carInsurance: { status: "missing" },
    niNumber: { status: "pending", date: "15/07/2024", expiresIn: 45 },
    drivingLicense: { status: "completed" },
    dvla: { status: "pending", date: "30/08/2024", expiresIn: 91 },
    dbs: { status: "completed" }
  },
  {
    id: 3,
    name: "Smith, Jessica",
    percentage: 92,
    workPermit: { status: "completed" },
    carInsurance: { status: "completed" },
    niNumber: { status: "completed" },
    drivingLicense: { status: "completed" },
    dvla: { status: "completed" },
    dbs: { status: "completed" }
  },
  {
    id: 4,
    name: "Williams, Robert",
    percentage: 43,
    workPermit: { status: "missing" },
    carInsurance: { status: "missing" },
    niNumber: { status: "pending", date: "10/09/2024", expiresIn: 102 },
    drivingLicense: { status: "missing" },
    dvla: { status: "n/a" },
    dbs: { status: "completed" }
  },
  {
    id: 5,
    name: "Brown, Sarah",
    percentage: 78,
    workPermit: { status: "completed" },
    carInsurance: { status: "n/a" },
    niNumber: { status: "completed" },
    drivingLicense: { status: "n/a" },
    dvla: { status: "n/a" },
    dbs: { status: "pending", date: "05/12/2024", expiresIn: 188 }
  }
];

const TaskMatrix = () => {
  const [activeTab, setActiveTab] = useState("workflow");
  const [viewType, setViewType] = useState<"staff" | "client">("staff");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = mockData.filter(row => 
    row.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-[#F2FCE2] text-green-700";
    if (status === "n/a") return "bg-gray-100 text-gray-600";
    if (status === "pending") return "bg-[#FEF7CD] text-amber-700";
    return "bg-[#FFDEE2] text-red-600"; // missing or error
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <Check className="h-4 w-4 text-green-600" />;
    if (status === "n/a") return null;
    if (status === "pending") return <AlertCircle className="h-4 w-4 text-amber-600" />;
    return <X className="h-4 w-4 text-red-600" />;
  };

  const renderStatus = (item: { status: string; date?: string; expiresIn?: number }) => {
    return (
      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-center justify-center mb-1">
          {getStatusIcon(item.status)}
        </div>
        
        <div className="text-sm font-medium">
          {item.status === "completed" && "Completed"}
          {item.status === "n/a" && "N/A"}
          {item.status === "missing" && "Missing"}
          {item.status === "pending" && item.date}
        </div>
        
        {item.status === "pending" && item.expiresIn && (
          <div className="text-xs">
            Expires in {item.expiresIn} days
          </div>
        )}
        
        <Checkbox className="mt-2" />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <TabNavigation activeTab={activeTab} onChange={setActiveTab} hideQuickAdd />
        
        <div className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Task Matrix</h1>
              <p className="text-gray-500 mt-1">Track and manage compliance tasks across your organization</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search staff..." 
                  className="pl-10 pr-4 py-2 h-10 border-gray-200 w-full sm:w-60" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="h-10 gap-2 border-gray-200">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
                <Button variant="outline" className="h-10 gap-2 border-gray-200">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
          </div>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Badge
                    variant={viewType === "staff" ? "default" : "outline"}
                    className="cursor-pointer px-4 py-1 text-sm"
                    onClick={() => setViewType("staff")}
                  >
                    Staff
                  </Badge>
                  <Badge
                    variant={viewType === "client" ? "default" : "outline"}
                    className="cursor-pointer px-4 py-1 text-sm"
                    onClick={() => setViewType("client")}
                  >
                    Client
                  </Badge>
                </div>
                
                <Button variant="ghost" size="sm" className="text-gray-500 gap-1">
                  <span>Sort by: Percentage</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-600 w-12 text-center">#</TableHead>
                      <TableHead className="font-semibold text-gray-600">Full Name</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">Percentage</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center w-32">
                        Work Permit
                        <div className="text-xs font-normal">61%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center w-32">
                        Car Insurance
                        <div className="text-xs font-normal">61%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center w-32">
                        NI Number
                        <div className="text-xs font-normal">55%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center w-32">
                        Driving License
                        <div className="text-xs font-normal">72%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center w-32">
                        DVLA
                        <div className="text-xs font-normal">72%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center w-32">
                        DBS
                        <div className="text-xs font-normal">55%</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((row) => (
                        <TableRow key={row.id} className="hover:bg-gray-50">
                          <TableCell className="text-center font-medium">{row.id}</TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={row.percentage > 80 ? "default" : (row.percentage > 50 ? "secondary" : "outline")} 
                                  className={cn(
                                    "px-2 py-0.5 text-xs",
                                    row.percentage > 80 ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                                    row.percentage > 50 ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : 
                                    "bg-red-100 text-red-800 hover:bg-red-100"
                                  )}>
                              {row.percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className={cn("text-center p-2 rounded-md m-1", getStatusColor(row.workPermit.status))}>
                            {renderStatus(row.workPermit)}
                          </TableCell>
                          <TableCell className={cn("text-center p-2 rounded-md m-1", getStatusColor(row.carInsurance.status))}>
                            {renderStatus(row.carInsurance)}
                          </TableCell>
                          <TableCell className={cn("text-center p-2 rounded-md m-1", getStatusColor(row.niNumber.status))}>
                            {renderStatus(row.niNumber)}
                          </TableCell>
                          <TableCell className={cn("text-center p-2 rounded-md m-1", getStatusColor(row.drivingLicense.status))}>
                            {renderStatus(row.drivingLicense)}
                          </TableCell>
                          <TableCell className={cn("text-center p-2 rounded-md m-1", getStatusColor(row.dvla.status))}>
                            {renderStatus(row.dvla)}
                          </TableCell>
                          <TableCell className={cn("text-center p-2 rounded-md m-1", getStatusColor(row.dbs.status))}>
                            {renderStatus(row.dbs)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No staff found matching your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {filteredData.length > 0 && (
                <div className="flex justify-between items-center py-4 px-6 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {filteredData.length} of {mockData.length} staff members
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TaskMatrix;
