import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export const useClientNavigation = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  const createClientPath = (path: string) => {
    console.log('[useClientNavigation] Creating path:', { tenantSlug, path });
    if (tenantSlug) {
      const fullPath = `/${tenantSlug}/client-dashboard${path}`;
      console.log('[useClientNavigation] Generated path:', fullPath);
      return fullPath;
    }
    const fallbackPath = `/client-dashboard${path}`;
    console.log('[useClientNavigation] Fallback path (no tenant):', fallbackPath);
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