
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import { FileText, Search, Filter, Download, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for forms
const formsData = [
  {
    id: "F-001",
    name: "Care Plan Assessment",
    category: "Care Plans",
    lastUpdated: "15/04/2025",
    status: "active",
    usageCount: 45
  },
  {
    id: "F-002",
    name: "Client Intake Form",
    category: "Onboarding",
    lastUpdated: "02/03/2025",
    status: "active",
    usageCount: 78
  },
  {
    id: "F-003",
    name: "Medication Administration Record",
    category: "Medication",
    lastUpdated: "28/02/2025",
    status: "archived",
    usageCount: 120
  },
  {
    id: "F-004",
    name: "Client Feedback Survey",
    category: "Feedback",
    lastUpdated: "10/01/2025",
    status: "active",
    usageCount: 23
  },
  {
    id: "F-005",
    name: "Staff Training Record",
    category: "Training",
    lastUpdated: "05/04/2025",
    status: "active",
    usageCount: 34
  },
  {
    id: "F-006",
    name: "Risk Assessment",
    category: "Risk Management",
    lastUpdated: "22/03/2025",
    status: "draft",
    usageCount: 0
  }
];

const FormMatrix = () => {
  const [activeTab, setActiveTab] = useState("form-matrix");
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Check if we need to decode the branch name
  const displayBranchName = branchName ? decodeURIComponent(branchName) : undefined;

  const filteredForms = formsData.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || form.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || form.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleChangeTab = (value: string) => {
    setActiveTab(value);
    
    if (id && branchName) {
      // Branch context navigation
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      // Global context navigation
      if (value.includes("matrix") || value === "workflow") {
        navigate(`/workflow/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Archived</Badge>;
      case "draft":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {id && branchName && (
          <BranchHeader 
            id={id} 
            branchName={displayBranchName || branchName} 
            onNewBooking={() => {}}
          />
        )}
        
        <TabNavigation 
          activeTab={activeTab} 
          onChange={handleChangeTab}
        />
        
        <div className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Form Matrix</h1>
              <p className="text-gray-500 mt-1">Track client form completion and documentation status</p>
            </div>
            <div className="flex gap-3 items-center">
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-200">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-200">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Search forms..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Care Plans">Care Plans</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Medication">Medication</SelectItem>
                      <SelectItem value="Feedback">Feedback</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Risk Management">Risk Management</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Form ID</TableHead>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.length > 0 ? (
                    filteredForms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.id}</TableCell>
                        <TableCell>{form.name}</TableCell>
                        <TableCell>{form.category}</TableCell>
                        <TableCell>{form.lastUpdated}</TableCell>
                        <TableCell>{getStatusBadge(form.status)}</TableCell>
                        <TableCell>{form.usageCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                        No forms found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredForms.length > 0 && (
              <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
                Showing {filteredForms.length} of {formsData.length} forms
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Form Statistics</CardTitle>
                <CardDescription>Overview of form usage and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Active Forms</span>
                      <span className="text-gray-800 font-medium">4</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "66.7%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Archived Forms</span>
                      <span className="text-gray-800 font-medium">1</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-500 h-2 rounded-full" style={{ width: "16.7%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Draft Forms</span>
                      <span className="text-gray-800 font-medium">1</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "16.7%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Popular Forms</CardTitle>
                <CardDescription>Most used form templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Medication Administration Record</p>
                      <p className="text-xs text-gray-500">Medication</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">120</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Client Intake Form</p>
                      <p className="text-xs text-gray-500">Onboarding</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">78</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Care Plan Assessment</p>
                      <p className="text-xs text-gray-500">Care Plans</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">45</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>Form management shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Form
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Forms
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-gray-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export Form Data
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

export default FormMatrix;
