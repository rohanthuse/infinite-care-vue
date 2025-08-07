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
        
        // Check if user has branch admin role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "branch_admin")
          .single();

        if (roleError || !roleData) {
          console.error('[BranchAdminLogin] Role check error:', roleError);
          
          // Check if user is super admin instead
          const { data: superAdminRole, error: superAdminError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .eq("role", "super_admin")
            .single();

          if (superAdminError || !superAdminRole) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You don't have admin privileges.",
            });
            await supabase.auth.signOut();
            return;
          }
          
          // Super admin can access main dashboard
          console.log('[BranchAdminLogin] Super admin role confirmed');
          localStorage.setItem("userType", "super_admin");
          
          toast({
            title: "Login Successful",
            description: "Welcome back, Super Admin!",
          });
          
          navigate('/dashboard', { replace: true });
          return;
        }

        console.log('[BranchAdminLogin] Branch admin role confirmed');

        // Fetch the branch admin's assigned branches
        const { data: adminBranchData, error: branchError } = await supabase
          .from("admin_branches")
          .select(`
            branch_id,
            branches:branch_id (
              id,
              name,
              status
            )
          `)
          .eq("admin_id", data.user.id);

        if (branchError || !adminBranchData || adminBranchData.length === 0) {
          console.error('[BranchAdminLogin] Branch assignment error:', branchError);
          toast({
            variant: "destructive",
            title: "Access Error",
            description: "Unable to find your branch assignment. Please contact support.",
          });
          await supabase.auth.signOut();
          return;
        }

        console.log('[BranchAdminLogin] Branch assignments found:', adminBranchData);
        
        // Store branch information
        localStorage.setItem("userType", "branch_admin");
        
        // If admin has multiple branches, navigate to branch selection
        if (adminBranchData.length > 1) {
          const branchesData = adminBranchData.map(item => item.branches).filter(Boolean);
          localStorage.setItem("availableBranches", JSON.stringify(branchesData));
          
          toast({
            title: "Login Successful",
            description: "Please select your branch to continue.",
          });
          
          setTimeout(() => {
            navigate('/branch-selection', { replace: true });
          }, 1000);
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
        
        // Properly encode branch name for URL - handle special characters and spaces
        const encodedBranchName = encodeURIComponent(branch.name);
        
        console.log('[BranchAdminLogin] Navigating to branch dashboard:', {
          branchId: branch.id,
          branchName: branch.name,
          encodedBranchName
        });
        
        toast({
          title: "Login Successful",
          description: `Welcome back! Redirecting to ${branch.name}...`,
        });
        
        // Small delay to ensure toast shows before navigation
        setTimeout(() => {
          const targetPath = `/branch-dashboard/${branch.id}/${encodedBranchName}`;
          console.log('[BranchAdminLogin] Target path:', targetPath);
          navigate(targetPath, { replace: true });
        }, 1000);
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
    <div className="min-h-screen flex">
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
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Med-Infinite</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to your branch admin account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-3 block w-full border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
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
                className="text-sm text-gray-700 cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            {/* Sign In Button */}
            <CustomButton
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition duration-200 font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </CustomButton>

            {/* Contact Support */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Having trouble signing in?{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 font-medium"
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
                className="text-blue-600 hover:text-blue-800 flex items-center justify-center space-x-2"
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
