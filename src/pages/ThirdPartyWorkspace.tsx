import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CustomButton } from '@/components/ui/CustomButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Building, 
  Eye, 
  LogOut, 
  AlertTriangle,
  Calendar,
  User,
  Users
} from 'lucide-react';
import ClientDemoView from '@/components/third-party-workspace/ClientDemoView';
import CarerDemoView from '@/components/third-party-workspace/CarerDemoView';

interface ThirdPartySession {
  sessionToken: string;
  thirdPartyUser: {
    id: string;
    email: string;
    firstName: string;
    surname: string;
    fullName: string;
  };
  branchInfo: {
    id: string;
    name: string;
    organizationId: string;
    organizationSlug?: string;
    organizationName?: string;
  };
  accessScope: string;
  accessExpiresAt?: string;
}

const ThirdPartyWorkspace = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<ThirdPartySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    loadSession();
  }, []);

  // Auto-check session expiry every minute
  useEffect(() => {
    if (!session?.accessExpiresAt) return;

    const checkExpiry = setInterval(() => {
      const expiryDate = new Date(session.accessExpiresAt!);
      if (new Date() > expiryDate) {
        toast.error('Your access has expired');
        handleSignOut();
      }
    }, 60000);

    return () => clearInterval(checkExpiry);
  }, [session]);

  const loadSession = () => {
    try {
      const sessionData = localStorage.getItem('thirdPartySession');
      if (!sessionData) {
        toast.error('No active third-party session found');
        navigate('/third-party/login');
        return;
      }

      const parsedSession = JSON.parse(sessionData) as ThirdPartySession;
      
      // Check if session is expired
      if (parsedSession.accessExpiresAt) {
        const expiryDate = new Date(parsedSession.accessExpiresAt);
        if (new Date() > expiryDate) {
          toast.error('Your access has expired');
          handleSignOut();
          return;
        }
      }

      setSession(parsedSession);
      
      // Set default active tab based on access scope
      if (parsedSession.accessScope === 'client') {
        setActiveTab('client');
      } else if (parsedSession.accessScope === 'staff') {
        setActiveTab('staff');
      } else {
        setActiveTab('client'); // Default to client for 'both'
      }
    } catch (error) {
      console.error('Error loading third-party session:', error);
      toast.error('Invalid session data');
      navigate('/third-party/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('thirdPartySession');
    toast.success('Signed out successfully');
    navigate('/third-party/login');
  };

  const getUserDisplayName = () => {
    if (!session?.thirdPartyUser) return 'User';
    const { firstName, surname, fullName } = session.thirdPartyUser;
    if (fullName) return fullName;
    if (firstName && surname) return `${firstName} ${surname}`;
    if (firstName) return firstName;
    return 'User';
  };

  const getAccessScopeDescription = (scope: string) => {
    switch (scope) {
      case 'client':
        return 'Client data and records';
      case 'staff':
        return 'Staff information and schedules';
      case 'both':
        return 'Client and staff data';
      default:
        return 'Limited data access';
    }
  };

  const getTimeRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Less than 1 hour remaining';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isExpiringSoon = session.accessExpiresAt && 
    new Date(session.accessExpiresAt).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

  const showClientTab = session.accessScope === 'client' || session.accessScope === 'both';
  const showStaffTab = session.accessScope === 'staff' || session.accessScope === 'both';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Med-Infinite</h1>
                <p className="text-sm text-muted-foreground">Third-Party Access Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Read-Only Access
              </Badge>
              <CustomButton
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </CustomButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Expiry Warning */}
        {isExpiringSoon && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">Access Expiring Soon</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Your access will expire in {getTimeRemaining(session.accessExpiresAt!)}. 
                  Please contact the branch administrator if you need extended access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome, {getUserDisplayName()}
          </h2>
          <p className="text-muted-foreground">
            You have been granted third-party access to view data from {session.branchInfo?.name || 'this branch'}.
          </p>
        </div>

        {/* Access Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branch</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.branchInfo?.name || 'N/A'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Access Scope</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{session.accessScope}</div>
              <p className="text-xs text-muted-foreground">
                {getAccessScopeDescription(session.accessScope)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Access Expires</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {session.accessExpiresAt 
                  ? new Date(session.accessExpiresAt).toLocaleDateString()
                  : 'Never'
                }
              </div>
              {session.accessExpiresAt && (
                <p className="text-xs text-muted-foreground">
                  {getTimeRemaining(session.accessExpiresAt)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Demo Data Section */}
        {session.accessScope === 'both' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Demo
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Staff Demo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="client">
              <ClientDemoView branchId={session.branchInfo?.id || ''} />
            </TabsContent>
            <TabsContent value="staff">
              <CarerDemoView branchId={session.branchInfo?.id || ''} />
            </TabsContent>
          </Tabs>
        ) : showClientTab ? (
          <ClientDemoView branchId={session.branchInfo?.id || ''} />
        ) : showStaffTab ? (
          <CarerDemoView branchId={session.branchInfo?.id || ''} />
        ) : null}

        {/* Security Notice */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Security & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Your access is logged and monitored for security and compliance purposes</p>
              <p>• You have read-only access - no data can be modified or deleted</p>
              <p>• Only access the specific data you need for your designated purpose</p>
              <p>• Do not share your access credentials or session with others</p>
              <p>• Report any security concerns to the branch administrator immediately</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThirdPartyWorkspace;
