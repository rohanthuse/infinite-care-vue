
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Filter, Download, ChevronDown, Search, Check, X, AlertCircle, Clock,
  Home, MapPin, Phone, Mail, Plus, CalendarPlus 
} from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// Define a consistent status type for all compliance items
interface StatusInfo {
  status: string;
  date?: string;
  expiresIn?: number;
}

interface TaskData {
  id: number;
  name: string;
  percentage: number;
  workPermit: StatusInfo;
  carInsurance: StatusInfo;
  niNumber: StatusInfo;
  drivingLicense: StatusInfo;
  dvla: StatusInfo;
  dbs: StatusInfo;
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
  const [sortField, setSortField] = useState("percentage");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { id, branchName } = useParams();
  const navigate = useNavigate();

  const filteredData = mockData.filter(row => 
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
      case "n/a":
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-[#F2FCE2] text-green-700 border-green-200";
      case "pending": return "bg-[#FEF7CD] text-amber-700 border-amber-200";
      case "missing": return "bg-[#FFDEE2] text-red-600 border-red-200";
      case "n/a":
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const renderStatus = (item: StatusInfo) => {
    if (!item) return null;
    
    return (
      <div className={cn(
        "flex flex-col items-center justify-center rounded-md p-2 h-full min-h-[80px]",
        getStatusColor(item.status)
      )}>
        <div className="mb-1">
          {getStatusIcon(item.status)}
        </div>
        
        {item.status === "completed" && <span className="text-sm">Completed</span>}
        {item.status === "n/a" && <span className="text-sm">N/A</span>}
        {item.status === "missing" && <span className="text-sm">Missing</span>}
        
        {item.status === "pending" && (
          <>
            <div className="text-sm font-medium">{item.date}</div>
            <div className="text-xs mt-1">
              {item.expiresIn && `Expires in ${item.expiresIn} days`}
            </div>
          </>
        )}
      </div>
    );
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage > 80) return "bg-green-100 text-green-800 border-green-200";
    if (percentage > 50) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
  const handleNewBooking = () => {
    if (id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/recruitment/post-job`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Branch Header */}
        <div className="mb-6">
          <Breadcrumb className="mb-2">
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} to="/branch">
                <Home className="h-4 w-4 mr-1" />
                Branches
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                {branchName || "Branch"}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-800">{branchName || "Branch"}</h1>
                <Badge className="bg-green-100 text-green-800 border border-green-200">Active</Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Milton Keynes, UK</span>
                </div>
                <div className="hidden sm:block h-4 w-0.5 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>+44 20 7946 0958</span>
                </div>
                <div className="hidden sm:block h-4 w-0.5 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>milton@med-infinite.com</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleNewBooking}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Booking</span>
            </Button>
          </div>
          
          {/* Navigation menu for branch dashboard */}
          <div className="flex overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex space-x-2 border-b border-gray-200 w-full">
              <Link to={`/branch-dashboard/${id}/${branchName}`} className="px-4 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-1 whitespace-nowrap">
                <span>Dashboard</span>
              </Link>
              <Link to={`/branch-dashboard/${id}/${branchName}/bookings`} className="px-4 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-1 whitespace-nowrap">
                <span>Bookings</span>
              </Link>
              <Link to={`/branch-dashboard/${id}/${branchName}/clients`} className="px-4 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-1 whitespace-nowrap">
                <span>Clients</span>
              </Link>
              <Link to={`/branch-dashboard/${id}/${branchName}/carers`} className="px-4 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-1 whitespace-nowrap">
                <span>Carers</span>
              </Link>
              <Link to={`/branch-dashboard/${id}/${branchName}/task-matrix`} className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium flex items-center gap-1 whitespace-nowrap">
                <span>Task Matrix</span>
              </Link>
            </div>
          </div>
        </div>
        
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
                        Work Permit
                        <div className="text-xs font-normal">61%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        Car Insurance
                        <div className="text-xs font-normal">61%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        NI Number
                        <div className="text-xs font-normal">55%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        Driving License
                        <div className="text-xs font-normal">72%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        DVLA
                        <div className="text-xs font-normal">72%</div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">
                        DBS
                        <div className="text-xs font-normal">55%</div>
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
                          <TableCell className="p-1">{renderStatus(row.workPermit)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.carInsurance)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.niNumber)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.drivingLicense)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.dvla)}</TableCell>
                          <TableCell className="p-1">{renderStatus(row.dbs)}</TableCell>
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
                    Showing {sortedData.length} of {mockData.length} staff members
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
