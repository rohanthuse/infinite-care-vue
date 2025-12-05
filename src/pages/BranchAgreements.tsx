import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BranchLayout } from '@/components/branch-dashboard/BranchLayout';
import { BranchAgreementsTab } from '@/components/agreements/BranchAgreementsTab';
import { AddClientDialog } from '@/components/AddClientDialog';
import { NewBookingDialog } from '@/components/bookings/dialogs/NewBookingDialog';
import { useBookingData } from '@/components/bookings/hooks/useBookingData';
import { useServices } from '@/data/hooks/useServices';
import { useTenant } from '@/contexts/TenantContext';

const BranchAgreements = () => {
  const { id: branchId, branchName } = useParams<{ id: string; branchName: string }>();
  const { organization } = useTenant();
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  
  const { clients, carers } = useBookingData(branchId || '');
  const { data: services = [] } = useServices(organization?.id);
  
  if (!branchId || !branchName) {
    return <div>Branch not found</div>;
  }

  const decodedBranchName = decodeURIComponent(branchName);
  
  const handleNewClient = () => setAddClientDialogOpen(true);
  const handleNewBooking = () => setNewBookingDialogOpen(true);
  const handleClientAdded = () => {};
  const handleCreateBooking = (bookingData: any) => {
    console.log("Creating new booking:", bookingData);
    setNewBookingDialogOpen(false);
  };

  return (
    <>
      <BranchLayout onNewClient={handleNewClient} onNewBooking={handleNewBooking}>
        <BranchAgreementsTab branchId={branchId} branchName={decodedBranchName} />
      </BranchLayout>
      
      <AddClientDialog
        open={addClientDialogOpen}
        onOpenChange={setAddClientDialogOpen}
        branchId={branchId}
        onSuccess={handleClientAdded}
      />
      
      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        carers={carers}
        services={services}
        onCreateBooking={handleCreateBooking}
        branchId={branchId}
      />
    </>
  );
};

export default BranchAgreements;