
import React, { useState } from "react";
import { X, FileEdit, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { generatePDF } from "@/utils/pdfGenerator";

import { ClientTabBar } from "./ClientTabBar";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { NotesTab } from "./tabs/NotesTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { AppointmentsTab } from "./tabs/AppointmentsTab";
import { BillingTab } from "./tabs/BillingTab";
import { CarePlansTab } from "./tabs/CarePlansTab";

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
  onScheduleAppointment?: () => void;
  onUploadDocument?: () => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ 
  client, 
  onClose,
  onAddNote,
  onScheduleAppointment,
  onUploadDocument
}) => {
  const [activeTab, setActiveTab] = useState("personal");

  if (!client) return null;

  const handlePrintClientProfile = () => {
    generatePDF({
      id: parseInt(client.id.replace('CL-', '')),
      title: `Client Profile for ${client.name}`,
      date: client.registeredOn,
      status: client.status,
      signedBy: "System Generated"
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
              {client.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold">{client.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Client ID: {client.id}</span>
                <span>•</span>
                <span>Registered: {client.registeredOn}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePrintClientProfile} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-full md:w-1/3">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-medium">Client Information</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{client.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p className="font-medium">{client.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{client.status}</p>
                  </div>
                </div>
                <div className="p-4 space-y-2 border-t">
                  {onAddNote && (
                    <Button variant="outline" className="w-full justify-start" onClick={onAddNote}>
                      Add Note
                    </Button>
                  )}
                  {onScheduleAppointment && (
                    <Button variant="outline" className="w-full justify-start" onClick={onScheduleAppointment}>
                      Schedule Appointment
                    </Button>
                  )}
                  {onUploadDocument && (
                    <Button variant="outline" className="w-full justify-start" onClick={onUploadDocument}>
                      Upload Document
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <ClientTabBar activeTab={activeTab} onChange={setActiveTab} />
                
                <TabsContent value="personal">
                  <PersonalInfoTab client={client} />
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
                  <BillingTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="careplans">
                  <CarePlansTab clientId={client.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
