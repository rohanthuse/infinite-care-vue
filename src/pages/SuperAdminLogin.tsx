
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, User, AlertCircle } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const SuperAdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[300px] h-[300px] bg-blue-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-70" />
        <div className="absolute bottom-[10%] right-[15%] w-[250px] h-[250px] bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-70" />
      </div>
      
      <div className="max-w-md w-full mx-auto rounded-2xl overflow-hidden shadow-modern border border-gray-100">
        <div className="bg-blue-600 p-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <Shield className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold">Super Admin Access</h1>
          <p className="text-blue-100 mt-1">Secure authentication required</p>
        </div>
        
        <div className="bg-white p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10 bg-gray-50"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 bg-gray-50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <CustomButton
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Login"}
                </CustomButton>
              </div>
              
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>Only authorized personnel should attempt to access this area.</p>
                <a href="/" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                  Return to homepage
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
