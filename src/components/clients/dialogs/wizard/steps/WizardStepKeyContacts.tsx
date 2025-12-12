import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Users, Phone, Mail, MapPin, Building } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface WizardStepKeyContactsProps {
  form: UseFormReturn<any>;
}

const CONTACT_TYPES = [
  { value: 'next_of_kin', label: 'Next of Kin' },
  { value: 'social_worker', label: 'Social Worker' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'professional', label: 'Other Professional' },
  { value: 'other', label: 'Other' },
];

export function WizardStepKeyContacts({ form }: WizardStepKeyContactsProps) {
  const keyContacts = form.watch("key_contacts") || [];

  const addContact = () => {
    const current = form.getValues("key_contacts") || [];
    form.setValue("key_contacts", [
      ...current,
      {
        type: 'other',
        name: '',
        relationship: '',
        organization: '',
        role: '',
        phone: '',
        email: '',
        address: '',
      }
    ]);
  };

  const removeContact = (index: number) => {
    const current = form.getValues("key_contacts") || [];
    form.setValue("key_contacts", current.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Key Contacts</h2>
        <p className="text-gray-600">
          Add important contacts including next of kin, social workers, nurses, and other professionals.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Add Contact Button */}
          <div className="flex justify-end">
            <Button type="button" onClick={addContact} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>

          {/* Contact Cards */}
          {keyContacts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium mb-2">No Contacts Added</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Click "Add Contact" to add key contacts such as next of kin, social workers, or nurses.
                </p>
                <Button type="button" onClick={addContact} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {keyContacts.map((contact: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Contact #{index + 1}</CardTitle>
                      <Button 
                        type="button" 
                        onClick={() => removeContact(index)} 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Contact Type */}
                      <FormField
                        control={form.control}
                        name={`key_contacts.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'other'}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
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

                      {/* Name */}
                      <FormField
                        control={form.control}
                        name={`key_contacts.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Relationship (for next of kin) */}
                      {form.watch(`key_contacts.${index}.type`) === 'next_of_kin' && (
                        <FormField
                          control={form.control}
                          name={`key_contacts.${index}.relationship`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Son, Daughter, Spouse" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Organization */}
                      {form.watch(`key_contacts.${index}.type`) !== 'next_of_kin' && (
                        <FormField
                          control={form.control}
                          name={`key_contacts.${index}.organization`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., NHS, Local Council" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Role */}
                      {form.watch(`key_contacts.${index}.type`) !== 'next_of_kin' && (
                        <FormField
                          control={form.control}
                          name={`key_contacts.${index}.role`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role/Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Senior Social Worker" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Phone */}
                      <FormField
                        control={form.control}
                        name={`key_contacts.${index}.phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="+44 XXX XXX XXXX" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name={`key_contacts.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="email@example.com" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address */}
                    <FormField
                      control={form.control}
                      name={`key_contacts.${index}.address`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Full address (optional)" 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Form>
    </div>
  );
}
