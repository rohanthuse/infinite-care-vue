
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CarerInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitationValid, setInvitationValid] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link');
      navigate('/carer-login');
      return;
    }

    validateInvitation();
  }, [token, navigate]);

  const validateInvitation = async () => {
    if (!token) return;

    try {
      setValidating(true);
      console.log('[CarerInvitation] Validating token:', token);

      // Check if invitation exists and is valid
      const { data, error } = await supabase
        .from('carer_invitations')
        .select(`
          id,
          expires_at,
          used_at,
          staff:staff_id (
            id,
            first_name,
            last_name,
            email,
            branches:branch_id (
              name
            )
          )
        `)
        .eq('invitation_token', token)
        .single();

      if (error) {
        console.error('[CarerInvitation] Validation error:', error);
        toast.error('Invalid invitation link');
        navigate('/carer-login');
        return;
      }

      if (!data) {
        toast.error('Invitation not found');
        navigate('/carer-login');
        return;
      }

      if (data.used_at) {
        toast.error('This invitation has already been used');
        navigate('/carer-login');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error('This invitation has expired');
        navigate('/carer-login');
        return;
      }

      console.log('[CarerInvitation] Invitation is valid:', data);
      setInvitationData(data);
      setInvitationValid(true);
    } catch (error) {
      console.error('[CarerInvitation] Validation failed:', error);
      toast.error('Failed to validate invitation');
      navigate('/carer-login');
    } finally {
      setValidating(false);
    }
  };

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
      console.log('[CarerInvitation] Accepting invitation with token:', token);

      const { data, error } = await supabase.rpc('accept_carer_invitation' as any, {
        p_invitation_token: token,
        p_password: password
      });

      if (error) {
        console.error('[CarerInvitation] Accept invitation error:', error);
        throw error;
      }

      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          toast.success('Account created successfully! Please sign in with your credentials.');
          navigate('/carer-login');
        } else {
          toast.error((data as any).error || 'Failed to accept invitation');
        }
      } else {
        toast.success('Account created successfully! Please sign in with your credentials.');
        navigate('/carer-login');
      }
    } catch (error: any) {
      console.error('[CarerInvitation] Error accepting invitation:', error);
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-600 text-center">Invalid or expired invitation</p>
          </CardContent>
        </Card>
      </div>
    );
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
            <CardTitle className="text-2xl">Welcome to Your Team!</CardTitle>
          </div>
          <CardDescription>
            Hi {invitationData?.staff?.first_name}! Complete your account setup for {invitationData?.staff?.branches?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a secure password"
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
                  Setting up account...
                </>
              ) : (
                'Complete Account Setup'
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
