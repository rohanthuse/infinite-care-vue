
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, User, AlertCircle, Eye, EyeOff, Heart } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SuperAdminLogin = () => {
  const [username, setUsername] = useState("");
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
    
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    
    try {
      // This is where you would normally integrate with your authentication system
      // For now, we'll simulate a login with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Normally we'd check credentials against a secure backend
      // This is just a placeholder - REPLACE with actual authentication logic
      if (username === "superadmin" && password === "password123") {
        toast({
          title: "Login successful",
          description: "Welcome back, Super Admin!",
        });
        navigate("/dashboard"); // Navigate to dashboard or admin panel
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left section with image and welcome text */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-8 flex flex-col relative overflow-hidden">
        {/* Wave pattern background */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src="/lovable-uploads/5b9a76b7-b6ff-4f96-ad2f-53a109a095be.png" 
            alt="Wave pattern" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="z-10 mt-12 md:mt-20 mb-8">
          <div className="flex items-center space-x-2 text-2xl font-semibold mb-4">
            <Heart className="h-7 w-7" />
            <span>Med-Infinite</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Welcome to Med-Infinite
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 font-light">
            Your Gateway to Effortless Management.
          </p>
          
          <p className="max-w-md text-blue-100 mb-8">
            Streamline healthcare administration, improve patient care, and enhance operational efficiency with our comprehensive platform.
          </p>
        </div>

        <div className="mt-auto z-10 hidden md:block mb-12">
          <div className="rounded-xl overflow-hidden max-w-sm">
            <img 
              src="/lovable-uploads/5b9a76b7-b6ff-4f96-ad2f-53a109a095be.png" 
              alt="Healthcare professional with patient" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* Right section with login form */}
      <div className="md:w-1/2 bg-white p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Med-Infinite</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Sign in</h3>
            <p className="text-gray-600">to continue to Med-Infinite</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Create account
              </a>
            </p>
          </div>
          
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

export default SuperAdminLogin;
