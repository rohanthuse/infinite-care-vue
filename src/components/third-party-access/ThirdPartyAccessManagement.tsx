
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThirdPartyAccessForm } from "./ThirdPartyAccessForm";
import { ThirdPartyAccessRequestsList } from "./ThirdPartyAccessRequestsList";
import { useCanAccessBranch } from "@/hooks/useUserRoleCheck";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ThirdPartyAccessManagementProps {
  branchId: string;
}

export const ThirdPartyAccessManagement: React.FC<ThirdPartyAccessManagementProps> = ({
  branchId,
}) => {
  const [showForm, setShowForm] = useState(false);
  const canAccess = useCanAccessBranch(branchId);

  // Show access denied message if user can't access this branch
  if (!canAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You do not have permission to manage third-party access for this branch. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleRequestCreated = () => {
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Third-Party Access Management</h2>
          <p className="text-gray-500 mt-1">Create and manage external access requests</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Access Request
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Third-Party Access Request</CardTitle>
          </CardHeader>
          <CardContent>
            <ThirdPartyAccessForm 
              branchId={branchId} 
              onRequestCreated={handleRequestCreated}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <ThirdPartyAccessRequestsList branchId={branchId} />
        </CardContent>
      </Card>
    </div>
  );
};
