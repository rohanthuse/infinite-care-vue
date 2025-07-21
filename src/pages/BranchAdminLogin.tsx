
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        return;
      }

      if (data.user) {
        // Check if user has branch admin role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "branch_admin")
          .single();

        if (roleData) {
          localStorage.setItem("userType", "branch_admin");
          navigate("/admin");
        } else {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have branch admin privileges.",
          });
          await supabase.auth.signOut();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Med-Infinite</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Branch Admin Portal Sign In
          </h2>
          <p className="text-gray-600">
            Access your branch management dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
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
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
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
                className="text-blue-600 hover:text-blue-800"
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
  );
};

export default BranchAdminLogin;
