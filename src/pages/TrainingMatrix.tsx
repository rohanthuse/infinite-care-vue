import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Filter, Download, ChevronDown, Search, Check, X, Clock, GraduationCap
} from "lucide-react";

interface TrainingInfo {
  status: string;
  completionDate?: string;
  expiresIn?: number;
}

interface TrainingData {
  id: number;
  name: string;
  percentage: number;
  movingAndHandling: TrainingInfo;
  basicLifeSupport: TrainingInfo;
  infectionControl: TrainingInfo;
  medicationAwareness: TrainingInfo;
  foodHygiene: TrainingInfo;
  safeguarding: TrainingInfo;
}

const mockTrainingData: TrainingData[] = [
  {
    id: 1,
    name: "Ayo-Famure, Opeyemi",
    percentage: 83,
    movingAndHandling: { status: "completed", completionDate: "15/01/2024", expiresIn: 230 },
    basicLifeSupport: { status: "completed", completionDate: "20/02/2024", expiresIn: 266 },
    infectionControl: { status: "completed", completionDate: "05/03/2024", expiresIn: 280 },
    medicationAwareness: { status: "missing" },
    foodHygiene: { status: "pending", completionDate: "25/10/2024", expiresIn: 148 },
    safeguarding: { status: "completed", completionDate: "10/01/2024", expiresIn: 225 }
  },
  {
    id: 2,
    name: "Johnson, Michael",
    percentage: 67,
    movingAndHandling: { status: "pending", completionDate: "30/07/2024", expiresIn: 60 },
    basicLifeSupport: { status: "completed", completionDate: "15/11/2023", expiresIn: 169 },
    infectionControl: { status: "missing" },
    medicationAwareness: { status: "completed", completionDate: "05/12/2023", expiresIn: 189 },
    foodHygiene: { status: "completed", completionDate: "20/10/2023", expiresIn: 143 },
    safeguarding: { status: "pending", completionDate: "15/09/2024", expiresIn: 107 }
  },
  {
    id: 3,
    name: "Smith, Jessica",
    percentage: 100,
    movingAndHandling: { status: "completed", completionDate: "10/01/2024", expiresIn: 225 },
    basicLifeSupport: { status: "completed", completionDate: "05/02/2024", expiresIn: 251 },
    infectionControl: { status: "completed", completionDate: "15/01/2024", expiresIn: 230 },
    medicationAwareness: { status: "completed", completionDate: "20/02/2024", expiresIn: 266 },
    foodHygiene: { status: "completed", completionDate: "25/01/2024", expiresIn: 240 },
    safeguarding: { status: "completed", completionDate: "10/02/2024", expiresIn: 256 }
  },
  {
    id: 4,
    name: "Williams, Robert",
    percentage: 33,
    movingAndHandling: { status: "missing" },
    basicLifeSupport: { status: "completed", completionDate: "15/05/2023", expiresIn: -45 },
    infectionControl: { status: "missing" },
    medicationAwareness: { status: "pending", completionDate: "10/12/2024", expiresIn: 195 },
    foodHygiene: { status: "missing" },
    safeguarding: { status: "pending", completionDate: "20/08/2024", expiresIn: 81 }
  },
  {
    id: 5,
    name: "Brown, Sarah",
    percentage: 83,
    movingAndHandling: { status: "completed", completionDate: "20/03/2024", expiresIn: 295 },
    basicLifeSupport: { status: "completed", completionDate: "05/04/2024", expiresIn: 311 },
    infectionControl: { status: "completed", completionDate: "15/03/2024", expiresIn: 290 },
    medicationAwareness: { status: "pending", completionDate: "30/06/2024", expiresIn: 30 },
    foodHygiene: { status: "missing" },
    safeguarding: { status: "completed", completionDate: "10/04/2024", expiresIn: 316 }
  }
];

