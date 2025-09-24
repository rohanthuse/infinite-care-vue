import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, User, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";

interface CarerImportantContactTabProps {
  carerId: string;
}

export const CarerImportantContactTab: React.FC<CarerImportantContactTabProps> = ({ carerId }) => {
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: 'Mary Johnson',
      relationship: 'Mother',
      phone: '+44 7123 456789',
      email: 'mary.johnson@email.com',
      address: '123 Oak Street, London, SW1A 1AA',
      isPrimary: true,
      contactType: 'emergency'
    },
    {
      id: 2,
      name: 'David Smith',
      relationship: 'Brother',
      phone: '+44 7987 654321',
      email: 'david.smith@email.com',
      address: '456 Pine Avenue, Birmingham, B1 1AB',
      isPrimary: false,
      contactType: 'emergency'
    },
    {
      id: 3,
      name: 'Dr. Sarah Wilson',
      relationship: 'GP',
      phone: '+44 20 1234 5678',
      email: 'reception@wilsonpractice.nhs.uk',
      address: 'Wilson Medical Practice, 789 High Street, London, W1A 0AX',
      isPrimary: false,
      contactType: 'medical'
    }
  ]);

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medical':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getContactTypeBadge = (type: string) => {
    switch (type) {
      case 'emergency':
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>;
      case 'medical':
        return <Badge className="bg-blue-100 text-blue-800">Medical</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Important Contacts
          </CardTitle>
          <Button size="sm" onClick={() => setIsAddingContact(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contacts.map((contact) => (
              <Card key={contact.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {getContactIcon(contact.contactType)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{contact.name}</h4>
                        {contact.isPrimary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getContactTypeBadge(contact.contactType)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(contact.id)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.email}</span>
                  </div>
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{contact.address}</p>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {isAddingContact && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter full name" />
              </div>
              
              <div>
                <Label htmlFor="relationship">Relationship</Label>
                <Input id="relationship" placeholder="e.g., Mother, Brother, GP" />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+44 7xxx xxx xxx" />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="email@example.com" />
              </div>
              
              <div>
                <Label htmlFor="contact-type">Contact Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency Contact</SelectItem>
                    <SelectItem value="medical">Medical Contact</SelectItem>
                    <SelectItem value="personal">Personal Contact</SelectItem>
                    <SelectItem value="professional">Professional Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="primary" />
                <Label htmlFor="primary">Set as primary contact</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Full address" />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsAddingContact(false)}>
                Add Contact
              </Button>
              <Button variant="outline" onClick={() => setIsAddingContact(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Call Primary Emergency Contact
            </Button>
            
            <Button variant="outline" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Email All Emergency Contacts
            </Button>
            
            <Button variant="outline" className="justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Contact GP Practice
            </Button>
            
            <Button variant="outline" className="justify-start">
              <User className="h-4 w-4 mr-2" />
              Update Contact Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};