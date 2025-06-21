
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Clock, 
  LogOut, 
  Users, 
  UserCheck, 
  AlertTriangle,
  Eye,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ThirdPartySession {
  sessionId: string;
  user: {
    user_id: string;
    email: string;
    first_name: string;
    surname: string;
    organisation?: string;
    role?: string;
    branch_id: string;
    access_type: 'client' | 'staff' | 'both';
    access_expires_at: string;
    is_active: boolean;
  };
  token: string;
  loginTime: string;
}

interface ClientData {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status?: string;
  created_at: string;
}

interface StaffData {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status?: string;
  hire_date?: string;
}

const ThirdPartyDashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<ThirdPartySession | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('third_party_session');
    if (!sessionData) {
      navigate('/third-party-login');
      return;
    }

    try {
      const parsedSession = JSON.parse(sessionData) as ThirdPartySession;
      
      // Check if session is still valid
      const now = new Date();
      const expiresAt = new Date(parsedSession.user.access_expires_at);
      const loginTime = new Date(parsedSession.loginTime);
      const sessionAge = now.getTime() - loginTime.getTime();
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

      if (expiresAt <= now || sessionAge > maxSessionAge) {
        localStorage.removeItem('third_party_session');
        navigate('/third-party-login');
        return;
      }

      setSession(parsedSession);
      loadData(parsedSession);
    } catch (err) {
      console.error('Invalid session data:', err);
      localStorage.removeItem('third_party_session');
      navigate('/third-party-login');
    }
  }, [navigate]);

  const loadData = async (sessionData: ThirdPartySession) => {
    try {
      setIsLoading(true);
      
      // Load data based on access type
      if (sessionData.user.access_type === 'client' || sessionData.user.access_type === 'both') {
        await loadClients(sessionData.user.branch_id);
      }
      
      if (sessionData.user.access_type === 'staff' || sessionData.user.access_type === 'both') {
        await loadStaff(sessionData.user.branch_id);
      }

      // Log access activity
      await logAccess('dashboard_view', sessionData);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please contact support if this issue persists.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async (branchId: string) => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, status, created_at')
      .eq('branch_id', branchId)
      .limit(50); // Limit for performance

    if (error) {
      console.error('Error loading clients:', error);
      return;
    }

    setClients(data || []);
  };

  const loadStaff = async (branchId: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, first_name, last_name, email, phone, status, hire_date')
      .eq('branch_id', branchId)
      .limit(50); // Limit for performance

    if (error) {
      console.error('Error loading staff:', error);
      return;
    }

    setStaff(data || []);
  };

  const logAccess = async (action: string, sessionData: ThirdPartySession, resourceId?: string) => {
    try {
      await supabase
        .from('third_party_access_logs')
        .insert({
          third_party_user_id: sessionData.user.user_id,
          session_id: sessionData.sessionId,
          action: action,
          resource_type: resourceId ? 'record' : 'dashboard',
          resource_id: resourceId || null,
          ip_address: null, // Will be handled by database
          user_agent: navigator.userAgent
        });
    } catch (err) {
      console.error('Failed to log access:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('third_party_session');
    navigate('/third-party-login');
  };

  const getTimeRemaining = () => {
    if (!session) return '';
    
    const now = new Date();
    const expiresAt = new Date(session.user.access_expires_at);
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" />
                Med-Infinite - Third Party Access
              </h1>
              <p className="text-gray-600">Welcome, {session.user.first_name} {session.user.surname}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {getTimeRemaining()}
              </Badge>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Access Information */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Secure Access Active:</strong> You have {session.user.access_type} data access. 
            All activities are logged for security purposes. Access expires on{' '}
            {new Date(session.user.access_expires_at).toLocaleDateString()}.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Data Access Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clients Data */}
          {(session.user.access_type === 'client' || session.user.access_type === 'both') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Client Data ({clients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clients.map((client) => (
                    <div key={client.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{client.first_name} {client.last_name}</h4>
                          {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
                          {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
                        </div>
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.status || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Registered: {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {clients.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No client data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Data */}
          {(session.user.access_type === 'staff' || session.user.access_type === 'both') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-green-600" />
                  Staff Data ({staff.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {staff.map((member) => (
                    <div key={member.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{member.first_name} {member.last_name}</h4>
                          {member.email && <p className="text-sm text-gray-600">{member.email}</p>}
                          {member.phone && <p className="text-sm text-gray-600">{member.phone}</p>}
                        </div>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status || 'Unknown'}
                        </Badge>
                      </div>
                      {member.hire_date && (
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Hired: {new Date(member.hire_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                  {staff.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No staff data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Session Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2 text-gray-600" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Login Time:</span> {new Date(session.loginTime).toLocaleString()}</div>
              <div><span className="font-medium">Access Type:</span> {session.user.access_type.charAt(0).toUpperCase() + session.user.access_type.slice(1)} data</div>
              {session.user.organisation && (
                <div><span className="font-medium">Organisation:</span> {session.user.organisation}</div>
              )}
              {session.user.role && (
                <div><span className="font-medium">Role:</span> {session.user.role}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThirdPartyDashboard;
