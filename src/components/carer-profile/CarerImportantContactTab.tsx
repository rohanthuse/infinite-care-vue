import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, User, Plus, Edit, Trash2, AlertTriangle, MapPin } from "lucide-react";
import { useStaffContacts, CreateStaffContactData } from "@/hooks/useStaffContacts";
import { AddStaffContactDialog } from "./AddStaffContactDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CarerImportantContactTabProps {
  carerId: string;
}

export const CarerImportantContactTab: React.FC<CarerImportantContactTabProps> = ({ carerId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Fetch staff branch_id
  const { data: staffInfo } = useQuery({
    queryKey: ['staff-info', carerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('branch_id')
        .eq('id', carerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!carerId,
  });

  const {
    contacts,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
    isCreating,
    isUpdating,
    isDeleting,
  } = useStaffContacts(carerId);

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medical':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'personal':
        return <User className="h-4 w-4 text-green-500" />;
      case 'professional':
        return <User className="h-4 w-4 text-purple-500" />;
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
      case 'personal':
        return <Badge className="bg-green-100 text-green-800">Personal</Badge>;
      case 'professional':
        return <Badge className="bg-purple-100 text-purple-800">Professional</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const handleAddContact = (formData: any) => {
    const data: CreateStaffContactData = {
      ...formData,
      staff_id: carerId,
      branch_id: staffInfo?.branch_id || '',
    };
    createContact(data, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleEditContact = (formData: any) => {
    if (editingContact) {
      updateContact(
        { id: editingContact.id, ...formData },
        {
          onSuccess: () => {
            setEditingContact(null);
          },
        }
      );
    }
  };

  const handleDeleteContact = () => {
    if (deletingContactId) {
      deleteContact(deletingContactId, {
        onSuccess: () => {
          setDeletingContactId(null);
        },
      });
    }
  };

  const primaryContact = contacts.find(c => c.is_primary);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Important Contacts ({contacts.length})
          </CardTitle>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No contacts added yet</p>
              <p className="text-sm">Click "Add Contact" to add an important contact</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <Card key={contact.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {getContactIcon(contact.contact_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{contact.name}</h4>
                          {contact.is_primary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getContactTypeBadge(contact.contact_type)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeletingContactId(contact.id)}
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
                    
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>

                  {contact.address && (
                    <div className="mt-2 text-sm text-muted-foreground flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>{contact.address}</p>
                    </div>
                  )}

                  {contact.notes && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <p className="text-muted-foreground"><strong>Notes:</strong> {contact.notes}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start"
              disabled={!primaryContact}
              onClick={() => {
                if (primaryContact) {
                  window.location.href = `tel:${primaryContact.phone}`;
                }
              }}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Primary Contact
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start"
              disabled={contacts.filter(c => c.contact_type === 'emergency').length === 0}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Emergency Contacts
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start"
              disabled={contacts.filter(c => c.contact_type === 'medical').length === 0}
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact Medical Contacts
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <User className="h-4 w-4 mr-2" />
              Add New Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <AddStaffContactDialog
        open={isAddDialogOpen || !!editingContact}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingContact(null);
          }
        }}
        onSubmit={editingContact ? handleEditContact : handleAddContact}
        isLoading={isCreating || isUpdating}
        editContact={editingContact}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingContactId} onOpenChange={(open) => !open && setDeletingContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};