import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, Users, Phone, Mail, MapPin, Eye, Pencil, Trash2, X, UserPlus } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface WizardStepKeyContactsProps {
  form: UseFormReturn<any>;
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

// Contact form schema for validation
const contactFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  relationship: z.string().optional(),
  is_next_of_kin: z.boolean().default(false),
  gender: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  contact_type: z.string().min(1, "Contact type is required"),
  address: z.string().optional(),
  preferred_communication: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface Contact extends ContactFormData {
  id: string;
}

export function WizardStepKeyContacts({ form }: WizardStepKeyContactsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const keyContacts: Contact[] = form.watch("key_contacts") || [];

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      first_name: "",
      surname: "",
      relationship: "",
      is_next_of_kin: false,
      gender: "",
      email: "",
      phone: "",
      contact_type: "",
      address: "",
      preferred_communication: "",
      notes: "",
    },
  });

  const openAddModal = () => {
    contactForm.reset({
      first_name: "",
      surname: "",
      relationship: "",
      is_next_of_kin: false,
      gender: "",
      email: "",
      phone: "",
      contact_type: "",
      address: "",
      preferred_communication: "",
      notes: "",
    });
    setEditingIndex(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    const contact = keyContacts[index];
    contactForm.reset(contact);
    setEditingIndex(index);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const openViewModal = (index: number) => {
    const contact = keyContacts[index];
    contactForm.reset(contact);
    setEditingIndex(index);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: ContactFormData) => {
    const current = form.getValues("key_contacts") || [];
    
    if (editingIndex !== null) {
      // Update existing contact
      const updated = [...current];
      updated[editingIndex] = { ...data, id: current[editingIndex]?.id || crypto.randomUUID() };
      form.setValue("key_contacts", updated);
      toast.success("Contact updated successfully");
    } else {
      // Add new contact
      form.setValue("key_contacts", [
        ...current,
        { ...data, id: crypto.randomUUID() }
      ]);
      toast.success("Contact added successfully");
    }
    
    setIsModalOpen(false);
    contactForm.reset();
  };

  const handleDelete = () => {
    if (deleteIndex !== null) {
      const current = form.getValues("key_contacts") || [];
      form.setValue("key_contacts", current.filter((_: any, i: number) => i !== deleteIndex));
      toast.success("Contact deleted successfully");
      setDeleteIndex(null);
    }
  };

  const getContactTypeLabel = (value: string) => {
    return CONTACT_TYPES.find(t => t.value === value)?.label || value;
  };

  const getContactTypeBadgeVariant = (value: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (value) {
      case 'emergency_contact':
        return 'destructive';
      case 'next_of_kin':
        return 'default';
      case 'gp_contact':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Key Contacts</h2>
        <p className="text-muted-foreground">
          Add emergency contacts, family members, and other important contacts for this client.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Add Contact Button */}
          <div className="flex justify-end">
            <Button type="button" onClick={openAddModal} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>

          {/* Contacts Table or Empty State */}
          {keyContacts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium mb-2">No Contacts Added</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Click "Add Contact" to add key contacts such as emergency contacts, family members, or healthcare professionals.
                </p>
                <Button type="button" onClick={openAddModal} variant="default">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Surname</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Contact Number</TableHead>
                      <TableHead>Contact Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keyContacts.map((contact, index) => (
                      <TableRow key={contact.id || index}>
                        <TableCell className="font-medium">{contact.first_name}</TableCell>
                        <TableCell>{contact.surname}</TableCell>
                        <TableCell>{contact.relationship || "-"}</TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {contact.phone}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getContactTypeBadgeVariant(contact.contact_type)}>
                            {getContactTypeLabel(contact.contact_type)}
                          </Badge>
                          {contact.is_next_of_kin && (
                            <Badge variant="secondary" className="ml-1">NoK</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(index)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(index)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteIndex(index)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </Form>

      {/* Add/Edit/View Contact Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? "View Contact" : editingIndex !== null ? "Edit Contact" : "Add Contact"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={contactForm.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={contactForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter first name" 
                        {...field} 
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surname *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter surname" 
                        {...field} 
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Relationship and Next of Kin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={contactForm.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isViewMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="is_next_of_kin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Next of Kin?</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark if this person is the next of kin
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isViewMode}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Gender and Contact Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={contactForm.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isViewMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="contact_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isViewMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTACT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-9" 
                          placeholder="email@example.com" 
                          {...field} 
                          disabled={isViewMode}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-9" 
                          placeholder="+44 XXX XXX XXXX" 
                          {...field} 
                          disabled={isViewMode}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preferred Communication */}
            <FormField
              control={contactForm.control}
              name="preferred_communication"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Communication Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isViewMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMMUNICATION_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={contactForm.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea 
                        className="pl-9 min-h-[80px]" 
                        placeholder="Full address" 
                        {...field} 
                        disabled={isViewMode}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={contactForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="min-h-[80px]" 
                      placeholder="Additional notes about this contact..." 
                      {...field} 
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                {isViewMode ? "Close" : "Cancel"}
              </Button>
              {!isViewMode && (
                <Button type="submit">
                  {editingIndex !== null ? "Update Contact" : "Add Contact"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
