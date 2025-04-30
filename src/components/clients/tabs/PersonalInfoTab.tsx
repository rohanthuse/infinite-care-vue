
import React from "react";
import { Card } from "@/components/ui/card";

interface PersonalInfoTabProps {
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
  };
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ client }) => {
  return (
    <div className="space-y-6">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
            <p className="mt-1">{client.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Client ID</h4>
            <p className="mt-1">{client.id}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Email</h4>
            <p className="mt-1">{client.email}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Phone</h4>
            <p className="mt-1">{client.phone}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Address</h4>
            <p className="mt-1">{client.location}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Region</h4>
            <p className="mt-1">{client.region}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <p className="mt-1">{client.status}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Registered On</h4>
            <p className="mt-1">{client.registeredOn}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Medical Information</h3>
        <p className="text-gray-500">No medical information has been added yet.</p>
      </Card>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Emergency Contacts</h3>
        <p className="text-gray-500">No emergency contacts have been added yet.</p>
      </Card>
    </div>
  );
};
