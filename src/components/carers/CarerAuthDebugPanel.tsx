
import React from "react";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, User, Database } from "lucide-react";

export const CarerAuthDebugPanel = () => {
  const { user, carerProfile, isAuthenticated, isCarerRole, error } = useCarerAuthSafe();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
          <User className="h-4 w-4" />
          Carer Auth Debug Panel (Development Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-blue-700">Auth Status:</span>
          <Badge 
            variant={isAuthenticated ? "default" : "destructive"}
            className="text-xs"
          >
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Database className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-blue-700">Carer Role:</span>
          <Badge 
            variant={isCarerRole ? "default" : "destructive"}
            className="text-xs"
          >
            {isCarerRole ? 'Verified' : 'Not Verified'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-blue-700">User ID:</span>
          <code className="text-xs bg-blue-100 px-1 rounded">
            {user?.id || 'Not logged in'}
          </code>
        </div>

        {carerProfile && (
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-blue-600" />
            <span className="text-xs text-blue-700">Carer Profile:</span>
            <span className="text-xs">
              {carerProfile.first_name} {carerProfile.last_name} ({carerProfile.email})
            </span>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Auth Error:</strong> {error}
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
            <strong>Note:</strong> User needs to sign in through carer login page
          </div>
        )}
      </CardContent>
    </Card>
  );
};
