import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export const useClientNavigation = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  const createClientPath = (path: string) => {
    if (tenantSlug) {
      return `/${tenantSlug}/client-dashboard${path}`;
    }
    return `/client-dashboard${path}`;
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