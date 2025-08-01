import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CarePlanViewDialog } from '@/components/care/CarePlanViewDialog';

export function CarePlanView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Open the dialog when the component mounts and we have an ID
  useEffect(() => {
    if (id) {
      setIsDialogOpen(true);
    }
  }, [id]);

  // Handle dialog close - navigate back
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      navigate(-1);
    }
  };

  if (!id) {
    navigate(-1);
    return null;
  }

  return (
    <CarePlanViewDialog
      carePlanId={id}
      open={isDialogOpen}
      onOpenChange={handleDialogClose}
    />
  );
}

export default CarePlanView;