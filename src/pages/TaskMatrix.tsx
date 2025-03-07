
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Filter, Grid3X3, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabNavigation } from "@/components/TabNavigation";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// Define type for task data
type TaskStatus = "Completed" | "N/A" | string; // Date or "No X"

type StaffMember = {
  id: number;
  name: string;
  percentage: number;
  workPermit: TaskStatus;
  workPermitExpiry?: string;
  carInsurance: TaskStatus;
  carInsuranceExpiry?: string;
  niNumber: TaskStatus;
  drivingLicense: TaskStatus;
  drivingLicenseExpiry?: string;
  dvla: TaskStatus;
  dbs: TaskStatus;
  dbsExpiry?: string;
};

const TaskMatrix = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { id, branchName } = params;
  const [filterType, setFilterType] = useState<"Staff" | "Client">("Staff");
  const [activeTab, setActiveTab] = useState("workflow");
  
  // Determine if we're in a branch context
  const isInBranchContext = Boolean(id && branchName);
  
  const handleBackToWorkflow = () => {
    if (isInBranchContext) {
      navigate(`/branch-dashboard/${id}/${branchName}/workflow`);
    } else {
      navigate('/workflow');
    }
  };
  
  // Sample data based on the image
  const staffData: StaffMember[] = [
    {
      id: 1,
      name: "Ayo-Famure, Opeyemi",
      percentage: 86,
      workPermit: "13/05/2028",
      workPermitExpiry: "Expires in 1164 days",
      carInsurance: "N/A",
      niNumber: "Completed",
      drivingLicense: "N/A",
      dvla: "N/A",
      dbs: "20/02/2027",
      dbsExpiry: "Expires in 716 days",
    },
    {
      id: 2,
      name: "Iyaniwura, Ifeoluwa Adeseye",
      percentage: 13,
      workPermit: "No Work Permit",
      carInsurance: "No Car Insurance",
      niNumber: "No NI Number",
      drivingLicense: "No Driving License",
      dvla: "No DVLA",
      dbs: "No DBS",
    },
    {
      id: 3,
      name: "Abiri-Maitland, Midé",
      percentage: 73,
      workPermit: "Completed",
      carInsurance: "N/A",
      niNumber: "Completed",
      drivingLicense: "15/05/2033",
      drivingLicenseExpiry: "Expires in 2992 days",
      dvla: "Completed",
      dbs: "N/A",
    },
    {
      id: 4,
      name: "Asubonteng, Lydia",
      percentage: 80,
      workPermit: "26/09/2026",
      workPermitExpiry: "Expires in 569 days",
      carInsurance: "N/A",
      niNumber: "Completed",
      drivingLicense: "N/A",
      dvla: "N/A",
      dbs: "09/02/2025",
    },
    {
      id: 5,
      name: "Baulch, Ursula",
      percentage: 80,
      workPermit: "30/04/2028",
      workPermitExpiry: "Expires in 1151 days",
      carInsurance: "N/A",
      niNumber: "Completed",
      drivingLicense: "N/A",
      dvla: "N/A",
      dbs: "30/11/2024",
    },
    {
      id: 6,
      name: "Charuma, Charmaine",
      percentage: 86,
      workPermit: "23/10/2026",
      workPermitExpiry: "Expires in 596 days",
      carInsurance: "21/06/2025",
      carInsuranceExpiry: "Expires in 107 days",
      niNumber: "Completed",
      drivingLicense: "31/01/2034",
      drivingLicenseExpiry: "Expires in 3253 days",
      dvla: "Completed",
      dbs: "31/01/2027",
      dbsExpiry: "Expires in 696 days",
    },
  ];

  // Function to determine cell color based on status
  const getCellColor = (status: TaskStatus): string => {
    if (status === "N/A") return "bg-green-500/20 text-green-800";
    if (status === "Completed") return "bg-green-500/20 text-green-800";
    if (status.startsWith("No ")) return "bg-red-500 text-white";
    return "bg-green-500/20 text-green-800"; // Dates are green
  };

  const getHeaderPercentage = (field: string): string => {
    switch (field) {
      case "workPermit":
      case "carInsurance":
        return "61%";
      case "niNumber":
      case "dbs":
        return "55%";
      case "drivingLicense":
      case "dvla":
        return "72%";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto p-4">
      {isInBranchContext && (
        <div className="mb-6">
          <TabNavigation 
            activeTab={activeTab} 
            onChange={(tab) => {
              setActiveTab(tab);
              navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
            }}
          />
        </div>
      )}
      
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            {isInBranchContext ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink as={Link} to={`/branch-dashboard/${id}/${branchName}`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink as={Link} to={`/branch-dashboard/${id}/${branchName}/workflow`}>
                    Workflow
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/workflow">
                  Workflow
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>Task Matrix</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Grid3X3 className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-semibold text-gray-700">Task Matrix</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setFilterType("Staff")}
              className={`rounded-full px-4 py-1 ${
                filterType === "Staff" 
                  ? "bg-blue-500 text-white" 
                  : "text-gray-700"
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => setFilterType("Client")}
              className={`rounded-full px-4 py-1 ${
                filterType === "Client" 
                  ? "bg-blue-500 text-white" 
                  : "text-gray-700"
              }`}
            >
              Client
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button className="border border-gray-300 rounded p-2">
              <Filter className="h-5 w-5 text-gray-700" />
            </button>
            <Button variant="outline" onClick={handleBackToWorkflow}>
              Back to Workflow
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-600 text-white">
              <TableHead className="border text-center font-bold">#</TableHead>
              <TableHead className="border text-center font-bold">Full Name</TableHead>
              <TableHead className="border text-center font-bold">Percentage</TableHead>
              <TableHead className="border text-center font-bold">
                Work Permit<br />
                {getHeaderPercentage("workPermit")}
              </TableHead>
              <TableHead className="border text-center font-bold">
                Car Insurance<br />
                {getHeaderPercentage("carInsurance")}
              </TableHead>
              <TableHead className="border text-center font-bold">
                NI Number<br />
                {getHeaderPercentage("niNumber")}
              </TableHead>
              <TableHead className="border text-center font-bold">
                Driving License<br />
                {getHeaderPercentage("drivingLicense")}
              </TableHead>
              <TableHead className="border text-center font-bold">
                DVLA<br />
                {getHeaderPercentage("dvla")}
              </TableHead>
              <TableHead className="border text-center font-bold">
                DBS<br />
                {getHeaderPercentage("dbs")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffData.map((staff) => (
              <TableRow key={staff.id} className="bg-gray-100 hover:bg-gray-200">
                <TableCell className="border text-center font-medium">{staff.id}</TableCell>
                <TableCell className="border">{staff.name}</TableCell>
                <TableCell className="border text-center">
                  <Badge variant="outline" className="font-bold px-3 py-1">
                    {staff.percentage}%
                  </Badge>
                </TableCell>
                <TableCell className={`border ${getCellColor(staff.workPermit)}`}>
                  <div>{staff.workPermit}</div>
                  {staff.workPermitExpiry && (
                    <div className="text-sm">{staff.workPermitExpiry}</div>
                  )}
                  <div className="mt-2">
                    <input type="checkbox" className="h-5 w-5" />
                  </div>
                </TableCell>
                <TableCell className={`border ${getCellColor(staff.carInsurance)}`}>
                  <div>{staff.carInsurance}</div>
                  {staff.carInsuranceExpiry && (
                    <div className="text-sm">{staff.carInsuranceExpiry}</div>
                  )}
                  <div className="mt-2">
                    <input type="checkbox" className="h-5 w-5" />
                  </div>
                </TableCell>
                <TableCell className={`border ${getCellColor(staff.niNumber)}`}>
                  <div>{staff.niNumber}</div>
                  <div className="mt-2">
                    <input type="checkbox" className="h-5 w-5" />
                  </div>
                </TableCell>
                <TableCell className={`border ${getCellColor(staff.drivingLicense)}`}>
                  <div>{staff.drivingLicense}</div>
                  {staff.drivingLicenseExpiry && (
                    <div className="text-sm">{staff.drivingLicenseExpiry}</div>
                  )}
                  <div className="mt-2">
                    <input type="checkbox" className="h-5 w-5" />
                  </div>
                </TableCell>
                <TableCell className={`border ${getCellColor(staff.dvla)}`}>
                  <div>{staff.dvla}</div>
                  <div className="mt-2">
                    <input type="checkbox" className="h-5 w-5" />
                  </div>
                </TableCell>
                <TableCell className={`border ${getCellColor(staff.dbs)}`}>
                  <div>{staff.dbs}</div>
                  {staff.dbsExpiry && (
                    <div className="text-sm">{staff.dbsExpiry}</div>
                  )}
                  <div className="mt-2">
                    <input type="checkbox" className="h-5 w-5" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TaskMatrix;
