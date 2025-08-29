
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Lock, AlertCircle, Eye, EyeOff, Mail, X, LogOut, ArrowRight, Clock } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { CarerAuthDebugPanel } from "@/components/carers/CarerAuthDebugPanel";
import { SessionRecoveryPanel } from "@/components/auth/SessionRecoveryPanel";
import { diagnoseAuthIssue } from "@/utils/authFixHelper";
import { validatePreLoginState, verifyLoginSuccess } from "@/utils/authRecovery";

export default function CarerLoginSafe() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [authStatus, setAuthStatus] = useState<'idle' | 'checking' | 'signing-in' | 'verifying' | 'complete'>('idle');
  const navigate = useNavigate();
  
  const { signIn, signOut, loading, isAuthenticated, error, clearError, carerProfile } = useCarerAuthSafe();

  // Clear any previous errors when component mounts or when user starts typing
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (email || password) {
      clearError();
    }
  }, [email, password, clearError]);

  // Auto-show recovery panel after failed attempts
  useEffect(() => {
    if (loginAttempts >= 2) {
      setShowRecovery(true);
    }
  }, [loginAttempts]);

  // Show recovery panel if loading takes too long
  useEffect(() => {
    if (loading && authStatus === 'signing-in') {
      const timer = setTimeout(() => {
        if (loading) {
          console.log('[CarerLoginSafe] Login taking too long, showing recovery options');
          setShowRecovery(true);
        }
      }, 8000); // Show after 8 seconds

      return () => clearTimeout(timer);
    }
  }, [loading, authStatus]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setAuthStatus('checking');

    // Clear any existing dev-tenant to avoid conflicts
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('preview')) {
      localStorage.removeItem('dev-tenant');
    }
    
    if (!email || !password) {
      setAuthStatus('idle');
      return;
    }

    try {
      // Pre-login validation
      console.log('[CarerLoginSafe] Running pre-login validation...');
      const preLoginState = await validatePreLoginState();
      console.log('[CarerLoginSafe] Pre-login state:', preLoginState);

      if (preLoginState.needsRecovery) {
        console.log('[CarerLoginSafe] Recovery needed before login');
        setShowRecovery(true);
        setAuthStatus('idle');
        return;
      }

      setAuthStatus('signing-in');

      // Diagnose auth issues before attempting login
      const diagnosis = await diagnoseAuthIssue(email);
      console.log('[CarerLoginSafe] Diagnosis result:', diagnosis);

      const result = await signIn(email, password);
      
      if (result.success) {
        setAuthStatus('verifying');
        
        // Verify the login was successful
        const verification = await verifyLoginSuccess(result.user?.id);
        console.log('[CarerLoginSafe] Login verification:', verification);
        
        if (verification.verified) {
          setAuthStatus('complete');
          setLoginAttempts(0); // Reset on success
        } else {
          console.error('[CarerLoginSafe] Login verification failed:', verification.issues);
          setShowRecovery(true);
          setAuthStatus('idle');
        }
      } else {
        console.error('[CarerLoginSafe] Login failed:', result.error);
        setLoginAttempts(prev => prev + 1);
        setAuthStatus('idle');
      }
    } catch (error) {
      console.error('[CarerLoginSafe] Login process error:', error);
      setLoginAttempts(prev => prev + 1);
      setAuthStatus('idle');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleContinueToDashboard = () => {
    navigate('/carer-dashboard');
  };

  const handleSignOut = async () => {
    console.log('[CarerLoginSafe] Sign out button clicked');
    setAuthStatus('checking');
    try {
      await signOut();
      clearError();
      setEmail("");
      setPassword("");
      setLoginAttempts(0);
      setShowRecovery(false);
      console.log('[CarerLoginSafe] Sign out completed');
    } catch (error) {
      console.error('[CarerLoginSafe] Sign out error:', error);
      // Force clear form and navigate
      clearError();
      setEmail("");
      setPassword("");
      setLoginAttempts(0);
      setShowRecovery(false);
      window.location.replace('/');
    } finally {
      setAuthStatus('idle');
    }
  };

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    setLoginAttempts(0);
    setAuthStatus('idle');
    clearError();
  };

  const getAuthStatusMessage = () => {
    switch (authStatus) {
      case 'checking': return 'Checking session...';
      case 'signing-in': return 'Signing in...';
      case 'verifying': return 'Verifying login...';
      case 'complete': return 'Login successful!';
      default: return null;
    }
  };

  // If user is already authenticated, show different options
  if (isAuthenticated && carerProfile) {
    return (
      <div className="min-h-screen flex">
        {/* Left section with gradient background */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-8 flex-col justify-center relative overflow-hidden">
          <div className="z-10 max-w-lg">
            <div className="flex items-center space-x-2 text-2xl font-semibold mb-6">
              <Heart className="h-7 w-7" />
              <span>CarePortal</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Welcome Back!
            </h1>
            
            <p className="text-xl font-light mb-4">
              You're already signed in
            </p>
            
            <p className="text-blue-100 mb-8 max-w-md">
              Choose to continue to your dashboard or sign out to use different credentials.
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

        {/* Right section with authenticated user options */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="text-center md:text-left mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">CarePortal</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Already Signed In</h3>
              <p className="text-gray-600">Hello, {carerProfile.first_name}!</p>
            </div>

            <div className="space-y-4">
              <CustomButton
                onClick={handleContinueToDashboard}
                className="w-full bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-5 w-5" />
                Continue to Dashboard
              </CustomButton>

              <CustomButton
                onClick={handleSignOut}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </CustomButton>
            </div>
            
            <div className="mt-8 text-center">
              <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Return to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left section with gradient background */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-8 flex-col justify-center relative overflow-hidden">
        <div className="z-10 max-w-lg">
          <div className="flex items-center space-x-2 text-2xl font-semibold mb-6">
            <Heart className="h-7 w-7" />
            <span>CarePortal</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Welcome to CarePortal
          </h1>
          
          <p className="text-xl font-light mb-4">
            Your Gateway to Compassionate Care
          </p>
          
          <p className="text-blue-100 mb-8 max-w-md">
            Access your personalized dashboard to manage client care, track appointments, complete assessments, and deliver exceptional healthcare services.
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
          {/* Debug panel for development */}
          <CarerAuthDebugPanel />
          
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">CarePortal</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Sign in</h3>
            <p className="text-gray-600">to continue to your care dashboard</p>
          </div>

          {/* Auth Status Indicator */}
          {authStatus !== 'idle' && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-2">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>{getAuthStatusMessage()}</span>
            </div>
          )}

          {/* Session Recovery Panel */}
          {showRecovery && (
            <SessionRecoveryPanel 
              onRecoverySuccess={handleRecoverySuccess}
              showAdvanced={loginAttempts >= 3}
            />
          )}

          {/* Show recovery button if not already showing and has attempts */}
          {!showRecovery && loginAttempts > 0 && (
            <div className="mb-6">
              <CustomButton
                onClick={() => setShowRecovery(true)}
                variant="outline"
                size="sm"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                Having trouble? Try recovery options
              </CustomButton>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                className="ml-2 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
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
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
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
                disabled={loading}
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
                  (loading || authStatus !== 'idle') && "opacity-70 cursor-not-allowed"
                )}
                disabled={loading || authStatus !== 'idle' || !email || !password}
              >
                {loading || authStatus !== 'idle' ? (getAuthStatusMessage() || "Processing...") : "Sign In"}
              </CustomButton>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Have an invitation?{" "}
              <Link to="/carer-invitation" className="font-medium text-blue-600 hover:text-blue-500">
                Accept it here
              </Link>
            </p>
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
