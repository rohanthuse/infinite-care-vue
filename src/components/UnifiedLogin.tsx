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
      // First check organization_members (for admins)
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(slug)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (membership?.organizations?.slug) {
        console.log('Found organization membership:', membership.organizations.slug);
        return membership.organizations.slug;
      }

      // Then check staff table (for carers) - use separate queries to avoid join issues
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('id, branch_id, status')
        .eq('auth_user_id', userId)
        .eq('status', 'Active')
        .single();

      if (staffError && staffError.code !== 'PGRST116') {
        console.error('Error querying staff table:', staffError);
      }
      
      console.log('Staff query result:', { staffMember, staffError });

      if (staffMember?.branch_id) {
        const { data: staffBranch } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', staffMember.branch_id)
          .single();

        if (staffBranch?.organization_id) {
          const { data: staffOrg } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', staffBranch.organization_id)
            .single();

          if (staffOrg?.slug) {
            console.log('Found staff organization:', staffOrg.slug);
            return staffOrg.slug;
          }
        }
      }

      // Finally check clients table (for clients)
      const { data: clientMember } = await supabase
        .from('clients')
        .select('id, branch_id')
        .eq('auth_user_id', userId)
        .single();

      if (clientMember?.branch_id) {
        const { data: clientBranch } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', clientMember.branch_id)
          .single();

        if (clientBranch?.organization_id) {
          const { data: clientOrg } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', clientBranch.organization_id)
            .single();

          if (clientOrg?.slug) {
            console.log('Found client organization:', clientOrg.slug);
            return clientOrg.slug;
          }
        }
      }

      console.log('No organization found for user:', userId);
      return null;
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

      // Get user's highest priority role first
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

      // For super admins, prioritize organization dashboard access
      if (userRole === 'super_admin') {
        // Try to detect organization membership first
        const orgSlug = await detectUserOrganization(authData.user.id);
        
        if (orgSlug) {
          // Super admin with active organization membership - redirect to organization dashboard
          console.log('Super admin with active organization membership, redirecting to organization dashboard:', orgSlug);
          toast.success("Welcome back to your organization!");
          navigate(`/${orgSlug}/dashboard`);
          return;
        } else {
          // Super admin without active organization membership - redirect to system dashboard
          console.log('Super admin without active organization membership, redirecting to system dashboard');
          toast.success("Welcome back, System Administrator!");
          navigate('/system-dashboard');
          return;
        }
      }

      // For non-super admin users, detect organization membership
      const orgSlug = await detectUserOrganization(authData.user.id);

      if (!orgSlug) {
        toast.error("No organization access found for your account");
        await supabase.auth.signOut();
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
              <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="w-12 h-12" />
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