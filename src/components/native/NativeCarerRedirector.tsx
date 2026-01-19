import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNativeAppMode } from '@/contexts/NativeAppContext';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Loader2 } from 'lucide-react';

/**
 * Native Carer App Redirector
 * 
 * Handles automatic redirection to carer login/dashboard when running
 * in the native Capacitor app. This ensures carers always land in
 * the right place without seeing admin/client options.
 */
export const NativeCarerRedirector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isNative, storedTenantSlug, setStoredTenantSlug } = useNativeAppMode();
  const { user, loading: authLoading } = useAuthSafe();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (!isNative) {
      setInitialCheckDone(true);
      return;
    }

    const handleNativeRedirect = async () => {
      console.log('[NativeCarerRedirector] Checking redirect:', {
        isNative,
        authLoading,
        hasUser: !!user,
        storedTenantSlug,
        currentPath: location.pathname
      });

      // Wait for auth to initialize
      if (authLoading) {
        return;
      }

      // If user is authenticated, determine their tenant and redirect
      if (user) {
        let tenantSlug = storedTenantSlug;

        // If no stored tenant, try to get it from user metadata or localStorage
        if (!tenantSlug) {
          try {
            // Try localStorage first (set during login)
            const devTenant = localStorage.getItem('dev-tenant');
            if (devTenant) {
              tenantSlug = devTenant;
              setStoredTenantSlug(tenantSlug);
            }
          } catch (err) {
            console.error('[NativeCarerRedirector] Failed to fetch carer tenant:', err);
          }
        }

        // Redirect to carer dashboard if we have a tenant
        if (tenantSlug) {
          const carerDashboardPath = `/${tenantSlug}/carer-dashboard`;
          
          // Only redirect if not already on carer routes
          if (!location.pathname.includes('/carer-dashboard')) {
            console.log('[NativeCarerRedirector] Redirecting to carer dashboard:', carerDashboardPath);
            setIsRedirecting(true);
            navigate(carerDashboardPath, { replace: true });
            return;
          }
        }
      } else {
        // Not authenticated - redirect to login if not already there
        const isOnLoginPage = location.pathname === '/login' || 
                              location.pathname.includes('/login') ||
                              location.pathname === '/';

        if (!isOnLoginPage) {
          console.log('[NativeCarerRedirector] Not authenticated, redirecting to login');
          setIsRedirecting(true);
          navigate('/login', { replace: true });
          return;
        }
      }

      setInitialCheckDone(true);
      setIsRedirecting(false);
    };

    handleNativeRedirect();
  }, [isNative, user, authLoading, storedTenantSlug, location.pathname, navigate, setStoredTenantSlug]);

  // Show loading screen during redirect in native mode
  if (isNative && (isRedirecting || !initialCheckDone)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-secondary/30 to-background">
        <div className="text-center space-y-6">
          {/* App Logo */}
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          
          {/* App Name */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Infinite Care</h1>
            <p className="text-muted-foreground mt-1">Carer App</p>
          </div>
          
          {/* Loading Indicator */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
