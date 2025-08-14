import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useBranchNavigation } from '@/hooks/useBranchNavigation';
import { BranchSelectionDialog } from '@/components/BranchSelectionDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Activity } from 'lucide-react';

interface AdminBranch {
  branch_id: string;
  branch_name: string;
}

export const TenantDashboard = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: branches, isLoading: branchesLoading } = useBranchNavigation();
  const [showBranchSelection, setShowBranchSelection] = useState(false);
  const [userBranches, setUserBranches] = useState<AdminBranch[]>([]);

  useEffect(() => {
    if (loading || roleLoading || branchesLoading) return;

    // If no session, let RequireAdminAuth handle the redirect
    if (!session) return;

    // If super admin, show branch selection
    if (userRole?.role === 'super_admin') {
      if (branches) {
        const adminBranches = branches.map(branch => ({
          branch_id: branch.id,
          branch_name: branch.name
        }));
        setUserBranches(adminBranches);
        setShowBranchSelection(true);
      }
      return;
    }

    // If branch admin, redirect to their specific branch
    if (userRole?.role === 'branch_admin' && userRole?.branchId) {
      const branch = branches?.find(b => b.id === userRole.branchId);
      if (branch) {
        const encodedBranchName = encodeURIComponent(branch.name);
        navigate(`/${tenantSlug}/branch-dashboard/${userRole.branchId}/${encodedBranchName}`, { replace: true });
      }
      return;
    }

  }, [session, userRole, branches, loading, roleLoading, branchesLoading, navigate, tenantSlug]);

  const handleBranchSelect = (branchId: string, branchName: string) => {
    const encodedBranchName = encodeURIComponent(branchName);
    navigate(`/${tenantSlug}/branch-dashboard/${branchId}/${encodedBranchName}`, { replace: true });
  };

  const handleCloseBranchSelection = () => {
    // For super admins, redirect to system dashboard if they cancel
    navigate('/system-dashboard', { replace: true });
  };

  if (loading || roleLoading || branchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For branch admins, show redirecting message
  if (userRole?.role === 'branch_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your branch dashboard...</p>
        </div>
      </div>
    );
  }

  // For super admins, show the tenant overview or branch selection
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {tenantSlug?.charAt(0).toUpperCase() + tenantSlug?.slice(1)} Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to the tenant dashboard. Select a branch to manage or view overview data.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Branches</p>
              <p className="text-2xl font-bold">{branches?.length || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Branch List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Available Branches</h2>
        <div className="space-y-3">
          {branches?.map((branch) => (
            <div key={branch.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{branch.name}</h3>
                <p className="text-sm text-muted-foreground">Branch ID: {branch.id}</p>
              </div>
              <Button 
                onClick={() => handleBranchSelect(branch.id, branch.name)}
                variant="outline"
              >
                Access Dashboard
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Branch Selection Dialog */}
      <BranchSelectionDialog
        isOpen={showBranchSelection}
        onClose={handleCloseBranchSelection}
        adminName={session?.user?.email || 'Admin'}
        branches={userBranches}
        onBranchSelect={handleBranchSelect}
      />
    </div>
  );
};