import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Shield, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SystemLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, error } = useSystemAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/system-dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signIn(email, password);
      if (result.error) {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome to the system administration portal",
        });
        navigate('/system-dashboard');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative flex min-h-screen">
        {/* Left Column - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12">
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">System Portal</h1>
                <p className="text-slate-300">Admin Control Center</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Settings className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Platform Management</h3>
                  <p className="text-slate-300">
                    Manage tenant organizations, system users, and platform-wide settings from a centralized dashboard.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Enhanced Security</h3>
                  <p className="text-slate-300">
                    Advanced authentication, role-based access control, and comprehensive audit logging.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground">System Administration</h2>
                <p className="text-muted-foreground mt-2">
                  Secure access to platform management
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@system.local"
                    required
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50 border-border/50"
                  />
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <CustomButton
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Authenticating...' : 'Access System Portal'}
                </CustomButton>
              </form>

              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="text-center">
                  <button
                    onClick={() => navigate('/')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to Main Portal
                  </button>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center mb-2">Demo Credentials:</p>
                <div className="text-xs text-center space-y-1">
                  <p><strong>Email:</strong> admin@system.local</p>
                  <p><strong>Password:</strong> admin123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}