import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, Eye, EyeOff, AlertCircle, X, Shield } from 'lucide-react';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SystemLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, signIn, isLoading, error } = useSystemAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('[SystemLogin] User already authenticated, redirecting to dashboard');
      navigate('/system-dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[SystemLogin] Attempting login for:', email);
    const result = await signIn(email, password);
    
    if (!result.error) {
      // Always force Light Mode on login (regardless of previous preference)
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      console.log('[SYSTEM_LOGIN] Forced Light Mode on login');
      
      toast.success('Successfully signed in!');
      console.log('[SystemLogin] Login successful, navigating to dashboard');
      navigate('/system-dashboard', { replace: true });
    } else {
      console.error('[SystemLogin] Login failed:', result.error);
      toast.error(result.error);
    }
  };

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="login-page-light min-h-screen flex">
      {/* Left section with gradient background */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 flex-col justify-center relative overflow-hidden">
        <div className="z-10 max-w-lg">
          <div className="flex items-center space-x-2 text-2xl font-semibold mb-6">
            <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-7 w-7" />
            <div className="flex flex-col">
              <span className="text-xl font-bold">MED-INFINITE</span>
              <span className="text-xs text-gray-300 -mt-1">ENDLESS CARE</span>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            System Administration
          </h1>
          
          <p className="text-xl font-light mb-4">
            Secure Access to System Management
          </p>
          
          <p className="text-slate-300 mb-8 max-w-md">
            Manage tenants, users, system configuration, and monitor platform health from this secure administrative portal.
          </p>
        </div>

        {/* Abstract pattern background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Right section with login form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">MED-INFINITE System Portal</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Administrator Sign In</h3>
            <p className="text-gray-600">Access system management tools</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{error}</span>
              </div>
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
                  placeholder="admin@system.local"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <CustomButton
                type="submit"
                className={cn(
                  "w-full bg-slate-800 hover:bg-slate-900 transition-all",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
                disabled={isLoading || !email || !password}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </CustomButton>
            </div>
          </form>
          
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1 font-medium">Demo Credentials:</p>
            <p className="text-xs text-gray-500 font-mono">admin@system.local</p>
            <p className="text-xs text-gray-500 font-mono">admin123</p>
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              ← Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}