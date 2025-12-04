import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePersistentSidebar } from '@/hooks/usePersistentSidebar';

interface ClientSidebarProviderProps {
  children: React.ReactNode;
}

export const ClientSidebarProvider: React.FC<ClientSidebarProviderProps> = ({ children }) => {
  const { open, setOpen } = usePersistentSidebar('client-dashboard');

  return (
    <TooltipProvider>
      <SidebarProvider 
        open={open} 
        onOpenChange={setOpen}
        style={{
          '--sidebar-width': '16rem',
          '--sidebar-width-icon': '3.5rem',
          '--sidebar-top-offset': '72px',
        } as React.CSSProperties}
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
};
