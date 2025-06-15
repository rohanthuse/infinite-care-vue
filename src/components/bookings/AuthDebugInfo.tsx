
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthDebugInfoProps {
  branchId?: string;
}

export const AuthDebugInfo: React.FC<AuthDebugInfoProps> = ({ branchId }) => {
  const { user, session } = useAuth();

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm text-orange-800">Authentication Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2 text-orange-700">
        <div>
          <strong>User ID:</strong> {user?.id || "Not logged in"}
        </div>
        <div>
          <strong>Email:</strong> {user?.email || "N/A"}
        </div>
        <div>
          <strong>Session:</strong> {session ? "Active" : "None"}
        </div>
        <div>
          <strong>Branch ID:</strong> {branchId || "N/A"}
        </div>
        <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800">
          {!user && "⚠️ You need to log in to create bookings"}
          {user && "✅ User is authenticated"}
        </div>
      </CardContent>
    </Card>
  );
};
