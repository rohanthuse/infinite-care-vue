
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, FileText, Calendar, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientSelector } from "@/components/care/ClientSelector";
import { CarePlanCreationWizard } from "../dialogs/CarePlanCreationWizard";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  gp_details?: any;
  mobility_status?: string;
  communication_preferences?: any;
}

export const CareTab: React.FC = () => {
  const { id: branchId } = useParams();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");
  const [selectedClientData, setSelectedClientData] = useState<Client | undefined>(undefined);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleClientSelect = (clientId: string, clientName: string, clientData: Client) => {
    console.log('Client selected:', { clientId, clientName, clientData });
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
    setSelectedClientData(clientData);
  };

  const handleOpenWizard = () => {
    if (selectedClientId && selectedClientName) {
      setIsWizardOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Care Plan Management</CardTitle>
          </div>
          <CardDescription>Create and manage comprehensive care plans for your clients</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Select Client</h3>
              {branchId && (
                <ClientSelector
                  branchId={branchId}
                  selectedClientId={selectedClientId}
                  onClientSelect={handleClientSelect}
                />
              )}
            </div>

            {/* Selected Client Info */}
            {selectedClientData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium text-blue-900">{selectedClientName}</h4>
                      <p className="text-sm text-blue-700">
                        {selectedClientData.email && `Email: ${selectedClientData.email}`}
                        {selectedClientData.phone && ` • Phone: ${selectedClientData.phone}`}
                      </p>
                    </div>
                    
                    {selectedClientData.emergency_contact && (
                      <div className="text-sm text-blue-600">
                        <strong>Emergency Contact:</strong> {selectedClientData.emergency_contact}
                        {selectedClientData.emergency_phone && ` (${selectedClientData.emergency_phone})`}
                      </div>
                    )}
                    
                    {selectedClientData.mobility_status && (
                      <div className="text-sm text-blue-600">
                        <strong>Mobility Status:</strong> {selectedClientData.mobility_status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleOpenWizard}
                disabled={!selectedClientId}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Care Plan
              </Button>
              
              {selectedClientId && (
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  View Existing Plans
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Plan Creation Wizard */}
      {selectedClientId && selectedClientName && (
        <CarePlanCreationWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          clientId={selectedClientId}
        />
      )}
    </div>
  );
};
