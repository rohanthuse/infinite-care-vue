
import React from "react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface PersonalInfoTabProps {
  client: any;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ client }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const displayName = client.preferred_name || 
    `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
    client.name;

  return (
    <div className="space-y-6">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Title</h4>
            <p className="mt-1">{client.title || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">First Name</h4>
            <p className="mt-1">{client.first_name || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Middle Name</h4>
            <p className="mt-1">{client.middle_name || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Last Name</h4>
            <p className="mt-1">{client.last_name || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Preferred Name</h4>
            <p className="mt-1">{client.preferred_name || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Pronouns</h4>
            <p className="mt-1">{client.pronouns || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
            <p className="mt-1">{formatDate(client.date_of_birth)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Gender</h4>
            <p className="mt-1">{client.gender || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Client ID</h4>
            <p className="mt-1">{client.id}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Other Identifier</h4>
            <p className="mt-1">{client.other_identifier || 'Not provided'}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Email</h4>
            <p className="mt-1">{client.email || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Phone</h4>
            <p className="mt-1">{client.phone || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Mobile Number</h4>
            <p className="mt-1">{client.mobile_number || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Telephone</h4>
            <p className="mt-1">{client.telephone_number || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Country Code</h4>
            <p className="mt-1">{client.country_code || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Address</h4>
            <p className="mt-1">{client.address || client.location || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Pin Code</h4>
            <p className="mt-1">{client.pin_code || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Region</h4>
            <p className="mt-1">{client.region || 'Not provided'}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <p className="mt-1">{client.status || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Registered On</h4>
            <p className="mt-1">{formatDate(client.registered_on || client.registeredOn)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Referral Route</h4>
            <p className="mt-1">{client.referral_route || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Avatar Initials</h4>
            <p className="mt-1">{client.avatar_initials || client.avatar || 'Not provided'}</p>
          </div>
        </div>
        
        {client.additional_information && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500">Additional Information</h4>
            <p className="mt-1 whitespace-pre-wrap">{client.additional_information}</p>
          </div>
        )}
      </Card>
    </div>
  );
};
