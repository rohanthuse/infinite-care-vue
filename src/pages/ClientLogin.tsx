
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useClientAuthFallback } from "@/hooks/useClientAuthFallback";
import { supabase } from "@/integrations/supabase/client";

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Try to get tenant from URL or fallback to default behavior
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(Boolean);
  const potentialTenant = pathParts.length > 0 ? pathParts[0] : null;
  
  const { signIn, loading, error, clearError } = useClientAuthFallback();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    console.log('[ClientLogin] Attempting login for:', email);
    
    const result = await signIn(email.trim().toLowerCase(), password);
    
    if (result.success) {
      console.log('[ClientLogin] Login successful, navigating to dashboard');
      
      // Check if we can determine the client's organization from the login result
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            branch_id,
            branches!inner(
              organization_id,
              organizations!branches_organization_id_fkey!inner(slug)
            )
          `)
          .eq('email', email.trim().toLowerCase())
          .single();
        
        if (clientData?.branches?.organizations?.slug) {
          const orgSlug = clientData.branches.organizations.slug;
          navigate(`/${orgSlug}/client-dashboard`);
          return;
        }
      } catch (error) {
        console.error('[ClientLogin] Error getting client organization:', error);
      }
      
      // Fallback - redirect to tenant selection or show error
      toast({
        title: "Organisation Not Found",
        description: "Please use your organisation's specific login page.",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address first",
      });
      return;
    }
    
    setResetLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email, 
          redirectTo: `${window.location.origin}/reset-password` 
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Email Sent",
        description: "Password reset link sent to your email. Please check your inbox.",
      });
    } catch (error: any) {
      console.error('[ClientLogin] Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-page-light min-h-screen flex">
      {/* Left section with gradient background */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-8 flex-col justify-center relative overflow-hidden">
        <div className="z-10 max-w-lg">
          <div className="flex items-center space-x-2 text-2xl font-semibold mb-6">
            <Heart className="h-7 w-7" />
            <span>Med-Infinite</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Client Portal
          </h1>
          
          <p className="text-xl font-light mb-4">
            Access your appointments and personal care plans
          </p>
          
          <p className="text-blue-100 mb-8 max-w-md">
            Monitor your care schedule, review your health records, and communicate with your care team securely through our comprehensive platform.
          </p>
        </div>

        {/* Wave pattern background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,800 C200,783.33 400,766.67 600,750 C800,733.33 1000,716.67 1200,700 L1200,1200 L0,1200 Z" fill="white" />
            <path d="M0,400 C200,383.33 400,366.67 600,350 C800,333.33 1000,316.67 1200,300 L1200,1200 L0,1200 Z" fill="white" opacity="0.5" />
            <path d="M0,600 C200,583.33 400,566.67 600,550 C800,533.33 1000,516.67 1200,500 L1200,1200 L0,1200 Z" fill="white" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* Right section with login form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Med-Infinite</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Client Portal Sign In</h3>
            <p className="text-gray-600">Access your appointments and care plans</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">Sign In Error</p>
                <p className="text-sm">{error}</p>
                {error.includes('Authentication system has been updated') && (
                  <p className="text-xs mt-2 text-green-600">
                    ✓ System has been updated and should work now. Please try again.
                  </p>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" 
                   className="text-sm font-medium text-blue-600 hover:text-blue-500"
                   onClick={handleForgotPassword}>
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            
            <div>
              <CustomButton
                type="submit"
                className={cn(
                  "w-full bg-blue-600 hover:bg-blue-700 transition-all",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                disabled={loading || !email || !password}
              >
                {loading ? "Signing in..." : "Sign In"}
              </CustomButton>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-600 mb-4">
              Having trouble signing in?{" "}
              <button 
                onClick={() => {
                  toast({
                    title: "Support Contact",
                    description: "Please contact your care administrator for assistance with your account.",
                  });
                }}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Contact Support
              </button>
            </div>
            <a href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Return to homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
