
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";

export const RequireCarerAuth = () => {
  const { isAuthenticated, loading } = useCarerAuthSafe();
  const { tenantSlug } = useCarerNavigation();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = tenantSlug ? `/${tenantSlug}/carer-login` : "/carer-login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <Outlet />;
};
