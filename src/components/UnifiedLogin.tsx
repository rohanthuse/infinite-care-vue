
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Heart } from 'lucide-react';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const UnifiedLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const loginStartTime = performance.now();

    try {
      console.log('[UnifiedLogin] Starting login process for:', email);
      
      // Step 1: Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        console.error('[UnifiedLogin] Auth error:', authError);
        setError('Invalid email or password. Please try again.');
        return;
      }

      if (!authData.user) {
        setError('Login failed. Please try again.');
        return;
      }

      const authTime = performance.now();
      console.log(`[UnifiedLogin] Auth completed in ${authTime - loginStartTime}ms`);

      // Step 2: Get user's primary organization slug with timeout
      console.log('[UnifiedLogin] Getting primary organization...');
      
      const { data: orgSlugData, error: orgError } = await Promise.race([
        supabase.rpc('get_user_primary_org_slug', { p_user_id: authData.user.id }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Organization lookup timeout')), 3000)
        )
      ]) as { data: string | null, error: any };

      const orgTime = performance.now();
      console.log(`[UnifiedLogin] Organization lookup completed in ${orgTime - authTime}ms`);

      if (orgError) {
        console.error('[UnifiedLogin] Organization lookup error:', orgError);
        // Fallback: Try manual query if RPC fails
        const { data: fallbackData } = await supabase
          .from('organization_members')
          .select(`
            organizations!inner(slug)
          `)
          .eq('user_id', authData.user.id)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackData?.organizations?.slug) {
          console.log('[UnifiedLogin] Using fallback organization:', fallbackData.organizations.slug);
          navigate(`/${fallbackData.organizations.slug}/dashboard`);
          return;
        }
      }

      // Step 3: Navigate based on organization
      if (orgSlugData) {
        console.log('[UnifiedLogin] Redirecting to organization dashboard:', orgSlugData);
        navigate(`/${orgSlugData}/dashboard`);
      } else {
        console.log('[UnifiedLogin] No organization found, redirecting to general dashboard');
        navigate('/dashboard');
      }

      const totalTime = performance.now();
      console.log(`[UnifiedLogin] Total login time: ${totalTime - loginStartTime}ms`);

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

    } catch (error: any) {
      console.error('[UnifiedLogin] Login error:', error);
      
      if (error.message === 'Organization lookup timeout') {
        // Even on timeout, user is authenticated, so redirect to a safe default
        console.log('[UnifiedLogin] Timeout occurred, redirecting to default dashboard');
        navigate('/dashboard');
        toast({
          title: "Login Successful",
          description: "Welcome back! Loading your dashboard...",
        });
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page-light min-h-screen flex">
      {/* Left section with gradient background */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-8 flex-col justify-center relative overflow-hidden">
        <div className="z-10 max-w-lg">
          <div className="flex items-center space-x-2 text-2xl font-semibold mb-6">
            <Heart className="h-7 w-7" />
            <span>Med-Infinite</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Welcome Back
          </h1>
          
          <p className="text-xl font-light mb-4">
            Your Healthcare Management Portal
          </p>
          
          <p className="text-blue-100 mb-8 max-w-md">
            Access your personalized dashboard to manage your healthcare services, appointments, and connect with your care team.
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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Sign In</h3>
            <p className="text-gray-600">Access your healthcare dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">Sign In Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  loading && "opacity-70 cursor-not-allowed"
                )}
                disabled={loading || !email.trim() || !password}
              >
                {loading ? "Signing in..." : "Sign In"}
              </CustomButton>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-600 mb-4">
              Need help signing in?{" "}
              <button 
                onClick={() => {
                  toast({
                    title: "Support Contact",
                    description: "Please contact your system administrator for assistance.",
                  });
                }}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Contact Support
              </button>
            </div>
            <a href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Return to homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
