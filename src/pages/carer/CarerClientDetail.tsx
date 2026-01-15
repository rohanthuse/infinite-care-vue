import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCarerClientDetail } from "@/hooks/useCarerClientData";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { format, parseISO } from "date-fns";
import { HandoverSummaryTab } from "@/components/clients/tabs/HandoverSummaryTab";
const CarerClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { navigateToCarerPage } = useCarerNavigation();
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {client.preferred_name || `${client.first_name} ${client.last_name}`}
                </CardTitle>
                <p className="text-sm text-gray-500">Client ID: {client.id.slice(0, 8)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Personal Information</h4>
                  <div className="space-y-2">
                    {client.title && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Title:</span>
                        <span>{client.title}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Full Name:</span>
                      <span>{client.first_name} {client.middle_name || ''} {client.last_name}</span>
                    </div>
                    {client.gender && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Gender:</span>
                        <span>{client.gender}</span>
                      </div>
                    )}
                    {client.date_of_birth && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Date of Birth:</span>
                        <span>{format(parseISO(client.date_of_birth), 'MMMM d, yyyy')}</span>
                      </div>
                    )}
                    {client.pronouns && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Pronouns:</span>
                        <span>{client.pronouns}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.mobile_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>Mobile: {client.mobile_number}</span>
                      </div>
                    )}
                    {client.telephone_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>Telephone: {client.telephone_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Address</h4>
                  {client.address ? (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p>{client.address}</p>
                        {client.region && <p className="text-gray-500">{client.region}</p>}
                        {client.pin_code && <p className="text-gray-500">{client.pin_code}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No address provided</p>
                  )}
                </div>

                {client.additional_information && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h4>
                    <p className="text-sm">{client.additional_information}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs">
                      {client.status || 'Active'}
                    </div>
                    {client.referral_route && (
                      <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        Referral: {client.referral_route}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              size="sm"
              onClick={() => navigateToCarerPage("/careplans")}
            >
              View Care Plan
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={() => navigateToCarerPage("/appointments")}
            >
              View Appointments
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={() => navigateToCarerPage("/messages")}
            >
              Contact Client
            </Button>
          </CardContent>
        </Card>

        {/* Handover Summary Section */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Handover Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <HandoverSummaryTab 
              clientId={clientId!}
              clientName={client.preferred_name || `${client.first_name} ${client.last_name}`}
              clientPhone={client.phone || client.mobile_number}
              clientAddress={client.address}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarerClientDetail;