import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CustomButton } from '@/components/ui/CustomButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Clock, 
  Building, 
  User, 
  Eye, 
  LogOut, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ThirdPartySession {
  sessionToken: string;
  thirdPartyUser: any;
  branchInfo: any;
  accessScope: string;
  accessExpiresAt?: string;
}

const ThirdPartyWorkspace = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<ThirdPartySession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = () => {
    try {
      const sessionData = localStorage.getItem('thirdPartySession');
      if (!sessionData) {
        toast.error('No active third-party session found');
        navigate('/login');
        return;
      }

      const parsedSession = JSON.parse(sessionData);
      
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
    } catch (error) {
      console.error('Error loading third-party session:', error);
      toast.error('Invalid session data');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear third-party session
      localStorage.removeItem('thirdPartySession');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  const isExpiringSoon = session.accessExpiresAt && 
    new Date(session.accessExpiresAt).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // 24 hours

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Med-Infinite</h1>
                <p className="text-sm text-gray-500">Third-Party Access Portal</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {session.thirdPartyUser.first_name} {session.thirdPartyUser.last_name}
          </h2>
          <p className="text-gray-600">
            You have been granted third-party access to view data from {session.branchInfo.name}.
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
              <div className="text-2xl font-bold">{session.branchInfo.name}</div>
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

        {/* Data Access Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Available Data Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Data Access Coming Soon
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  The data viewing interface is currently being prepared. You will be able to access 
                  {' '}{getAccessScopeDescription(session.accessScope).toLowerCase()}{' '}
                  once the interface is ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Security & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
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