
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Filter, Calendar, User, FileText } from "lucide-react";
import { CarePlanDetail } from "./CarePlanDetail";
import { CreateCarePlanDialog } from "@/components/clients/dialogs/CreateCarePlanDialog";
import { CarePlanCreationWizard } from "@/components/clients/dialogs/CarePlanCreationWizard";
import { useParams } from "react-router-dom";

// Mock data for care plans
const mockCarePlans = [
  {
    id: "CP-001",
    patientName: "John Michael",
    patientId: "client-1",
    dateCreated: new Date("2024-01-15"),
    lastUpdated: new Date("2024-01-20"),
    status: "Active",
    assignedTo: "Dr. Sarah Johnson",
    avatar: "JM",
  },
  {
    id: "CP-002",
    patientName: "Mary Williams",
    patientId: "client-2", 
    dateCreated: new Date("2024-01-10"),
    lastUpdated: new Date("2024-01-18"),
    status: "Under Review",
    assignedTo: "Dr. Michael Brown",
    avatar: "MW",
  },
  {
    id: "CP-003",
    patientName: "Robert Davis",
    patientId: "client-3",
    dateCreated: new Date("2024-01-05"),
    lastUpdated: new Date("2024-01-15"),
    status: "Completed",
    assignedTo: "Dr. Emily Chen",
    avatar: "RD",
  },
];

export const CareTab = () => {
  const [selectedCarePlan, setSelectedCarePlan] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  
  const { id: branchId } = useParams();

  const filteredCarePlans = mockCarePlans.filter((plan) => {
    const matchesSearch = plan.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || plan.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "under review":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreateCarePlan = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowWizard(true);
  };

  if (selectedCarePlan) {
    return (
      <CarePlanDetail
        carePlan={selectedCarePlan}
        onClose={() => setSelectedCarePlan(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Care Plans</h2>
          <p className="text-gray-600">Manage and monitor patient care plans</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Care Plan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name or care plan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="under review">Under Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCarePlans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.id}</CardTitle>
                <Badge className={getStatusColor(plan.status)}>
                  {plan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {plan.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{plan.patientName}</p>
                    <p className="text-sm text-gray-500">Patient</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Assigned to: {plan.assignedTo}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {plan.dateCreated.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>Updated: {plan.lastUpdated.toLocaleDateString()}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedCarePlan(plan)}
                  className="w-full"
                  variant="outline"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCarePlans.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No care plans found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Get started by creating your first care plan"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Care Plan
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Care Plan Dialog */}
      <CreateCarePlanDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={(carePlan) => {
          console.log("Care plan created:", carePlan);
          setShowCreateDialog(false);
        }}
      />

      {/* Care Plan Creation Wizard */}
      <CarePlanCreationWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        clientId={selectedClientId}
        onComplete={() => {
          setShowWizard(false);
          setSelectedClientId("");
        }}
      />
    </div>
  );
};
