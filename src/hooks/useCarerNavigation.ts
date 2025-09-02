import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export const useCarerNavigation = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  const createCarerPath = (path: string) => {
    if (tenantSlug) {
      return `/${tenantSlug}/carer-dashboard${path}`;
    }
    return `/carer-dashboard${path}`;
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
      path: createCarerPath("/bookings"), 
      icon: "CalendarDays" 
    },
    { 
      name: "Care Plans", 
      path: createCarerPath("/careplans"), 
      icon: "FileText" 
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
      name: "Clients", 
      path: createCarerPath("/clients"), 
      icon: "Users" 
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