import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Phone, Mail, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KeyContact {
  id?: string;
  name?: string;
  relationship?: string;
  contact_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_emergency_contact?: boolean;
  is_next_of_kin?: boolean;
  notes?: string;
}

interface KeyContactsSectionProps {
  keyContacts: KeyContact[];
}

export function KeyContactsSection({ keyContacts }: KeyContactsSectionProps) {
  if (!keyContacts || keyContacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Key Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No key contacts have been added yet.</p>
        </CardContent>
      </Card>
    );
  }

  const getContactTypeBadge = (contact: KeyContact) => {
    const badges = [];
    if (contact.is_emergency_contact) {
      badges.push(
        <Badge key="emergency" variant="destructive" className="text-xs">
          Emergency Contact
        </Badge>
      );
    }
    if (contact.is_next_of_kin) {
      badges.push(
        <Badge key="nok" variant="secondary" className="text-xs bg-blue-100 text-blue-800">
          Next of Kin
        </Badge>
      );
    }
    if (contact.contact_type && !['emergency', 'next_of_kin'].includes(contact.contact_type)) {
      badges.push(
        <Badge key="type" variant="outline" className="text-xs capitalize">
          {contact.contact_type.replace(/_/g, ' ')}
        </Badge>
      );
    }
    return badges;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Key Contacts ({keyContacts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {keyContacts.map((contact, idx) => (
          <Card key={contact.id || idx} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold text-base">{contact.name || 'Unnamed Contact'}</h4>
                      {contact.relationship && (
                        <p className="text-sm text-muted-foreground capitalize">
                          {contact.relationship.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getContactTypeBadge(contact)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{contact.address}</span>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <div className="bg-muted/50 rounded p-3">
                    <label className="text-sm font-medium">Notes</label>
                    <p className="text-sm mt-1">{contact.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
