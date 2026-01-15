import { useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export const useCarerNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useTenant();

  const createCarerPath = (path: string) => {
    // Try to get tenant slug from context first
    let finalTenantSlug = tenantSlug;

    // Fallback 1: Extract from current URL if context doesn't have it
    if (!finalTenantSlug) {
      const pathParts = location.pathname.split('/').filter(Boolean);
      // Check that first part is not a known route segment
      if (pathParts.length > 0 && 
          pathParts[0] !== 'carer-dashboard' &&
          pathParts[0] !== 'login' &&
          pathParts[0] !== 'visit') {
        finalTenantSlug = pathParts[0];
        console.log('[useCarerNavigation] Extracted tenant from URL:', finalTenantSlug);
      }
    }

    // Fallback 2: Try localStorage for all environments (not just dev)
    if (!finalTenantSlug) {
      finalTenantSlug = localStorage.getItem('dev-tenant') || undefined;
      if (finalTenantSlug) {
        console.log('[useCarerNavigation] Using dev-tenant from localStorage:', finalTenantSlug);
      }
    }

    console.log('[useCarerNavigation] Building path:', {
      tenantSlug: finalTenantSlug,
      inputPath: path,
      currentPath: location.pathname
    });

    if (finalTenantSlug) {
      const outputPath = `/${finalTenantSlug}/carer-dashboard${path}`;
      console.log('[useCarerNavigation] Generated path:', outputPath);
      return outputPath;
    }
    
    console.error('[useCarerNavigation] No tenant slug found - navigation may fail');
    const fallbackPath = `/carer-dashboard${path}`;
    console.log('[useCarerNavigation] Fallback path:', fallbackPath);
    return fallbackPath;
  };

  const navigateToCarerPage = (path: string, state?: any) => {
    navigate(createCarerPath(path), state ? { state } : undefined);
  };

  const getCarerMenuItems = () => [
    { 
      name: "Dashboard", 
      path: createCarerPath(""), 
      icon: "Home" 
    },
    { 
      name: "Profile", 
      path: createCarerPath("/profile"), 
      icon: "User" 
    },
    { 
      name: "Booking Calendar", 
      path: createCarerPath("/schedule"), 
      icon: "Calendar" 
    },
    { 
      name: "Appointments", 
      path: createCarerPath("/appointments"), 
      icon: "CalendarDays" 
    },
    { 
      name: "Care Plans", 
      path: createCarerPath("/careplans"), 
      icon: "FileText" 
    },
    { 
      name: "My Clients", 
      path: createCarerPath("/clients"), 
      icon: "Users" 
    },
    {
      name: "My Agreements", 
      path: createCarerPath("/agreements"), 
      icon: "FileCheck" 
    },
    { 
      name: "Documents", 
      path: createCarerPath("/documents"), 
      icon: "FileText" 
    },
    { 
      name: "My Forms", 
      path: createCarerPath("/forms"), 
      icon: "FileText" 
    },
    { 
      name: "Service Reports", 
      path: createCarerPath("/service-reports"), 
      icon: "FileBarChart2" 
    },
    { 
      name: "Library", 
      path: createCarerPath("/library"), 
      icon: "BookOpen" 
    },
    { 
      name: "Tasks", 
      path: createCarerPath("/tasks"), 
      icon: "ClipboardList" 
    },
    { 
      name: "My Assignments", 
      path: createCarerPath("/my-tasks"), 
      icon: "AlertTriangle" 
    },
    { 
      name: "Events & Logs", 
      path: createCarerPath("/events-logs"), 
      icon: "ClipboardList" 
    },
    { 
      name: "Messages", 
      path: createCarerPath("/messages"), 
      icon: "MessageCircle" 
    },
    { 
      name: "News2", 
      path: createCarerPath("/news2"), 
      icon: "Newspaper" 
    },
    { 
      name: "Reports", 
      path: createCarerPath("/reports"), 
      icon: "FileBarChart" 
    },
    { 
      name: "Payments", 
      path: createCarerPath("/payments"), 
      icon: "Wallet" 
    },
    { 
      name: "Training", 
      path: createCarerPath("/training"), 
      icon: "GraduationCap" 
    },
    { 
      name: "Leave", 
      path: createCarerPath("/leave"), 
      icon: "Calendar" 
    }
  ];

  return {
    createCarerPath,
    navigateToCarerPage,
    getCarerMenuItems,
    tenantSlug
  };
};