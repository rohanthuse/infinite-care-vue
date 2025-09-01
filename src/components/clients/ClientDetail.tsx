
import React, { useState } from "react";
import { X, FileEdit, Download, Share2, Save, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { generatePDF } from "@/utils/pdfGenerator";
import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";

import { ClientTabBar } from "./ClientTabBar";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { NotesTab } from "./tabs/NotesTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { AppointmentsTab } from "./tabs/AppointmentsTab";
import { BillingTab } from "./tabs/BillingTab";
import { CarePlansTab } from "./tabs/CarePlansTab";
import { EventsLogsTab } from "./tabs/EventsLogsTab";
import { useAdminClientDetail } from "@/hooks/useAdminClientData";
import { useUpdateClient } from "@/hooks/useUpdateClient";
import { ClientProfileSharingDialog } from "./ClientProfileSharingDialog";
import { toast } from "sonner";

interface ClientDetailProps {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    status: string;
    avatar: string;
    region: string;
    registeredOn: string;
  } | null;
  onClose: () => void;
  onAddNote?: () => void;
  onUploadDocument?: () => void;
  onAddEvent?: () => void;
  startInEditMode?: boolean;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ 
  client, 
  onClose,
  startInEditMode = false,
}) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const navigate = useNavigate();
  const params = useParams();
  const { tenantSlug } = useTenant();
  
  const updateClientMutation = useUpdateClient();
  
  const branchId = params.id || '';
  const branchName = params.branchName || '';
  
  // Fetch real client data
  const { data: realClientData, isLoading } = useAdminClientDetail(client?.id || '');

  if (!client) return null;

  // Use real data if available, otherwise fallback to prop data
  const clientData = realClientData || client;
  const displayName = realClientData ? 
    `${realClientData.preferred_name || realClientData.first_name || ''} ${realClientData.last_name || ''}`.trim() : 
    client.name;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = (updatedData: any) => {
    updateClientMutation.mutate(
      { 
        clientId: client!.id, 
        updates: updatedData 
      },
      {
        onSuccess: () => {
          toast.success("Client information updated successfully");
          setIsEditing(false);
        },
        onError: (error: any) => {
          const errorMessage = error?.message || "Unknown error occurred";
          toast.error(`Failed to update client information: ${errorMessage}`);
          console.error('Error updating client:', error);
        }
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handlePrintClientProfile = () => {
    generatePDF({
      id: client.id,
      title: `Client Profile for ${displayName}`,
      date: client.registeredOn,
      status: client.status,
      signedBy: "System Generated"
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-center text-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              {realClientData?.avatar_initials || client.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Client ID: {client.id}</span>
                <span>•</span>
                <span>Registered: {realClientData?.registered_on || client.registeredOn}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setSharingDialogOpen(true)} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
            <Button variant="outline" onClick={handlePrintClientProfile} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCancel} 
                  className="flex items-center gap-2"
                  disabled={updateClientMutation.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleEdit} className="flex items-center gap-2">
                <FileEdit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-full md:w-1/3">
              <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-medium text-foreground">Client Information</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{realClientData?.email || client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{realClientData?.phone || client.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium text-foreground">{realClientData?.address || client.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium text-foreground">{realClientData?.region || client.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-foreground">{realClientData?.status || client.status}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <ClientTabBar activeTab={activeTab} onChange={setActiveTab} />
                
                <TabsContent value="personal">
                  <PersonalInfoTab 
                    client={realClientData || client} 
                    isEditing={isEditing}
                    onSave={handleSave}
                    isSaving={updateClientMutation.isPending}
                  />
                </TabsContent>
                
                <TabsContent value="notes">
                  <NotesTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="documents">
                  <DocumentsTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="appointments">
                  <AppointmentsTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="billing">
                  <BillingTab clientId={client.id} branchId={branchId} />
                </TabsContent>
                
                <TabsContent value="careplans">
                  <CarePlansTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="eventslogs">
                  <EventsLogsTab clientId={client.id} />
                </TabsContent>
              </Tabs>
            </div>
            </div>
          </div>
        </div>

        <ClientProfileSharingDialog
          open={sharingDialogOpen}
          onOpenChange={setSharingDialogOpen}
          client={client}
          branchId={branchId}
        />
      </div>
    );
  };
