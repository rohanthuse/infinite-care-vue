import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePersistentSidebar } from '@/hooks/usePersistentSidebar';

interface CarerSidebarProviderProps {
  children: React.ReactNode;
}

export const CarerSidebarProvider: React.FC<CarerSidebarProviderProps> = ({ children }) => {
  const { open, setOpen } = usePersistentSidebar('carer-dashboard');

  return (
    <SidebarProvider 
      open={open} 
      onOpenChange={setOpen}
      defaultOpen={false}
    >
      {children}
    </SidebarProvider>
  );
};
