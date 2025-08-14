import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { LoadingScreen } from '@/components/LoadingScreen';

const TenantClientLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organization, tenantSlug, isLoading } = useTenant();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organization not loaded.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Verify user is a client and belongs to this organization
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          status,
          branch_id,
          branches!inner(organization_id)
        `)
        .eq('auth_user_id', authData.user.id)
        .eq('branches.organization_id', organization.id)
        .eq('status', 'active')
        .maybeSingle();

      if (clientError || !clientData) {
        await supabase.auth.signOut();
        toast({
          title: 'Access Denied',
          description: 'You don\'t have client access to this organization or your account is not active.',
          variant: 'destructive',
        });
        return;
      }

      // Success - redirect to client dashboard
      toast({
        title: 'Welcome!',
        description: `Welcome back, ${clientData.first_name}!`,
      });

      navigate(`/${tenantSlug}/client-dashboard`);
    } catch (error: any) {
      console.error('Client login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization Not Found</h1>
          <p className="text-gray-600 mb-4">
            The organization "{tenantSlug}" could not be found.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={`${organization.name} logo`}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <Users className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {organization.name}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Client Portal - Sign in to access your care dashboard
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <CustomButton
                type="submit"
                className="w-full"
                disabled={isSubmitting || !formData.email || !formData.password}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In to Client Portal'}
              </CustomButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help with your account?{' '}
                <a 
                  href="mailto:support@example.com" 
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Contact Support
                </a>
              </p>
            </div>
            
            <div className="mt-4 text-center space-y-2">
              <a 
                href={`/${tenantSlug}/login`}
                className="text-sm text-primary hover:text-primary/80 block"
              >
                Admin Login
              </a>
              <a 
                href="/" 
                className="text-sm text-gray-500 hover:text-gray-700 block"
              >
                ← Back to main site
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TenantClientLogin;