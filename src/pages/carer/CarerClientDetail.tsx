import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCarerClientDetail } from "@/hooks/useCarerClientData";
import { HandoverSummaryTab } from "@/components/clients/tabs/HandoverSummaryTab";
const CarerClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading, error } = useCarerClientDetail(clientId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error loading client details: {error.message}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Client not found or you don't have access to this client.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
        <h1 className="text-2xl font-bold">Client Details</h1>
      </div>

      {/* Client Header - Compact */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-lg border">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {client.preferred_name || `${client.first_name} ${client.last_name}`}
          </h2>
          <p className="text-sm text-muted-foreground">Client ID: {client.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Prominent Handover Summary - Full Width */}
      <HandoverSummaryTab 
        clientId={clientId!}
        clientName={client.preferred_name || `${client.first_name} ${client.last_name}`}
        clientPhone={client.phone || client.mobile_number}
        clientAddress={client.address}
      />
    </div>
  );
};

export default CarerClientDetail;