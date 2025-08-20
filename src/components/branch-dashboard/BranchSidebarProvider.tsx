import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePersistentSidebar } from '@/hooks/usePersistentSidebar';
import { useParams } from 'react-router-dom';

interface BranchSidebarProviderProps {
  children: React.ReactNode;
}

export const BranchSidebarProvider: React.FC<BranchSidebarProviderProps> = ({ children }) => {
  const { id: branchId } = useParams<{ id: string }>();
  const { open, setOpen } = usePersistentSidebar(branchId);

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