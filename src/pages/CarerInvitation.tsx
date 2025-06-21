
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCarerAuth } from '@/hooks/useCarerAuth';
import { Loader2, Heart, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CarerInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { acceptInvitation } = useCarerAuth();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link');
      navigate('/carer-login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      const result = await acceptInvitation(token, password);
      
      if (result.success) {
        toast.success('Account created successfully! Please check your email to verify your account.');
        navigate('/carer-login');
      } else {
        toast.error(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">CarePortal</h1>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          </div>
          <CardDescription>
            Create your password to complete your carer account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-600">
                Must be at least 6 characters long
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/carer-login')}
              className="text-blue-600 hover:underline"
            >
              Sign in here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
