
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    console.log('[ClientLogin] Attempting login for:', email);
    
    try {
      // First, check if the client exists in our database
      const { data: clientData, error: clientCheckError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, status, temporary_password')
        .eq('email', email.trim().toLowerCase())
        .single();

      console.log('[ClientLogin] Client check result:', { clientData, clientCheckError });

      if (clientCheckError) {
        console.error('[ClientLogin] Client not found in database:', clientCheckError);
        setError("No client account found with this email address. Please contact support.");
        return;
      }

      if (!clientData) {
        setError("No client account found with this email address. Please contact support.");
        return;
      }

      // Fix case sensitivity issue with status check
      if (clientData.status?.toLowerCase() !== 'active') {
        console.error('[ClientLogin] Client account not active:', clientData.status);
        setError("Your account is not active. Please contact support.");
        return;
      }

      // Log temporary password info for debugging (remove in production)
      console.log('[ClientLogin] Client found with temp password set:', !!clientData.temporary_password);

      // Attempt to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      console.log('[ClientLogin] Auth attempt result:', { 
        user: authData?.user?.id, 
        error: authError?.message 
      });

      if (authError) {
        console.error('[ClientLogin] Authentication error:', authError);
        
        // Provide more specific error messages
        if (authError.message.includes('Invalid login credentials')) {
          // Check if this might be because auth account doesn't exist yet
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const authUserExists = authUsers?.users?.some(u => u.email === email.trim().toLowerCase());
          
          if (!authUserExists) {
            setError("Authentication account not created. Please contact support to activate your account.");
          } else {
            setError("Invalid email or password. Please check your credentials and try again.");
          }
        } else if (authError.message.includes('Email not confirmed')) {
          setError("Please check your email and click the confirmation link before signing in.");
        } else if (authError.message.includes('Too many requests')) {
          setError("Too many login attempts. Please wait a moment before trying again.");
        } else {
          setError(authError.message || "Login failed. Please try again.");
        }
        return;
      }

      if (authData.user) {
        console.log('[ClientLogin] Authentication successful for user:', authData.user.id);
        
        // Double-check client data with auth user ID
        const { data: finalClientData, error: finalClientError } = await supabase
          .from('clients')
          .select('id, first_name, last_name, status')
          .eq('email', email.trim().toLowerCase())
          .single();

        if (finalClientError || !finalClientData) {
          console.error('[ClientLogin] Final client check failed:', finalClientError);
          await supabase.auth.signOut();
          setError("Account verification failed. Please contact support.");
          return;
        }

        // Set user type in local storage for client dashboard
        localStorage.setItem("userType", "client");
        localStorage.setItem("clientName", finalClientData.first_name);
        localStorage.setItem("clientId", finalClientData.id);
        
        console.log('[ClientLogin] Login successful, navigating to dashboard');
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${finalClientData.first_name}!`,
        });
        
        // Navigate to the client dashboard
        navigate("/client-dashboard");
      }
    } catch (err) {
      console.error('[ClientLogin] Unexpected error:', err);
      setError("An unexpected error occurred. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex">
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
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
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
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
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
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </CustomButton>
            </div>
          </form>
          
          <div className="mt-6 text-center">
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
