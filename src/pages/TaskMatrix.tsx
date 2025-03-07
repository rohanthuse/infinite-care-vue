
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import { 
  Download, Filter, Plus, Search, MoreVertical, Calendar,
  FileText, ClipboardList, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Sample staff compliance data based on the screenshot
const staffComplianceData = [
  {
    id: 1,
    fullName: "Ayo-Famure, Opeyemi",
    compliancePercentage: 86,
    workPermit: {
      status: "valid",
      date: "13/05/2028",
      expiresIn: 1164,
      completed: false
    },
    carInsurance: {
      status: "n/a",
      completed: false
    },
    niNumber: {
      status: "completed",
      completed: true
    },
    drivingLicense: {
      status: "n/a",
      completed: false
    },
    dvla: {
      status: "n/a",
      completed: false
    },
    dbs: {
      status: "valid",
      date: "20/02/2027",
      expiresIn: 716,
      completed: false
    }
  },
  {
    id: 2,
    fullName: "Iyaniwura, Ifeoluwa Adeseye",
    compliancePercentage: 13,
    workPermit: {
      status: "missing",
      completed: false
    },
    carInsurance: {
      status: "missing",
      completed: false
    },
    niNumber: {
      status: "missing",
      completed: false
    },
    drivingLicense: {
      status: "missing",
      completed: false
    },
    dvla: {
      status: "missing",
      completed: false
    },
    dbs: {
      status: "missing",
      completed: false
    }
  },
  {
    id: 3,
    fullName: "Abiri-Maitland, Midé",
    compliancePercentage: 73,
    workPermit: {
      status: "completed",
      completed: true
    },
    carInsurance: {
      status: "n/a",
      completed: false
    },
    niNumber: {
      status: "completed",
      completed: true
    },
    drivingLicense: {
      status: "valid",
      date: "15/05/2033",
      expiresIn: 2992,
      completed: false
    },
    dvla: {
      status: "completed",
      completed: true
    },
    dbs: {
      status: "n/a",
      completed: false
    }
  },
  {
    id: 4,
    fullName: "Asubonteng, Lydia",
    compliancePercentage: 80,
    workPermit: {
      status: "valid",
      date: "26/09/2026",
      expiresIn: 569,
      completed: false
    },
    carInsurance: {
      status: "n/a",
      completed: false
    },
    niNumber: {
      status: "completed",
      completed: true
    },
    drivingLicense: {
      status: "n/a",
      completed: false
    },
    dvla: {
      status: "n/a",
      completed: false
    },
    dbs: {
      status: "expired",
      date: "09/02/2025",
      completed: false
    }
  },
  {
    id: 5,
    fullName: "Baulch, Ursula",
    compliancePercentage: 80,
    workPermit: {
      status: "valid",
      date: "30/04/2028",
      expiresIn: 1151,
      completed: false
    },
    carInsurance: {
      status: "n/a",
      completed: false
    },
    niNumber: {
      status: "completed",
      completed: true
    },
    drivingLicense: {
      status: "n/a",
      completed: false
    },
    dvla: {
      status: "n/a",
      completed: false
    },
    dbs: {
      status: "expired",
      date: "30/11/2024",
      completed: false
    }
  },
  {
    id: 6,
    fullName: "Charuma, Charmaine",
    compliancePercentage: 86,
    workPermit: {
      status: "valid",
      date: "23/10/2026",
      expiresIn: 596,
      completed: false
    },
    carInsurance: {
      status: "valid",
      date: "21/06/2025",
      expiresIn: 107,
      completed: false
    },
    niNumber: {
      status: "completed",
      completed: true
    },
    drivingLicense: {
      status: "valid",
      date: "31/01/2034",
      expiresIn: 3253,
      completed: false
    },
    dvla: {
      status: "completed",
      completed: true
    },
    dbs: {
      status: "valid",
      date: "31/01/2027",
      expiresIn: 696,
      completed: false
    }
  }
];

// Define compliance categories with their completion percentages
const complianceCategories = [
  { id: "workPermit", name: "Work Permit", completion: 61 },
  { id: "carInsurance", name: "Car Insurance", completion: 61 },
  { id: "niNumber", name: "NI Number", completion: 55 },
  { id: "drivingLicense", name: "Driving License", completion: 72 },
  { id: "dvla", name: "DVLA", completion: 72 },
  { id: "dbs", name: "DBS", completion: 55 },
];

// Helper function to determine cell background color
const getCellBackgroundColor = (item: any) => {
  if (item.status === "missing") return "bg-red-600 text-white";
  if (item.status === "expired") return "bg-red-600 text-white";
  if (item.status === "valid" || item.status === "completed") return "bg-green-500 text-white";
  return "bg-gray-200 text-gray-600";
};

// Helper function to render cell content
const renderCellContent = (item: any) => {
  if (item.status === "missing") {
    const documentName = Object.keys(item.parent).find(key => item.parent[key] === item);
    return `No ${documentName?.replace(/([A-Z])/g, ' $1').trim()}`;
  }
  if (item.status === "completed") return "Completed";
  if (item.status === "n/a") return "N/A";
  if (item.status === "valid") return (
    <>
      {item.date}<br />
      <span className="text-xs">Expires in {item.expiresIn} days</span>
    </>
  );
  if (item.status === "expired") return item.date;
  return item.status;
};

const TaskMatrix = () => {
  const location = useLocation();
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("staff");
  
  const activeTab = location.pathname.includes("/workflow/") 
    ? "workflow" 
    : "task-matrix";

  const handleChangeTab = (value: string) => {
    if (id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else if (value === "workflow") {
        navigate(`/branch-dashboard/${id}/${branchName}/task-matrix`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      if (value === "workflow") {
        navigate(`/workflow/task-matrix`);
      } else if (value.includes("matrix")) {
        navigate(`/workflow/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  const filteredStaff = staffComplianceData.filter(staff => 
    staff.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    toast.info("Export functionality will be implemented soon", {
      description: "This feature is coming in a future update",
      position: "top-center",
    });
  };

  const handleAddTask = () => {
    toast.info("Add Task functionality will be implemented soon", {
      description: "This feature is coming in a future update",
      position: "top-center",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {id && branchName && (
          <BranchHeader 
            id={id} 
            branchName={branchName} 
            onNewBooking={() => {}}
          />
        )}
        
        <TabNavigation 
          activeTab={activeTab} 
          onChange={handleChangeTab}
          hideQuickAdd={true}
        />
        
        <div className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-gray-500" />
              <h1 className="text-2xl font-bold text-gray-800">Task Matrix</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <RadioGroup 
                defaultValue="staff" 
                className="flex items-center rounded-md border p-1" 
                value={viewType}
                onValueChange={setViewType}
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem 
                    value="staff" 
                    id="staff" 
                    className="peer sr-only" 
                  />
                  <Label
                    htmlFor="staff"
                    className={`rounded-sm px-3 py-1.5 text-sm font-medium ${
                      viewType === "staff" 
                        ? "bg-blue-600 text-white" 
                        : "bg-transparent text-gray-600 hover:bg-gray-100"
                    } cursor-pointer transition-colors`}
                  >
                    Staff
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem 
                    value="client" 
                    id="client" 
                    className="peer sr-only" 
                  />
                  <Label
                    htmlFor="client"
                    className={`rounded-sm px-3 py-1.5 text-sm font-medium ${
                      viewType === "client" 
                        ? "bg-blue-600 text-white" 
                        : "bg-transparent text-gray-600 hover:bg-gray-100"
                    } cursor-pointer transition-colors`}
                  >
                    Client
                  </Label>
                </div>
              </RadioGroup>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-700 border-gray-200"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleAddTask}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
          
          <div className="flex mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto bg-white rounded-md shadow">
            <Table className="border-collapse w-full">
              <TableHeader>
                <TableRow className="bg-blue-600 text-white">
                  <TableHead className="border border-blue-700 text-center py-2 px-4 font-semibold text-white text-sm w-[40px]">#</TableHead>
                  <TableHead className="border border-blue-700 py-2 px-4 font-semibold text-white text-sm">Full Name</TableHead>
                  <TableHead className="border border-blue-700 py-2 px-4 font-semibold text-white text-sm">Percentage</TableHead>
                  
                  {complianceCategories.map((category) => (
                    <TableHead 
                      key={category.id}
                      className="border border-blue-700 py-2 px-4 font-semibold text-white text-sm text-center relative min-w-[150px]"
                    >
                      <div className="flex flex-col items-center">
                        <span>{category.name}</span>
                        <span className="text-xs mt-1">{category.completion}%</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 absolute right-1 top-1 text-white hover:text-white hover:bg-blue-700"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => {
                    // Prepare items with parent reference for each row
                    const workPermit = { ...staff.workPermit, parent: staff };
                    const carInsurance = { ...staff.carInsurance, parent: staff };
                    const niNumber = { ...staff.niNumber, parent: staff };
                    const drivingLicense = { ...staff.drivingLicense, parent: staff };
                    const dvla = { ...staff.dvla, parent: staff };
                    const dbs = { ...staff.dbs, parent: staff };
                    
                    return (
                      <TableRow key={staff.id} className={staff.id % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <TableCell className="border border-gray-200 text-center py-4 px-4 font-medium">
                          {staff.id}
                        </TableCell>
                        <TableCell className="border border-gray-200 py-4 px-4">
                          {staff.fullName}
                        </TableCell>
                        <TableCell className="border border-gray-200 py-4 px-4 font-medium">
                          {staff.compliancePercentage}%
                        </TableCell>
                        
                        <TableCell className={`border border-gray-200 p-0 ${getCellBackgroundColor(workPermit)}`}>
                          <div className="flex flex-col h-full">
                            <div className="flex-1 p-4 text-center">
                              {renderCellContent(workPermit)}
                            </div>
                            <div className="p-1.5 border-t border-gray-200 bg-white">
                              <input type="checkbox" className="h-4 w-4" checked={workPermit.completed} readOnly />
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className={`border border-gray-200 p-0 ${getCellBackgroundColor(carInsurance)}`}>
                          <div className="flex flex-col h-full">
                            <div className="flex-1 p-4 text-center">
                              {renderCellContent(carInsurance)}
                            </div>
                            <div className="p-1.5 border-t border-gray-200 bg-white">
                              <input type="checkbox" className="h-4 w-4" checked={carInsurance.completed} readOnly />
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className={`border border-gray-200 p-0 ${getCellBackgroundColor(niNumber)}`}>
                          <div className="flex flex-col h-full">
                            <div className="flex-1 p-4 text-center">
                              {renderCellContent(niNumber)}
                            </div>
                            <div className="p-1.5 border-t border-gray-200 bg-white">
                              <input type="checkbox" className="h-4 w-4" checked={niNumber.completed} readOnly />
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className={`border border-gray-200 p-0 ${getCellBackgroundColor(drivingLicense)}`}>
                          <div className="flex flex-col h-full">
                            <div className="flex-1 p-4 text-center">
                              {renderCellContent(drivingLicense)}
                            </div>
                            <div className="p-1.5 border-t border-gray-200 bg-white">
                              <input type="checkbox" className="h-4 w-4" checked={drivingLicense.completed} readOnly />
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className={`border border-gray-200 p-0 ${getCellBackgroundColor(dvla)}`}>
                          <div className="flex flex-col h-full">
                            <div className="flex-1 p-4 text-center">
                              {renderCellContent(dvla)}
                            </div>
                            <div className="p-1.5 border-t border-gray-200 bg-white">
                              <input type="checkbox" className="h-4 w-4" checked={dvla.completed} readOnly />
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className={`border border-gray-200 p-0 ${getCellBackgroundColor(dbs)}`}>
                          <div className="flex flex-col h-full">
                            <div className="flex-1 p-4 text-center">
                              {renderCellContent(dbs)}
                            </div>
                            <div className="p-1.5 border-t border-gray-200 bg-white">
                              <input type="checkbox" className="h-4 w-4" checked={dbs.completed} readOnly />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No staff members found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskMatrix;
