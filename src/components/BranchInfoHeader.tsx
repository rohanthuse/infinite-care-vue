import React from "react";
import { Phone, Mail, MapPin, Clock, CalendarRange, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthSafe } from "@/hooks/useAuthSafe";
import { useBranchInfo } from "@/hooks/useBranchInfo";
import { BackButton } from "@/components/navigation/BackButton";
import { BreadcrumbNavigation } from "@/components/navigation/BreadcrumbNavigation";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";

interface BranchInfoHeaderProps {
  branchName: string;
  branchId: string;
  onNewBooking: () => void;
}

export const BranchInfoHeader = ({
  branchName,
  branchId,
  onNewBooking
}: BranchInfoHeaderProps) => {
  const { user } = useAuthSafe();
  const { data: branchInfo, isLoading } = useBranchInfo(branchId);
  const { data: userRole } = useUserRole();
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const { handleTabChange } = useBranchDashboardNavigation();
  
  // Determine back destination based on user role
  const handleBack = () => {
    // All admin roles (super_admin, branch_admin, owner, admin) go to tenant dashboard
    if (tenantSlug) {
      navigate(`/${tenantSlug}/dashboard`);
    } else {
      navigate('/dashboard');
    }
  };
  
  // Create breadcrumb items
  const breadcrumbItems = [
    {
      label: userRole?.role === 'super_admin' ? 'Organisation Management' : 'Organisation Branches',
      onClick: handleBack
    },
    {
      label: branchName
    }
  ];
  
  // If data is still loading, show loading state or use fallbacks
  if (isLoading || !branchInfo) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 md:p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return <div className="bg-gradient-to-br from-blue-50/40 via-card to-emerald-50/30 dark:from-blue-950/20 dark:via-card dark:to-emerald-950/20 rounded-lg shadow-md shadow-blue-100/20 dark:shadow-blue-900/10 border border-border p-4 md:p-6 mb-6 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-blue-500 before:via-cyan-500 before:to-emerald-500 before:rounded-t-lg">
      {/* Back Button and Breadcrumbs */}
      <div className="flex items-center gap-4 mb-4">
        <BackButton 
          onClick={handleBack}
          label={userRole?.role === 'super_admin' ? 'Back to All Branches' : 'Back'}
          variant="outline"
        />
        <BreadcrumbNavigation items={breadcrumbItems} />
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl md:text-2xl font-bold">{branchName}</h1>
            <Badge variant="success" className="text-xs">
              {branchInfo.status}
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-muted-foreground">
            {branchInfo.address && (
              <>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{branchInfo.address}</span>
                </div>
                <div className="hidden md:flex items-center text-border">|</div>
              </>
            )}
            {branchInfo.phone && (
              <>
                <div className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{branchInfo.phone}</span>
                </div>
                <div className="hidden md:flex items-center text-border">|</div>
              </>
            )}
            {branchInfo.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{branchInfo.email}</span>
              </div>
            )}
          </div>
          
          
        </div>
        
        <div className="flex gap-2 justify-start md:justify-end">
          <Button 
            onClick={() => handleTabChange('communication')}
            variant="outline"
            className="h-9 rounded-full px-3 shadow-sm"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>Communication</span>
          </Button>
          
          <Button 
            onClick={onNewBooking} 
            variant="default"
            className="h-9 bg-blue-600 hover:bg-blue-700 rounded-full px-3 shadow-sm"
            disabled={!user}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>New Booking</span>
          </Button>
        </div>
      </div>
    </div>;
};
