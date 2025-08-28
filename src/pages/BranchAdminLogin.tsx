import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Shield, User, Lock, Heart } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const BranchAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Clear any existing dev-tenant to avoid conflicts
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('preview')) {
      localStorage.removeItem('dev-tenant');
    }

    try {
      console.log('[BranchAdminLogin] Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[BranchAdminLogin] Login error:', error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        return;
      }

      if (data.user) {
        console.log('[BranchAdminLogin] User authenticated:', data.user.id);
        
        // Optimize: Fetch branch assignments with organization info in a single query
        // This prioritizes branch assignment over role checks for faster authentication
        const branchAssignmentPromise = supabase
          .from("admin_branches")
          .select(`
            branch_id,
            branches:branch_id (
              id,
              name,
              status,
              organization_id,
              organizations:organization_id (
                id,
                name,
                slug
              )
            )
          `)
          .eq("admin_id", data.user.id);

        // Also check roles in parallel with timeout
        const roleCheckPromise = supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .in("role", ["branch_admin", "super_admin"]);

        // Use Promise.allSettled with timeout to avoid hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 6000)
        );

        try {
          const results = await Promise.allSettled([
            Promise.race([branchAssignmentPromise, timeoutPromise]),
            Promise.race([roleCheckPromise, timeoutPromise])
          ]);

          const [branchResult, roleResult] = results;
          
          // Process branch assignment result
          let adminBranchData = null;
          let organizationSlug = null;
          
          if (branchResult.status === 'fulfilled') {
            const { data: branchData, error: branchError } = branchResult.value as any;
            if (!branchError && branchData && branchData.length > 0) {
              adminBranchData = branchData;
              // Get organization slug from the first branch
              const firstBranch = branchData[0]?.branches;
              if (firstBranch?.organizations?.slug) {
                organizationSlug = firstBranch.organizations.slug;
                console.log('[BranchAdminLogin] Found organization slug:', organizationSlug);
              }
            }
          }

          // Process role result
          let hasAdminRole = false;
          let userRole = null;
          
          if (roleResult.status === 'fulfilled') {
            const { data: roleData, error: roleError } = roleResult.value as any;
            if (!roleError && roleData && roleData.length > 0) {
              const roles = roleData.map((r: any) => r.role);
              hasAdminRole = roles.includes('branch_admin') || roles.includes('super_admin');
              userRole = roles.includes('super_admin') ? 'super_admin' : 
                        roles.includes('branch_admin') ? 'branch_admin' : null;
            }
          }

          // Check if user has admin privileges
          if (!hasAdminRole) {
            console.error('[BranchAdminLogin] User does not have admin privileges');
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You don't have admin privileges.",
            });
            await supabase.auth.signOut();
            return;
          }

          // Handle super admin case
          if (userRole === 'super_admin' && (!adminBranchData || adminBranchData.length === 0)) {
            console.log('[BranchAdminLogin] Super admin with no branch assignments');
            localStorage.setItem("userType", "super_admin");
            
            toast({
              title: "Login Successful",
              description: "Welcome back, Super Admin!",
            });
            
            navigate('/dashboard', { replace: true });
            return;
          }

          // Validate branch assignments
          if (!adminBranchData || adminBranchData.length === 0) {
            console.error('[BranchAdminLogin] No branch assignments found');
            toast({
              variant: "destructive",
              title: "Access Error",
              description: "Unable to find your branch assignment. Please contact support.",
            });
            await supabase.auth.signOut();
            return;
          }

          console.log('[BranchAdminLogin] Branch assignments found:', adminBranchData);
          
          // Store user type and organization info
          localStorage.setItem("userType", userRole || "branch_admin");
          
          // Set dev tenant with real organization slug in development
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('preview')) {
            if (organizationSlug) {
              localStorage.setItem('dev-tenant', organizationSlug);
              console.log('[BranchAdminLogin] Set dev-tenant to:', organizationSlug);
            } else {
              // Fallback to default if organization slug not found
              localStorage.setItem('dev-tenant', 'demo');
              console.log('[BranchAdminLogin] Fallback: Set dev-tenant to demo');
            }
          }
          
          // Handle multiple branches
          if (adminBranchData.length > 1) {
            const branchesData = adminBranchData.map(item => item.branches).filter(Boolean);
            localStorage.setItem("availableBranches", JSON.stringify(branchesData));
            
            toast({
              title: "Login Successful",
              description: "Please select your branch to continue.",
            });
            
            setTimeout(() => {
              navigate('/branch-selection', { replace: true });
            }, 500);
            return;
          }

          // Single branch assignment - proceed directly
          const branch = adminBranchData[0].branches;
          if (!branch) {
            toast({
              variant: "destructive",
              title: "Access Error",
              description: "Branch information is incomplete. Please contact support.",
            });
            await supabase.auth.signOut();
            return;
          }
          
          localStorage.setItem("currentBranchId", branch.id);
          localStorage.setItem("currentBranchName", branch.name);
          
          // Navigate using organization slug if available
          const targetPath = organizationSlug 
            ? `/${organizationSlug}/branch-dashboard/${branch.id}/${encodeURIComponent(branch.name)}`
            : `/branch-dashboard/${branch.id}/${encodeURIComponent(branch.name)}`;
          
          console.log('[BranchAdminLogin] Navigating to:', targetPath);
          
          toast({
            title: "Login Successful",
            description: `Welcome back! Redirecting to ${branch.name}...`,
          });
          
          setTimeout(() => {
            navigate(targetPath, { replace: true });
          }, 500);

        } catch (queryError) {
          console.error('[BranchAdminLogin] Query error or timeout:', queryError);
          toast({
            variant: "destructive",
            title: "Login Error",
            description: "Authentication took too long. Please try again.",
          });
          await supabase.auth.signOut();
          return;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-light min-h-screen flex">
      {/* Left Side - Blue Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 relative overflow-hidden">
        {/* Wave Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
            <path d="M0,150 C100,100 200,200 400,150 L400,300 L0,300 Z" fill="white" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <Heart className="h-10 w-10 text-white" />
            <span className="text-3xl font-bold">Med-Infinite</span>
          </div>
          
          {/* Main Content */}
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Branch Admin Portal
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Access your branch management dashboard
          </p>
          <p className="text-lg text-blue-100 leading-relaxed">
            Manage your branch operations, oversee staff schedules, monitor client care, 
            and access comprehensive reports to ensure the highest quality of care delivery.
          </p>
          
          {/* Features List */}
          <ul className="mt-8 space-y-3 text-blue-100">
            <li className="flex items-center">
              <Shield className="h-5 w-5 mr-3" />
              Staff Management & Scheduling
            </li>
            <li className="flex items-center">
              <Shield className="h-5 w-5 mr-3" />
              Client Care Oversight
            </li>
            <li className="flex items-center">
              <Shield className="h-5 w-5 mr-3" />
              Comprehensive Reporting
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-muted px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Med-Infinite</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to your branch admin account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-3 block w-full border border-border rounded-md py-2"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <a
                  href="#"
                  className="text-sm text-primary hover:text-primary/80"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full border border-border rounded-md py-2"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label
                htmlFor="remember"
                className="text-sm text-foreground cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            {/* Sign In Button */}
            <CustomButton
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-md transition duration-200 font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </CustomButton>

            {/* Contact Support */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Having trouble signing in?{" "}
                <a
                  href="#"
                  className="text-primary hover:text-primary/80 font-medium"
                  onClick={(e) => e.preventDefault()}
                >
                  Contact Support
                </a>
              </p>
            </div>

            {/* Return to Homepage */}
            <div className="text-center pt-4">
              <CustomButton
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-primary hover:text-primary/80 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to homepage</span>
              </CustomButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BranchAdminLogin;
