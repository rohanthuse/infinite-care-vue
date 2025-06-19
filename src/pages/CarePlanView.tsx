
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarePlanDetail } from "@/components/care/CarePlanDetail";
import { useCarePlanData } from "@/hooks/useCarePlanData";

export default function CarePlanView() {
  const { carePlanId, branchId, branchName } = useParams();
  const navigate = useNavigate();

  // Add debugging logs
  console.log('[CarePlanView] URL params:', { carePlanId, branchId, branchName });
  console.log('[CarePlanView] Full window location:', window.location.pathname);

  // Check if we have a care plan ID
  if (!carePlanId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Missing Care Plan ID</h2>
          <p className="text-gray-600 mb-4">No care plan ID was provided in the URL.</p>
          <Button 
            onClick={() => {
              if (branchId && branchName) {
                navigate(`/branch-dashboard/${branchId}/${branchName}`);
              } else {
                navigate("/");
              }
            }} 
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Fetch care plan data
  const { data: carePlanData, isLoading, error } = useCarePlanData(carePlanId);

  console.log('[CarePlanView] Care plan data state:', { 
    hasData: !!carePlanData, 
    isLoading, 
    error: error?.message,
    carePlanId 
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading care plan...</p>
        </div>
      </div>
    );
  }

  if (error || !carePlanData) {
    console.error('[CarePlanView] Error loading care plan:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Care Plan Not Found</h2>
          <p className="text-gray-600 mb-2">The requested care plan could not be found.</p>
          <p className="text-sm text-gray-500 mb-4">Care Plan ID: {carePlanId}</p>
          {error && (
            <p className="text-sm text-red-600 mb-4">Error: {error.message}</p>
          )}
          <Button 
            onClick={() => {
              if (branchId && branchName) {
                navigate(`/branch-dashboard/${branchId}/${branchName}`);
              } else {
                navigate("/");
              }
            }} 
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Transform the data to match CarePlanDetail expected interface
  const carePlan = {
    id: carePlanData.id,
    patientName: carePlanData.client ? `${carePlanData.client.first_name} ${carePlanData.client.last_name}` : 'Unknown Patient',
    patientId: carePlanData.client_id,
    dateCreated: new Date(carePlanData.created_at),
    lastUpdated: new Date(carePlanData.updated_at),
    status: carePlanData.status,
    assignedTo: carePlanData.provider_name || 'Unassigned',
    avatar: carePlanData.client?.avatar_initials || `${carePlanData.client?.first_name?.[0] || 'U'}${carePlanData.client?.last_name?.[0] || 'P'}`
  };

  const handleClose = () => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${branchName}`);
    } else {
      navigate("/");
    }
  };

  return (
    <CarePlanDetail
      carePlan={carePlan}
      onClose={handleClose}
    />
  );
}
