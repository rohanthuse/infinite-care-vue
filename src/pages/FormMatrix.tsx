
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import { 
  FileText, Calendar, Download, Filter, 
  Search, PlusCircle, RefreshCw, ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const formRecords = [
  {
    id: "F001",
    name: "Care Assessment Form",
    client: "Pender, Eva",
    status: "Completed",
    lastUpdated: "15/02/2025",
    assignedTo: "Warren, Susan"
  },
  {
    id: "F002",
    name: "Medical History Form",
    client: "Fulcher, Patricia",
    status: "Pending",
    lastUpdated: "18/02/2025",
    assignedTo: "Charuma, Charmaine"
  },
  {
    id: "F003",
    name: "Client Agreement",
    client: "Baulch, Ursula",
    status: "Incomplete",
    lastUpdated: "20/02/2025",
    assignedTo: "Ayo-Famure, Opeyemi"
  },
  {
    id: "F004",
    name: "Medication Consent",
    client: "Ren, Victoria",
    status: "Completed",
    lastUpdated: "12/02/2025",
    assignedTo: "Warren, Susan"
  },
  {
    id: "F005",
    name: "Risk Assessment",
    client: "Iyaniwura, Ifeoluwa",
    status: "Pending Review",
    lastUpdated: "21/02/2025",
    assignedTo: "Charuma, Charmaine"
  },
  {
    id: "F006",
    name: "Care Plan",
    client: "Ltd, Careville",
    status: "Incomplete",
    lastUpdated: "19/02/2025",
    assignedTo: "Ayo-Famure, Opeyemi"
  }
];

const FormMatrix = () => {
  const location = useLocation();
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  
  // Set activeTab to "form-matrix" instead of "workflow"
  const activeTab = "form-matrix";

  const handleChangeTab = (value: string) => {
    if (id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else if (value === "workflow") {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      } else if (value === "task-matrix" || value === "training-matrix" || value === "form-matrix") {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      if (value === "workflow") {
        navigate(`/workflow/form-matrix`);
      } else if (value === "task-matrix" || value === "training-matrix" || value === "form-matrix") {
        navigate(`/workflow/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  const filteredForms = formRecords.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          form.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          form.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || form.status === statusFilter;
    const matchesClient = clientFilter === "all" || form.client === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleAddForm = () => {
    toast.info("Add Form functionality will be implemented soon", {
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
              <h1 className="text-2xl font-bold text-gray-800">Form Matrix</h1>
              <p className="text-gray-500 mt-1">Track client form completion and documentation status</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleAddForm}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                <span>Add Form</span>
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search forms..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-1/3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Incomplete">Incomplete</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {[...new Set(formRecords.map(form => form.client))].map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Client Forms</CardTitle>
                  <CardDescription>Track form completion status</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.length > 0 ? (
                      filteredForms.map((form) => (
                        <TableRow key={form.id}>
                          <TableCell className="font-medium">{form.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              {form.name}
                            </div>
                          </TableCell>
                          <TableCell>{form.client}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              form.status === "Completed" ? "bg-green-100 text-green-800" :
                              form.status === "Pending" ? "bg-blue-100 text-blue-800" :
                              form.status === "Incomplete" ? "bg-red-100 text-red-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {form.status}
                            </div>
                          </TableCell>
                          <TableCell>{form.lastUpdated}</TableCell>
                          <TableCell>{form.assignedTo}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          No forms found matching your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FormMatrix;
