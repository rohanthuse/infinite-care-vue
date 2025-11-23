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
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
};
