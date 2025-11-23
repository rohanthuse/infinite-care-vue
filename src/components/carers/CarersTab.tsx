
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase } from "lucide-react";
import RecruitmentSection from "./RecruitmentSection";
import { TeamManagementSection } from "./TeamManagementSection";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { useTenant } from "@/contexts/TenantContext";

interface CarersTabProps {
  branchId?: string;
  branchName?: string;
}

export function CarersTab({ branchId, branchName }: CarersTabProps) {
  const [activeTab, setActiveTab] = useState("team");
  const { degradedMode, isHealthy, forceHealthCheck } = useSystemHealth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  // Handle auto-navigation to staff profile from search
  useEffect(() => {
    const selectedStaffId = searchParams.get('selected');
    if (selectedStaffId && branchId && branchName) {
      // Navigate to the staff profile page
      const basePath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}`
        : `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}`;
      
      const staffProfilePath = `${basePath}/carers/${selectedStaffId}`;
      
      // Clean up query param and navigate
      searchParams.delete('selected');
      setSearchParams(searchParams, { replace: true });
      navigate(staffProfilePath, { replace: true });
    }
  }, [searchParams, branchId, branchName, tenantSlug, navigate, setSearchParams]);

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Branch ID is required</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* System Health Alert */}
        {degradedMode && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              System is running in degraded mode. Some real-time features may be limited. 
              <button 
                onClick={forceHealthCheck}
                className="ml-2 underline hover:no-underline"
              >
                Check system status
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
            <p className="text-gray-600">Manage your care team and recruitment</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Management
            </TabsTrigger>
            <TabsTrigger value="recruitment" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Recruitment & Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-6">
            <ErrorBoundary>
              <TeamManagementSection branchId={branchId} branchName={branchName} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="recruitment" className="mt-6">
            <ErrorBoundary>
              <RecruitmentSection branchId={branchId} branchName={branchName} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
