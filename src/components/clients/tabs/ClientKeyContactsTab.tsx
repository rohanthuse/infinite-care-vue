import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Plus, Pencil, Trash2, Eye, Phone, Mail, MapPin, UserCheck } from "lucide-react";
import { useClientKeyContacts, ClientKeyContact, CreateClientKeyContactData } from "@/hooks/useClientKeyContacts";

interface ClientKeyContactsTabProps {
  clientId: string;
}

const CONTACT_TYPES = [
  { value: 'emergency_contact', label: 'Emergency Contact' },
  { value: 'family_member', label: 'Family Member' },
  { value: 'next_of_kin', label: 'Next of Kin' },
  { value: 'gp_contact', label: 'GP Contact' },
  { value: 'social_worker', label: 'Social Worker' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'lpa_health_welfare', label: 'LPA (Health & Welfare)' },
  { value: 'lpa_property_financial', label: 'LPA (Property & Financial)' },
  { value: 'health_professional', label: 'Health Professional' },
  { value: 'care_manager', label: 'Care Manager' },
  { value: 'district_nurse', label: 'District Nurse' },
  { value: 'occupational_therapist', label: 'Occupational Therapist' },
  { value: 'physiotherapist', label: 'Physiotherapist' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'professional', label: 'Professional' },
  { value: 'other', label: 'Other' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const COMMUNICATION_METHODS = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text/SMS' },
  { value: 'post', label: 'Post/Mail' },
  { value: 'in_person', label: 'In Person' },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'partner', label: 'Partner' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'carer', label: 'Carer' },
  { value: 'other', label: 'Other' },
];

const getContactTypeLabel = (value: string) => {
  return CONTACT_TYPES.find(t => t.value === value)?.label || value;
};

const getContactTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'emergency_contact':
      return 'bg-red-100 text-red-800';
    case 'next_of_kin':
      return 'bg-blue-100 text-blue-800';
    case 'family_member':
      return 'bg-green-100 text-green-800';
    case 'gp_contact':
      return 'bg-purple-100 text-purple-800';
    case 'social_worker':
      return 'bg-orange-100 text-orange-800';
    case 'nurse':
    case 'district_nurse':
      return 'bg-teal-100 text-teal-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface ContactFormData {
  first_name: string;
  surname: string;
  relationship: string;
  is_next_of_kin: boolean;
  gender: string;
  email: string;
  phone: string;
  contact_type: string;
  address: string;
  preferred_communication: string;
  notes: string;
}

const initialFormData: ContactFormData = {
  first_name: '',
  surname: '',
  relationship: '',
  is_next_of_kin: false,
  gender: '',
  email: '',
  phone: '',
  contact_type: '',
  address: '',
  preferred_communication: '',
  notes: '',
};

export const ClientKeyContactsTab: React.FC<ClientKeyContactsTabProps> = ({ clientId }) => {
  const { contacts, isLoading, createContact, updateContact, deleteContact, isCreating, isUpdating } = useClientKeyContacts(clientId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientKeyContact | null>(null);
  const [viewingContact, setViewingContact] = useState<ClientKeyContact | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);

  const handleAddNew = () => {
    setEditingContact(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleEdit = (contact: ClientKeyContact) => {
    setEditingContact(contact);
    setFormData({
      first_name: contact.first_name,
      surname: contact.surname,
      relationship: contact.relationship || '',
      is_next_of_kin: contact.is_next_of_kin,
      gender: contact.gender || '',
      email: contact.email || '',
      phone: contact.phone || '',
      contact_type: contact.contact_type,
      address: contact.address || '',
      preferred_communication: contact.preferred_communication || '',
      notes: contact.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleView = (contact: ClientKeyContact) => {
    setViewingContact(contact);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (contactId: string) => {
    setDeleteContactId(contactId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteContactId) {
      deleteContact(deleteContactId);
      setDeleteContactId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.first_name || !formData.surname || !formData.contact_type) {
      return;
    }

    const contactData: CreateClientKeyContactData = {
      client_id: clientId,
      first_name: formData.first_name,
      surname: formData.surname,
      relationship: formData.relationship || undefined,
      is_next_of_kin: formData.is_next_of_kin,
      gender: formData.gender || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      contact_type: formData.contact_type,
      address: formData.address || undefined,
      preferred_communication: formData.preferred_communication || undefined,
      notes: formData.notes || undefined,
    };

    if (editingContact) {
      updateContact({ id: editingContact.id, ...contactData });
    } else {
      createContact(contactData);
    }

    setIsModalOpen(false);
    setEditingContact(null);
    setFormData(initialFormData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Key Contacts
        </h3>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {contacts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {contact.first_name} {contact.surname}
                        </span>
                        {contact.is_next_of_kin && (
                          <Badge variant="outline" className="text-xs">NOK</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{contact.relationship || '-'}</TableCell>
                    <TableCell>{contact.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getContactTypeBadgeColor(contact.contact_type)}>
                        {getContactTypeLabel(contact.contact_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="service-view-button pointer-events-auto"
                          onClick={() => handleView(contact)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(contact)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Key Contacts</h4>
            <p className="text-muted-foreground text-sm mb-4">
              No key contacts have been added for this client yet.
            </p>
            <Button onClick={handleAddNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  placeholder="Enter surname"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_type">Contact Type *</Label>
                <Select
                  value={formData.contact_type}
                  onValueChange={(value) => setFormData({ ...formData, contact_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <SelectItem key={rel.value} value={rel.value}>
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((gender) => (
                      <SelectItem key={gender.value} value={gender.value}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_communication">Preferred Communication</Label>
                <Select
                  value={formData.preferred_communication}
                  onValueChange={(value) => setFormData({ ...formData, preferred_communication: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMUNICATION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_next_of_kin"
                checked={formData.is_next_of_kin}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_next_of_kin: checked as boolean })
                }
              />
              <Label htmlFor="is_next_of_kin" className="cursor-pointer">
                This contact is the Next of Kin
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.first_name || !formData.surname || !formData.contact_type || isCreating || isUpdating}
            >
              {editingContact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          
          {viewingContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {viewingContact.first_name} {viewingContact.surname}
                  </h3>
                  {viewingContact.relationship && (
                    <p className="text-sm text-muted-foreground">{viewingContact.relationship}</p>
                  )}
                </div>
                {viewingContact.is_next_of_kin && (
                  <Badge className="bg-blue-100 text-blue-800">Next of Kin</Badge>
                )}
              </div>

              <div className="space-y-3">
                <Badge className={getContactTypeBadgeColor(viewingContact.contact_type)}>
                  {getContactTypeLabel(viewingContact.contact_type)}
                </Badge>

                {viewingContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${viewingContact.phone}`} className="text-primary hover:underline">
                      {viewingContact.phone}
                    </a>
                  </div>
                )}

                {viewingContact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${viewingContact.email}`} className="text-primary hover:underline">
                      {viewingContact.email}
                    </a>
                  </div>
                )}

                {viewingContact.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{viewingContact.address}</span>
                  </div>
                )}

                {viewingContact.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground font-medium mb-1">Notes</p>
                    <p className="text-sm">{viewingContact.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
