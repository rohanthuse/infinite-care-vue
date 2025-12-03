import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

interface CarerSidebarProviderProps {
  children: React.ReactNode;
}

export const CarerSidebarProvider: React.FC<CarerSidebarProviderProps> = ({ children }) => {
  return (
    <SidebarProvider 
      open={true}
      defaultOpen={true}
      style={{
        '--carer-header-height': '72px',
        '--carer-subheader-height': '56px',
        '--carer-total-header-height': '128px',
        '--sidebar-width': '16rem',
        '--sidebar-width-icon': '3.5rem',
        '--sidebar-top-offset': '128px',
      } as React.CSSProperties}
    >
      {children}
    </SidebarProvider>
  );
};
