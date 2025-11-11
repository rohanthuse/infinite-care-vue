import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Heart, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      // First, check if Supabase has set the session from the hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      console.log('[ResetPassword] Checking for session/token:', { 
        hasAccessToken: !!accessToken, 
        type,
        hasHash: !!window.location.hash
      });

      // If we have tokens in the hash, set the session explicitly
      if (accessToken && type === 'recovery') {
        console.log('[ResetPassword] Found recovery tokens in hash, setting session');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) {
          console.error('[ResetPassword] Session error:', error);
          toast.error("Invalid or expired reset link. Please request a new one.", {
            duration: 5000,
            action: {
              label: "Request New Link",
              onClick: () => navigate('/login')
            }
          });
          setTimeout(() => navigate('/login'), 5000);
          return;
        }
      }

      // Now check if we have a valid session (either from hash or existing)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[ResetPassword] Session check:', { 
        hasSession: !!session, 
        error: sessionError 
      });

      if (session) {
        // Valid session exists, allow password reset
        console.log('[ResetPassword] Valid session found, allowing password reset');
        setIsValidToken(true);
      } else {
        // No valid session
        console.error('[ResetPassword] No valid session found');
        toast.error("Invalid or expired reset link. Please request a new password reset.", {
          duration: 5000,
          action: {
            label: "Go to Login",
            onClick: () => navigate('/login')
          }
        });
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    checkToken();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ResetPassword] Auth state changed:', event);
      if (event === 'TOKEN_REFRESHED') {
        setIsValidToken(true);
      } else if (event === 'SIGNED_OUT') {
        toast.error("Session expired. Please request a new reset link.");
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }
    if (!/[A-Z]/.test(pwd)) {
      toast.error("Password must contain at least one uppercase letter");
      return false;
    }
    if (!/[a-z]/.test(pwd)) {
      toast.error("Password must contain at least one lowercase letter");
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      toast.error("Password must contain at least one number");
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('[ResetPassword] Updating password');
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('[ResetPassword] Update error:', error);
        throw error;
      }

      console.log('[ResetPassword] Password updated successfully');
      toast.success("Password reset successfully! Redirecting to login...");

      // Sign out the user after password reset
      await supabase.auth.signOut();

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      console.error('[ResetPassword] Error:', error);
      if (error.message?.includes('session') || error.message?.includes('token') || error.message?.includes('expired')) {
        toast.error("Your reset link has expired. Please request a new one.", {
          duration: 5000,
          action: {
            label: "Request New Link",
            onClick: () => navigate('/login')
          }
        });
        setTimeout(() => navigate('/login'), 5000);
      } else {
        toast.error(error.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

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
            Reset Your Password
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Create a strong, secure password for your account
          </p>
          <p className="text-lg text-blue-100 leading-relaxed">
            Your password should be unique and contain a mix of uppercase, lowercase, 
            numbers for maximum security.
          </p>
          
          {/* Security Tips */}
          <ul className="mt-8 space-y-3 text-blue-100">
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-3" />
              At least 8 characters long
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-3" />
              Include uppercase and lowercase letters
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-3" />
              Include at least one number
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-muted px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Med-Infinite</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Create New Password
            </h2>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                New Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full border border-border rounded-md py-2"
                  placeholder="Enter new password"
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

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm New Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full border border-border rounded-md py-2"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-2">
                Password Requirements:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Minimum 8 characters
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  At least one uppercase letter
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  At least one lowercase letter
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  At least one number
                </li>
              </ul>
            </div>

            {/* Reset Button */}
            <CustomButton
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-md transition duration-200 font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </CustomButton>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
