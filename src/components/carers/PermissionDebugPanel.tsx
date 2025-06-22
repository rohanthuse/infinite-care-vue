
import React from "react";
import { usePermissionDebug } from "@/data/hooks/usePermissionDebug";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Building } from "lucide-react";

interface PermissionDebugPanelProps {
  branchId: string;
}

export const PermissionDebugPanel = ({ branchId }: PermissionDebugPanelProps) => {
  const { data: debugInfo, isLoading } = usePermissionDebug(branchId);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <p className="text-sm text-orange-600">Loading permission debug info...</p>
        </CardContent>
      </Card>
    );
  }

  if (!debugInfo) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Permission Debug Panel (Development Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-orange-600" />
          <span className="text-xs text-orange-700">User ID:</span>
          <code className="text-xs bg-orange-100 px-1 rounded">
            {debugInfo.userId || 'Not logged in'}
          </code>
        </div>

        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-orange-600" />
          <span className="text-xs text-orange-700">Roles:</span>
          <div className="flex gap-1">
            {debugInfo.userRoles.length > 0 ? (
              debugInfo.userRoles.map(role => (
                <Badge key={role} variant="outline" className="text-xs">
                  {role}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-orange-500 italic">No roles assigned</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Building className="h-3 w-3 text-orange-600" />
          <span className="text-xs text-orange-700">Admin Branches:</span>
          <span className="text-xs">
            {debugInfo.adminBranches.length > 0 
              ? `${debugInfo.adminBranches.length} branch(es)` 
              : 'None'
            }
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-orange-700">Current Branch Access:</span>
          <Badge 
            variant={debugInfo.currentBranchAccess ? "default" : "destructive"}
            className="text-xs"
          >
            {debugInfo.currentBranchAccess ? 'Granted' : 'Denied'}
          </Badge>
        </div>

        {!debugInfo.currentBranchAccess && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <strong>Issue:</strong> No access to this branch. You need either:
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>super_admin role (global access), or</li>
              <li>branch_admin role + entry in admin_branches table</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
