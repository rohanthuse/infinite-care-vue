
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCarerAuth } from "@/hooks/useCarerAuth";

const CarerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, loading } = useCarerAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    console.log('[CarerLogin] Attempting login with:', email);
    
    try {
      const result = await signIn(email, password);
      
      if (result?.success && result.user && result.staff) {
        console.log('[CarerLogin] Login successful for carer:', result.staff);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${result.staff.first_name}!`,
        });
        
        // Navigate to the carer dashboard after successful login
        navigate("/carer-dashboard");
      } else if (result?.error) {
        toast({
          title: "Login failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[CarerLogin] Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login. Please try again.",
        variant: "destructive",
      });
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
            Carer Portal
          </h1>
          
          <p className="text-xl font-light mb-4">
            Access your schedule and care plans
          </p>
          
          <p className="text-blue-100 mb-8 max-w-md">
            Manage your daily tasks, view client information, and record care activities efficiently with our comprehensive platform.
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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Carer Sign In</h3>
            <p className="text-gray-600">Access your schedule and care plans</p>
          </div>
          
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
                  loading && "opacity-70 cursor-not-allowed"
                )}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
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

export default CarerLogin;
