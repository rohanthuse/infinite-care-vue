import { useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export const useClientNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useTenant();

  const createClientPath = (path: string) => {
    // Try to get tenant slug from context first
    let finalTenantSlug = tenantSlug;

    // Fallback 1: Extract from current URL if context doesn't have it
    if (!finalTenantSlug) {
      const pathParts = location.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && pathParts[0] !== 'client-dashboard') {
        finalTenantSlug = pathParts[0];
        console.log('[useClientNavigation] Extracted tenant from URL:', finalTenantSlug);
      }
    }

    // Fallback 2: Try localStorage for development
    if (!finalTenantSlug) {
      const isDev = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname.includes('preview');
      if (isDev) {
        finalTenantSlug = localStorage.getItem('dev-tenant') || undefined;
        if (finalTenantSlug) {
          console.log('[useClientNavigation] Using dev-tenant from localStorage:', finalTenantSlug);
        }
      }
    }

    console.log('[useClientNavigation] Creating path:', { finalTenantSlug, path });
    
    if (finalTenantSlug) {
      const fullPath = `/${finalTenantSlug}/client-dashboard${path}`;
      console.log('[useClientNavigation] Generated path:', fullPath);
      return fullPath;
    }
    
    console.warn('[useClientNavigation] No tenant slug found, returning non-tenant path');
    const fallbackPath = `/client-dashboard${path}`;
    return fallbackPath;
  };

  const navigateToClientPage = (path: string, state?: any) => {
    navigate(createClientPath(path), state ? { state } : undefined);
  };

  const getClientMenuItems = () => [
    { 
      name: "Dashboard", 
      path: createClientPath(""), 
      icon: "Home" 
    },
    { 
      name: "My Schedule", 
      path: createClientPath("/schedule"), 
      icon: "Calendar" 
    },
    { 
      name: "Appointments", 
      path: createClientPath("/appointments"), 
      icon: "Calendar" 
    },
    { 
      name: "Care Plans", 
      path: createClientPath("/care-plans"), 
      icon: "FileText" 
    },
    { 
      name: "My Forms", 
      path: createClientPath("/forms"), 
      icon: "FileText" 
    },
    { 
      name: "My Agreements", 
      path: createClientPath("/agreements"), 
      icon: "FileCheck" 
    },
    { 
      name: "Library", 
      path: createClientPath("/library"), 
      icon: "BookOpen" 
    },
    { 
      name: "Documents", 
      path: createClientPath("/documents"), 
      icon: "FolderOpen" 
    },
    { 
      name: "Messages", 
      path: createClientPath("/messages"), 
      icon: "MessageCircle" 
    },
    { 
      name: "Profile", 
      path: createClientPath("/profile"), 
      icon: "User" 
    }
  ];

  return {
    createClientPath,
    navigateToClientPage,
    getClientMenuItems,
    tenantSlug
  };
};