const TrainingMatrix = () => {
  const [activeTab, setActiveTab] = useState("training-matrix");
  const [viewType, setViewType] = useState<"staff" | "client">("staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("percentage");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { id, branchName } = useParams();
  const navigate = useNavigate();

  const filteredData = mockTrainingData.filter(row => 
    row.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortField === "percentage") {
      return sortDirection === "asc" ? a.percentage - b.percentage : b.percentage - a.percentage;
    }
    return sortDirection === "asc" 
      ? a.name.localeCompare(b.name) 
      : b.name.localeCompare(a.name);
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "missing":
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-[#F2FCE2] text-green-700 border-green-200";
      case "pending": return "bg-[#FEF7CD] text-amber-700 border-amber-200";
      case "missing": return "bg-[#FFDEE2] text-red-600 border-red-200";
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const renderStatus = (item: TrainingInfo) => {
    if (!item) return null;
    
    return (
      <div className={cn(
        "flex flex-col items-center justify-center rounded-md p-2 h-full min-h-[80px]",
        getStatusColor(item.status)
      )}>
        <div className="mb-1">
          {getStatusIcon(item.status)}
        </div>
        
        {item.status === "completed" && (
          <>
            <span className="text-sm font-medium">Completed</span>
            {item.completionDate && (
              <div className="text-xs mt-1">
                {item.completionDate}
                {item.expiresIn && item.expiresIn < 0 
                  ? <div className="text-red-600 font-medium">Expired</div>
                  : <div>Expires in {item.expiresIn} days</div>
                }
              </div>
            )}
          </>
        )}
        
        {item.status === "missing" && <span className="text-sm">Missing</span>}
        
        {item.status === "pending" && (
          <>
            <div className="text-sm font-medium">Pending</div>
            <div className="text-xs mt-1">
              {item.completionDate && `Due: ${item.completionDate}`}
            </div>
          </>
        )}
      </div>
    );
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (percentage >= 50) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
  const handleNewBooking = () => {
    if (id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/recruitment/post-job`);
    }
  };

  const handleChangeTab = (value: string) => {
    setActiveTab(value);
    
    if (id && branchName) {
      const encodedBranchName = encodeURIComponent(branchName);
      
      switch (value) {
        case "dashboard":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}`);
          break;
        case "bookings":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/bookings`);
          break;
        case "clients":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/clients`);
          break;
        case "carers":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/carers`);
          break;
        case "reviews":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/reviews`);
          break;
        case "communication":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/communication`);
          break;
        case "workflow":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/workflow`);
          break;
        case "task-matrix":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/task-matrix`);
          break;
        case "training-matrix":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/training-matrix`);
          break;
        case "notifications":
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/notifications`);
          break;
        default:
          navigate(`/branch-dashboard/${id}/${encodedBranchName}/${value}`);
          break;
      }
    } else {
      switch (value) {
        case "task-matrix":
          navigate("/workflow/task-matrix");
          break;
        case "training-matrix":
          navigate("/workflow/training-matrix");
          break;
        default:
          navigate(`/${value}`);
          break;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <BranchHeader 
          id={id} 
          branchName={branchName} 
          onNewBooking={handleNewBooking}
        />
        
        <TabNavigation 
          activeTab={activeTab} 
          onChange={handleChangeTab}
        />
        
        <div className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Training Matrix</h1>
              <p className="text-gray-500 mt-1">Track and manage staff training across your organization</p>
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
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 gap-1"
                  onClick={() => handleSort("percentage")}
                >
                  <span>Sort by: {sortField === "percentage" ? "Percentage" : "Name"}</span>
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
                      <TableHead 
                        className="font-semibold text-gray-600 cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        Full Name
                      </TableHead>
                      <TableHead 
                        className="font-semibold text-gray-600 text-center cursor-pointer w-28"
                        onClick={() => handleSort("percentage")}
                      >
                        Percentage
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        Moving & Handling
                        <div className="text-xs font-normal">80%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        Basic Life Support
                        <div className="text-xs font-normal">75%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        Infection Control
                        <div className="text-xs font-normal">65%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        Medication Awareness
                        <div className="text-xs font-normal">60%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        Food Hygiene
                        <div className="text-xs font-normal">50%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        Safeguarding
                        <div className="text-xs font-normal">85%</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.length > 0 ? (
                      sortedData.map((row) => (
                        <TableRow key={row.id} className="hover:bg-gray-50">
                          <TableCell className="text-center font-medium">{row.id}</TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "px-2 py-0.5 text-sm font-medium border",
                              getPercentageColor(row.percentage)
                            )}>
                              {row.percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="p-1">{renderStatus(row.movingAndHandling)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.basicLifeSupport)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.infectionControl)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.medicationAwareness)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.foodHygiene)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.safeguarding)}</TableCell>
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
              
              {sortedData.length > 0 && (
                <div className="flex justify-between items-center py-4 px-6 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {sortedData.length} of {mockTrainingData.length} staff members
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

export default TrainingMatrix;
