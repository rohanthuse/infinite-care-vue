
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import { FileSpreadsheet, Search, Filter, Download, Plus, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

// Mock data for training records
const trainingData = [
  { 
    id: 1, 
    name: "John Smith", 
    role: "Care Assistant", 
    trainings: [
      { name: "Manual Handling", status: "completed", expiresIn: "5 months" },
      { name: "Health & Safety", status: "completed", expiresIn: "8 months" },
      { name: "Medication", status: "expired", expiresIn: "expired" },
      { name: "First Aid", status: "required", expiresIn: "required" }
    ]
  },
  { 
    id: 2, 
    name: "Sarah Johnson", 
    role: "Senior Carer", 
    trainings: [
      { name: "Manual Handling", status: "completed", expiresIn: "7 months" },
      { name: "Health & Safety", status: "completed", expiresIn: "2 months" },
      { name: "Medication", status: "completed", expiresIn: "3 months" },
      { name: "First Aid", status: "completed", expiresIn: "4 months" }
    ]
  },
  { 
    id: 3, 
    name: "Michael Lee", 
    role: "Domiciliary Care", 
    trainings: [
      { name: "Manual Handling", status: "completed", expiresIn: "1 month" },
      { name: "Health & Safety", status: "expiring", expiresIn: "1 month" },
      { name: "Medication", status: "completed", expiresIn: "5 months" },
      { name: "First Aid", status: "expiring", expiresIn: "2 weeks" }
    ]
  },
  { 
    id: 4, 
    name: "Emma Wilson", 
    role: "Healthcare Assistant", 
    trainings: [
      { name: "Manual Handling", status: "required", expiresIn: "required" },
      { name: "Health & Safety", status: "required", expiresIn: "required" },
      { name: "Medication", status: "required", expiresIn: "required" },
      { name: "First Aid", status: "required", expiresIn: "required" }
    ]
  }
];

const TrainingMatrix = () => {
  const location = useLocation();
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Always set activeTab to training-matrix for consistent menu highlighting
  const activeTab = "training-matrix";
  
  const filteredData = trainingData.filter(
    staff => staff.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangeTab = (value: string) => {
    if (id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      if (value.includes("matrix") || value === "workflow") {
        navigate(`/workflow/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Expired</Badge>;
      case "expiring":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Expiring Soon</Badge>;
      case "required":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Required</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  const handleAddTraining = () => {
    toast.info("Add Training functionality will be implemented soon", {
      description: "This feature is coming in a future update",
      position: "top-center",
    });
  };

  const handleExport = () => {
    toast.info("Export functionality will be implemented soon", {
      description: "This feature is coming in a future update",
      position: "top-center",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
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
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Training Matrix</h1>
              <p className="text-gray-500 mt-1">Monitor staff training compliance and certifications</p>
            </div>
            <div className="flex gap-3 items-center">
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
                onClick={handleAddTraining}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Training
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Search staff..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  <Badge className="bg-amber-100 text-amber-800">Expiring Soon</Badge>
                  <Badge className="bg-red-100 text-red-800">Expired</Badge>
                  <Badge className="bg-blue-100 text-blue-800">Required</Badge>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Manual Handling</TableHead>
                    <TableHead>Health & Safety</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>First Aid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>{staff.role}</TableCell>
                        {staff.trainings.map((training, index) => (
                          <TableCell key={index}>
                            {getStatusBadge(training.status)}
                            <div className="text-xs text-gray-500 mt-1">
                              {training.status === "required" ? "Required" : 
                               training.status === "expired" ? "Expired" : 
                               `Expires in: ${training.expiresIn}`}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        No staff members found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredData.length > 0 && (
              <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
                Showing {filteredData.length} of {trainingData.length} staff members
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Training Compliance</h3>
                  <Badge className="bg-green-100 text-green-800">75% Compliant</Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Completed</span>
                      <span className="text-gray-800 font-medium">12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Expiring Soon</span>
                      <span className="text-gray-800 font-medium">2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "12.5%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Expired</span>
                      <span className="text-gray-800 font-medium">1</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "6.25%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Required</span>
                      <span className="text-gray-800 font-medium">1</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "6.25%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Upcoming Expirations</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Michael Lee</p>
                      <p className="text-sm text-gray-500">Health & Safety</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">1 month</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Michael Lee</p>
                      <p className="text-sm text-gray-500">First Aid</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">2 weeks</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Sarah Johnson</p>
                      <p className="text-sm text-gray-500">Health & Safety</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">2 months</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload Training Certificates
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Training Session
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download Compliance Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainingMatrix;
