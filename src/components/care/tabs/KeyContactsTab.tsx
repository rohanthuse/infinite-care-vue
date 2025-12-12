import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail, MapPin, Building, UserCheck } from "lucide-react";

interface KeyContact {
  type: 'next_of_kin' | 'social_worker' | 'nurse' | 'professional' | 'other';
  name: string;
  relationship?: string;
  organization?: string;
  role?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface KeyContactsTabProps {
  keyContacts?: KeyContact[];
  carePlanData?: any;
  onEditKeyContacts?: () => void;
}

const CONTACT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  next_of_kin: { label: 'Next of Kin', color: 'bg-blue-100 text-blue-800' },
  social_worker: { label: 'Social Worker', color: 'bg-purple-100 text-purple-800' },
  nurse: { label: 'Nurse', color: 'bg-green-100 text-green-800' },
  professional: { label: 'Professional', color: 'bg-orange-100 text-orange-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
};

export const KeyContactsTab: React.FC<KeyContactsTabProps> = ({
  keyContacts,
  carePlanData,
  onEditKeyContacts,
}) => {
  // Get key contacts from care plan auto_save_data
  const contacts: KeyContact[] = carePlanData?.auto_save_data?.key_contacts || keyContacts || [];

  const renderContactCard = (contact: KeyContact, index: number) => {
    const typeInfo = CONTACT_TYPE_LABELS[contact.type] || CONTACT_TYPE_LABELS.other;
    
    return (
      <Card key={index} className="overflow-hidden">
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{contact.name}</CardTitle>
            </div>
            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
          </div>
          {contact.relationship && (
            <p className="text-sm text-muted-foreground">Relationship: {contact.relationship}</p>
          )}
          {contact.role && (
            <p className="text-sm text-muted-foreground">Role: {contact.role}</p>
          )}
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {contact.organization && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{contact.organization}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                {contact.phone}
              </a>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                {contact.email}
              </a>
            </div>
          )}
          {contact.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{contact.address}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Group contacts by type
  const groupedContacts = contacts.reduce((acc, contact) => {
    const type = contact.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(contact);
    return acc;
  }, {} as Record<string, KeyContact[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Key Contacts
        </h3>
      </div>

      {contacts.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedContacts).map(([type, typeContacts]) => (
            <div key={type} className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {CONTACT_TYPE_LABELS[type]?.label || 'Other Contacts'}
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {typeContacts.map((contact, index) => renderContactCard(contact, index))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Key Contacts</h4>
            <p className="text-muted-foreground text-sm">
              No key contacts have been added to this care plan yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
