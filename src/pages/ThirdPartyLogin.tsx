
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ThirdPartyUser {
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
}

const ThirdPartyLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ThirdPartyUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid access link. Please use the link provided in your invitation email.');
      setIsLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_third_party_user_by_token', { token_param: token });

      if (error) {
        console.error('Token validation error:', error);
        setError('Invalid or expired access token. Please contact the administrator for a new invitation.');
        return;
      }

      if (!data || data.length === 0) {
        setError('Access token not found or has expired. Please contact the administrator for a new invitation.');
        return;
      }

      const userData = data[0] as ThirdPartyUser;
      setUser(userData);
      
    } catch (err) {
      console.error('Error validating token:', err);
      setError('An error occurred while validating your access. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!user || !token) return;

    try {
      setIsLoggingIn(true);

      // Create login session
      const { data: sessionData, error: sessionError } = await supabase
        .rpc('create_third_party_login_session', {
          token_param: token,
          user_id_param: user.user_id,
          ip_address_param: null, // Will be handled by the database function
          user_agent_param: navigator.userAgent
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        setError('Failed to create secure session. Please try again.');
        return;
      }

      // Store session information in localStorage for the dashboard
      localStorage.setItem('third_party_session', JSON.stringify({
        sessionId: sessionData,
        user: user,
        token: token,
        loginTime: new Date().toISOString()
      }));

      // Navigate to third-party dashboard
      navigate('/third-party-dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validating your access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-800">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button 
                onClick={() => window.close()} 
                variant="outline"
                className="w-full"
              >
                Close Window
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <CardTitle className="text-2xl text-gray-800">Welcome to Med-Infinite</CardTitle>
          <p className="text-gray-600 mt-2">Third-Party Access Portal</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Access Details
                </h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div><span className="font-medium">Name:</span> {user.first_name} {user.surname}</div>
                  <div><span className="font-medium">Email:</span> {user.email}</div>
                  {user.organisation && (
                    <div><span className="font-medium">Organisation:</span> {user.organisation}</div>
                  )}
                  {user.role && (
                    <div><span className="font-medium">Role:</span> {user.role}</div>
                  )}
                  <div><span className="font-medium">Access Type:</span> {user.access_type.charAt(0).toUpperCase() + user.access_type.slice(1)} data</div>
                  <div className="flex items-center">
                    <span className="font-medium">Access Expires:</span>
                    <span className="ml-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-orange-500" />
                      {new Date(user.access_expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Security Notice:</strong> Your access is monitored and logged for security purposes. 
                  Please only access the data you need for your specific purpose.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accessing System...
                  </>
                ) : (
                  'Access Med-Infinite System'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ThirdPartyLogin;
