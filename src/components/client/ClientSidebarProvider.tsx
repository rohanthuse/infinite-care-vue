import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePersistentSidebar } from '@/hooks/usePersistentSidebar';

interface ClientSidebarProviderProps {
  children: React.ReactNode;
}

export const ClientSidebarProvider: React.FC<ClientSidebarProviderProps> = ({ children }) => {
  const { open, setOpen } = usePersistentSidebar('client-dashboard');
  const [isMounted, setIsMounted] = React.useState(false);

  // Detect if we're on desktop on initial mount
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get initial state based on screen size if not stored
  const getDefaultOpen = () => {
    if (typeof window === 'undefined') return false;
    
    // Check if there's a stored value
    const stored = localStorage.getItem('sidebar-state-client-dashboard');
    if (stored !== null) {
      return JSON.parse(stored);
    }
    
    // Default: open on desktop (≥768px), closed on mobile
    return window.innerWidth >= 768;
  };

  return (
    <TooltipProvider>
      <SidebarProvider 
        open={isMounted ? open : getDefaultOpen()} 
        onOpenChange={setOpen}
        defaultOpen={getDefaultOpen()}
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
};
