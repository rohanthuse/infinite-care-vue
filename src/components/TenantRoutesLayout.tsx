import React, { useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { TenantProvider } from '@/contexts/TenantContext';
import { TenantErrorWrapper } from '@/components/TenantErrorWrapper';

/**
 * Layout component for tenant-specific routes.
 * Uses Outlet pattern for proper nested route matching in React Router v6.
 */
export const TenantRoutesLayout: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  
  useEffect(() => {
    console.log('[TenantRoutesLayout] Rendering tenant routes:', {
      pathname: location.pathname,
      tenantSlug: params.tenantSlug,
      params
    });
  }, [location.pathname, params]);

  return (
    <TenantProvider>
      <TenantErrorWrapper>
        <Outlet />
      </TenantErrorWrapper>
    </TenantProvider>
  );
};
