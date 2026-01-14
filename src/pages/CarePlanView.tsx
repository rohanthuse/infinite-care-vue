import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CarePlanViewDialog } from '@/components/care/CarePlanViewDialog';

export function CarePlanView() {
  const { carePlanId } = useParams<{ carePlanId: string }>();
  const navigate = useNavigate();
  // Initialize dialog as open immediately when carePlanId exists
  const [isDialogOpen, setIsDialogOpen] = useState(!!carePlanId);

  // Handle dialog close - navigate back
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      navigate(-1);
    }
  };

  // Handle missing carePlanId - navigate back
  useEffect(() => {
    if (!carePlanId) {
      navigate(-1);
    }
  }, [carePlanId, navigate]);

  if (!carePlanId) {
    return null;
  }

  return (
    <CarePlanViewDialog
      carePlanId={carePlanId}
      open={isDialogOpen}
      onOpenChange={handleDialogClose}
    />
  );
}

export default CarePlanView;