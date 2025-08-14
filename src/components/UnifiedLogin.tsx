import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { motion } from "framer-motion";

const UnifiedLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const detectUserOrganization = async (userId: string) => {
    try {
      // Check organization membership
      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(slug)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !membership) {
        console.error('No organization membership found:', error);
        return null;
      }

      return membership.organizations?.slug;
    } catch (error) {
      console.error('Error detecting organization:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Detect user's organization
      const orgSlug = await detectUserOrganization(authData.user.id);

      if (!orgSlug) {
        toast.error("No organization access found for your account");
        await supabase.auth.signOut();
        return;
      }

      // Get user's highest priority role
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_highest_role', { p_user_id: authData.user.id })
        .single();

      if (roleError) {
        console.error('Role detection error:', roleError);
        toast.error("Unable to determine your access level. Please contact support.");
        return;
      }

      const userRole = roleData.role;
      console.log('User role detected:', userRole);

      // Route based on role
      if (userRole === 'super_admin') {
        console.log('Super admin detected, redirecting to system dashboard');
        toast.success("Welcome back, System Administrator!");
        navigate('/system-dashboard');
        return;
      }

      // Route to appropriate dashboard based on role
      let dashboardPath = `/${orgSlug}`;
      
      switch (userRole) {
        case 'branch_admin':
          dashboardPath += '/dashboard';
          toast.success("Welcome back, Branch Administrator!");
          break;
        case 'carer':
          dashboardPath += '/carer-dashboard';
          toast.success("Welcome back!");
          break;
        case 'client':
          dashboardPath += '/client-dashboard';
          toast.success("Welcome back!");
          break;
        default:
          // Fallback to admin dashboard
          dashboardPath += '/dashboard';
          toast.success("Login successful!");
          break;
      }

      console.log('Redirecting to:', dashboardPath);
      navigate(dashboardPath);

    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        toast.error("Invalid email or password");
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error("Please check your email and click the confirmation link");
      } else {
        toast.error(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50 p-4">
      {/* Background Elements */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-100/60 to-blue-300/20 top-[-100px] right-[-200px] blur-3xl" aria-hidden="true"></div>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-100/40 to-blue-200/30 bottom-[-200px] left-[-200px] blur-3xl" aria-hidden="true"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Med-Infinite Login
            </CardTitle>
            <CardDescription className="text-gray-600">
              Access your healthcare management platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full"
                  autoComplete="email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Need help? Contact{" "}
                <a href="mailto:support@med-infinite.com" className="text-blue-600 hover:text-blue-800 underline">
                  support@med-infinite.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UnifiedLogin;