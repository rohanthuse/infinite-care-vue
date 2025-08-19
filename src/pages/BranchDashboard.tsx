import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useAuth } from "@/hooks/useAuth";
import { MainNav } from "@/components/main-nav";
import { Sidebar } from "@/components/sidebar";
import { SettingsDialog } from "@/components/dialogs/SettingsDialog";
import { NewBranchDialog } from "@/components/dialogs/NewBranchDialog";
import { NewServiceDialog } from "@/components/dialogs/NewServiceDialog";
import { NewCarerDialog } from "@/components/dialogs/NewCarerDialog";
import { NewClientDialog } from "@/components/dialogs/NewClientDialog";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { useToast } from "@/components/ui/use-toast";
import { useBranches } from "@/data/hooks/useBranches";
import { useServices } from "@/data/hooks/useServices";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { Branch } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode
}

export default function BranchDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [newBranchDialogOpen, setNewBranchDialogOpen] = useState(false);
  const [newServiceDialogOpen, setNewServiceDialogOpen] = useState(false);
  const [newCarerDialogOpen, setNewCarerDialogOpen] = useState(false);
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const { data: services = [], isLoading: isLoadingServices } = useServices();
  const { data: clients = [], isLoading: isLoadingClients } = useBranchClients({ branchId: selectedBranch?.id, searchTerm, page, itemsPerPage });
  const { data: carers = [], isLoading: isLoadingCarers } = useBranchCarers(selectedBranch?.id);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateBooking = () => {
    setNewBookingDialogOpen(true);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        settingsDialogOpen={settingsDialogOpen}
        setSettingsDialogOpen={setSettingsDialogOpen}
        signOut={handleSignOut}
        user={user}
      />
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        newBranchDialogOpen={newBranchDialogOpen}
        setNewBranchDialogOpen={setNewBranchDialogOpen}
        branches={branches}
        isLoadingBranches={isLoadingBranches}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
      />

      <main className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-semibold mb-4">Branch Dashboard</h1>
          <p>Welcome to your branch dashboard. Manage your services, clients, and bookings here.</p>

          <button onClick={handleCreateBooking}>Create Booking</button>

          <SettingsDialog
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
          />
          <NewBranchDialog
            open={newBranchDialogOpen}
            onOpenChange={setNewBranchDialogOpen}
          />
          <NewServiceDialog
            open={newServiceDialogOpen}
            onOpenChange={setNewServiceDialogOpen}
          />
          <NewCarerDialog
            open={newCarerDialogOpen}
            onOpenChange={setNewCarerDialogOpen}
          />
          <NewClientDialog
            open={newClientDialogOpen}
            onOpenChange={setNewClientDialogOpen}
          />

          <NewBookingDialog
            open={newBookingDialogOpen}
            onOpenChange={setNewBookingDialogOpen}
            carers={carers}
            services={services}
            onCreateBooking={handleCreateBooking}
          />
        </div>
      </main>
    </div>
  );
}
