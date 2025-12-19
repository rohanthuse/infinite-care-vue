import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { getSubscriptionLimit } from "@/lib/subscriptionLimits";
interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  onSuccess: () => void;
  clientToEdit?: any;
  mode?: 'add' | 'edit';
}
export const AddClientDialog: React.FC<AddClientDialogProps> = ({
  open,
  onOpenChange,
  branchId,
  onSuccess,
  clientToEdit,
  mode = 'add'
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  const { canAddClient, remainingSlots, maxClients, currentClientCount } = useSubscriptionLimits();
  const [isLoading, setIsLoading] = useState(false);
  
  const defaultFormData = {
    client_id: "",
    title: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    preferred_name: "",
    pronouns: "",
    email: "",
    phone: "",
    telephone_number: "",
    house_no: "",
    street: "",
    city: "",
    county: "",
    pin_code: "",
    status: "New Enquiries",
    region: "North",
    date_of_birth: "",
    gender: "",
    age_group: "adult",
    other_identifier: "",
    referral_route: "",
    emergency_contact: "",
    emergency_phone: "",
    gp_details: "",
    mobility_status: "",
    communication_preferences: "",
    additional_information: ""
  };
  
  const [formData, setFormData] = useState(defaultFormData);
  
  // Helper function to parse address string into components
  const parseAddress = (address: string) => {
    if (!address) return { house_no: '', street: '', city: '', county: '' };
    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length >= 4) {
      return {
        house_no: parts[0] || '',
        street: parts[1] || '',
        city: parts[parts.length - 2] || '',
        county: parts[parts.length - 1] || ''
      };
    }
    
    return { house_no: '', street: '', city: '', county: '' };
  };
  
  // Prefill form data when editing - only trigger on dialog open
  useEffect(() => {
    if (open && clientToEdit && mode === 'edit') {
      // Only prefill when dialog is OPENING with edit mode
      const addressParts = parseAddress(clientToEdit.address || '');
      
      setFormData({
        client_id: clientToEdit.client_id || "",
        title: clientToEdit.title || "",
        first_name: clientToEdit.first_name || "",
        middle_name: clientToEdit.middle_name || "",
        last_name: clientToEdit.last_name || "",
        preferred_name: clientToEdit.preferred_name || "",
        pronouns: clientToEdit.pronouns || "",
        email: clientToEdit.email || "",
        phone: clientToEdit.phone || "",
        telephone_number: clientToEdit.telephone_number || "",
        house_no: addressParts.house_no,
        street: addressParts.street,
        city: addressParts.city,
        county: addressParts.county,
        pin_code: clientToEdit.pin_code || "",
        status: clientToEdit.status || "New Enquiries",
        region: clientToEdit.region || "North",
        date_of_birth: clientToEdit.date_of_birth || "",
        gender: clientToEdit.gender || "",
        age_group: (clientToEdit.age_group === 'child' ? 'young_person' : clientToEdit.age_group) || "adult",
        other_identifier: clientToEdit.other_identifier || "",
        referral_route: clientToEdit.referral_route || "",
        emergency_contact: clientToEdit.emergency_contact || "",
        emergency_phone: clientToEdit.emergency_phone || "",
        gp_details: clientToEdit.gp_details || "",
        mobility_status: clientToEdit.mobility_status || "",
        communication_preferences: clientToEdit.communication_preferences || "",
        additional_information: clientToEdit.additional_information || ""
      });
    } else if (open && mode === 'add') {
      // Reset for add mode when opening
      setFormData(defaultFormData);
    }
  }, [open, mode]); // Simplified dependencies - only trigger when dialog opens/closes

  // Cleanup when dialog closes to prevent UI freeze
  useEffect(() => {
    if (!open) {
      // Reset loading state when dialog closes
      setIsLoading(false);
      // Reset form to default when dialog closes (in add mode)
      if (mode === 'add') {
        setFormData(defaultFormData);
      }
    }
  }, [open, mode]);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const generateAvatarInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check authentication first
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in. Please refresh and try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Reconstruct full address from components
      const fullAddress = [
        formData.house_no,
        formData.street,
        formData.city,
        formData.county
      ].filter(part => part && part.trim()).join(', ');

      // Prepare client data
      const clientData = {
        ...formData,
        client_id: formData.client_id?.trim() || null, // Trim and set to null if empty (triggers auto-generation)
        address: fullAddress, // Store reconstructed address
        branch_id: branchId,
        avatar_initials: generateAvatarInitials(formData.first_name, formData.last_name),
        date_of_birth: formData.date_of_birth || null,
        age_group: formData.age_group as "adult" | "child" | "young_person",
        // Remove individual address components (they don't exist in DB)
        house_no: undefined,
        street: undefined,
        city: undefined,
        county: undefined
      };

      if (mode === 'edit' && clientToEdit) {
        // UPDATE existing client
        console.log("Updating client:", clientToEdit.id, "with data:", clientData);
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientToEdit.id)
        .select()
        .maybeSingle();

        if (error) {
          console.error("Error updating client:", error);
          toast({
            title: "Error",
            description: `Failed to update client: ${error.message}`,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        console.log("Client updated successfully:", data ? "Data returned" : "Update succeeded but no data returned");
        toast({
          title: "Success",
          description: "Client has been updated successfully."
        });
        // Don't close dialog here - let it fall through to common cleanup
      } else {
        // INSERT new client - Fetch fresh subscription limits before validation
        if (!organization?.id) {
          toast({
            title: "Error",
            description: "Organization not found. Please refresh the page.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Force refetch fresh subscription data right before validation
        const freshLimits = await queryClient.fetchQuery({
          queryKey: ['subscription-limits', organization.id],
          queryFn: async () => {
            const { data: branches } = await supabase
              .from('branches')
              .select('id')
              .eq('organization_id', organization.id);
            
            const branchIds = branches?.map(b => b.id) || [];
            
            let clientCount = 0;
            if (branchIds.length > 0) {
              const { count } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .in('branch_id', branchIds);
              clientCount = count || 0;
            }
            
            return { 
              clientCount, 
              maxUsers: organization.max_users, 
              subscriptionPlan: organization.subscription_plan 
            };
          },
          staleTime: 0, // Always fetch fresh
        });

        const freshMaxClients = getSubscriptionLimit(
          freshLimits.subscriptionPlan, 
          freshLimits.maxUsers
        );
        const freshCanAddClient = (freshLimits.clientCount || 0) < freshMaxClients;

        if (!freshCanAddClient) {
          toast({
            title: "Subscription Limit Reached",
            description: `You have reached your plan limit of ${freshMaxClients} clients. Current usage: ${freshLimits.clientCount}/${freshMaxClients}. Please upgrade your subscription to add more clients.`,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const newClientData = {
          ...clientData,
          registered_on: new Date().toISOString().split('T')[0]
        };
        
        console.log("Adding client with user:", user.id, "to branch:", branchId);
        console.log("Client data to insert:", newClientData);
        
        const { data, error } = await supabase
          .from('clients')
          .insert(newClientData)
          .select()
          .single();

        if (error) {
          console.error("Error adding client:", error);

          // Provide specific error messages
          if (error.message.includes('row-level security policy')) {
            toast({
              title: "Permission Error",
              description: "You don't have permission to add clients to this branch. Please contact your administrator.",
              variant: "destructive"
            });
          } else if (error.message.includes('Subscription limit reached')) {
            // Handle database trigger error
            toast({
              title: "Subscription Limit Reached",
              description: error.message,
              variant: "destructive"
            });
          } else if (error.message.includes('duplicate key')) {
            toast({
              title: "Duplicate Client",
              description: "A client with this email already exists.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Error",
              description: `Failed to add client: ${error.message}`,
              variant: "destructive"
            });
          }
          setIsLoading(false);
          return;
        }

        console.log("Client added successfully:", data);
        
        // Sync address to client_addresses table after successful client creation
        if (data && (formData.house_no || formData.street || formData.city)) {
          const addressLine1 = [formData.house_no, formData.street].filter(Boolean).join(', ');
          
          if (addressLine1 || formData.city) {
            const { error: addressError } = await supabase
              .from('client_addresses')
              .insert({
                client_id: data.id,
                address_label: 'Home',
                address_line_1: addressLine1 || formData.city || '',
                address_line_2: '',
                city: formData.city || '',
                state_county: formData.county || '',
                postcode: formData.pin_code || '',
                country: 'United Kingdom',
                is_default: true,
              });
            
            if (addressError) {
              console.error("Error syncing address to client_addresses:", addressError);
            } else {
              console.log("Address synced to client_addresses table successfully");
            }
          }
        }
        
        // Invalidate subscription limits and client queries immediately
        queryClient.invalidateQueries({ queryKey: ['subscription-limits'] });
        queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
        queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
        queryClient.invalidateQueries({ queryKey: ['client-addresses'] });
        
        toast({
          title: "Success",
          description: "Client has been added successfully."
        });
        // Don't close dialog here - let it fall through to common cleanup
      }

      // Common cleanup for both INSERT and UPDATE - Clear loading state BEFORE closing dialog
      setIsLoading(false);
      
      // Reset form and close dialog
      setFormData(defaultFormData);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the client record with their personal details and contact information.'
              : 'Create a new client record with their personal details and contact information.'
            }
          </DialogDescription>
          
          {/* Subscription Status Indicator - Only show in add mode */}
          {mode === 'add' && !isLoading && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-400">
                  Client Usage: {currentClientCount} / {maxClients}
                </span>
                <span className={`font-medium ${
                  remainingSlots <= 2 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {remainingSlots} slots remaining
                </span>
              </div>
              {remainingSlots <= 2 && remainingSlots > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ You're approaching your subscription limit
                </p>
              )}
              {remainingSlots === 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ⚠️ You've reached your limit. Please upgrade to add more clients.
                </p>
              )}
            </div>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: Client Identification */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Client Identification</h3>
            </div>
            
            <div>
              <Label htmlFor="client_id">
                Client ID
                <span className="text-xs text-gray-500 ml-2 font-normal">
                  (Optional - Auto-generated if empty)
                </span>
              </Label>
              <Input 
                id="client_id" 
                value={formData.client_id} 
                onChange={e => handleInputChange("client_id", e.target.value)}
                placeholder="e.g., CLIENT-2025-001 (auto-generated if empty)"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a custom alphanumeric ID or leave empty to auto-generate in format <strong>CLIENT-YYYY-NNN</strong>
              </p>
            </div>
          </div>

          {/* SECTION 2: Personal Information */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Combobox
                  options={[
                    { value: "Lord", label: "Lord" },
                    { value: "Professor", label: "Professor" },
                    { value: "Dr", label: "Dr" },
                    { value: "Sir", label: "Sir" },
                    { value: "Mr", label: "Mr" },
                    { value: "Lady", label: "Lady" },
                    { value: "Dame", label: "Dame" },
                    { value: "Miss", label: "Miss" },
                    { value: "Mrs", label: "Mrs" },
                    { value: "Ms", label: "Ms" },
                    { value: "Mx", label: "Mx" }
                  ]}
                  value={formData.title}
                  onValueChange={(value) => handleInputChange("title", value)}
                  placeholder="Select title..."
                  searchPlaceholder="Search titles..."
                  emptyText="No title found."
                />
              </div>
              <div>
                <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                <Input id="first_name" value={formData.first_name} onChange={e => handleInputChange("first_name", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                <Input id="last_name" value={formData.last_name} onChange={e => handleInputChange("last_name", e.target.value)} required />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input 
                  id="middle_name" 
                  value={formData.middle_name} 
                  onChange={e => handleInputChange("middle_name", e.target.value)}
                  placeholder="Middle name (optional)"
                />
              </div>
              <div>
                <Label htmlFor="pronouns">Pronouns</Label>
                <Input 
                  id="pronouns" 
                  value={formData.pronouns} 
                  onChange={e => handleInputChange("pronouns", e.target.value)}
                  placeholder="e.g., he/him, she/her, they/them"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="preferred_name">Preferred Name</Label>
              <Input 
                id="preferred_name" 
                value={formData.preferred_name} 
                onChange={e => handleInputChange("preferred_name", e.target.value)}
                placeholder="How would you like to be addressed?" 
              />
            </div>
          </div>

          {/* SECTION 3: Contact Information */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={e => handleInputChange("phone", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="telephone_number">Telephone</Label>
                <Input id="telephone_number" value={formData.telephone_number} onChange={e => handleInputChange("telephone_number", e.target.value)} placeholder="Telephone number" />
              </div>
            </div>
          </div>

          {/* SECTION 4: Address Information */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Address Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="house_no">House No/Name</Label>
                <Input 
                  id="house_no" 
                  value={formData.house_no} 
                  onChange={e => handleInputChange("house_no", e.target.value)}
                  placeholder="e.g., 123 or Apartment 4B"
                />
              </div>
              <div>
                <Label htmlFor="street">Street</Label>
                <Input 
                  id="street" 
                  value={formData.street} 
                  onChange={e => handleInputChange("street", e.target.value)}
                  placeholder="e.g., High Street"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  value={formData.city} 
                  onChange={e => handleInputChange("city", e.target.value)}
                  placeholder="e.g., London"
                />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Input 
                  id="county" 
                  value={formData.county} 
                  onChange={e => handleInputChange("county", e.target.value)}
                  placeholder="e.g., Greater London"
                />
              </div>
              <div>
                <Label htmlFor="pin_code">Postcode</Label>
                <Input 
                  id="pin_code" 
                  value={formData.pin_code} 
                  onChange={e => handleInputChange("pin_code", e.target.value)}
                  placeholder="e.g., MK9 1AA"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Personal Details */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Personal Details</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={value => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="New Enquiries">New Enquiries</SelectItem>
                    <SelectItem value="Actively Assessing">Actively Assessing</SelectItem>
                    <SelectItem value="Closed Enquiries">Closed Enquiries</SelectItem>
                    <SelectItem value="Former">Former</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={formData.region} onValueChange={value => handleInputChange("region", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="North">North</SelectItem>
                    <SelectItem value="South">South</SelectItem>
                    <SelectItem value="East">East</SelectItem>
                    <SelectItem value="West">West</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={e => handleInputChange("date_of_birth", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={value => handleInputChange("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age_group">Age Group <span className="text-red-500">*</span></Label>
                <Select value={formData.age_group} onValueChange={value => handleInputChange("age_group", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">Adult (18+ years)</SelectItem>
                    <SelectItem value="young_person">Young Person (0-17 years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SECTION 5: Emergency Contact */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Emergency Contact</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact">Emergency Contact Person</Label>
                <Input id="emergency_contact" value={formData.emergency_contact} onChange={e => handleInputChange("emergency_contact", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="emergency_phone">Emergency Phone</Label>
                <Input id="emergency_phone" value={formData.emergency_phone} onChange={e => handleInputChange("emergency_phone", e.target.value)} />
              </div>
            </div>
          </div>

          {/* SECTION 6: Medical Information */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Medical Information</h3>
            </div>
            
            <div>
              <Label htmlFor="gp_details">GP Details</Label>
              <Input id="gp_details" value={formData.gp_details} onChange={e => handleInputChange("gp_details", e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mobility_status">Mobility Status</Label>
                <Select value={formData.mobility_status} onValueChange={value => handleInputChange("mobility_status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mobility status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Independent">Independent</SelectItem>
                    <SelectItem value="Assisted">Assisted</SelectItem>
                    <SelectItem value="Wheelchair">Wheelchair</SelectItem>
                    <SelectItem value="Bed bound">Bed bound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="communication_preferences">Communication Preferences</Label>
                <Select value={formData.communication_preferences} onValueChange={value => handleInputChange("communication_preferences", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Post">Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SECTION 7: Additional Information */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Additional Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="other_identifier">Other Identifier</Label>
                <Input 
                  id="other_identifier" 
                  value={formData.other_identifier} 
                  onChange={e => handleInputChange("other_identifier", e.target.value)}
                  placeholder="Alternative ID or reference"
                />
              </div>
              <div>
                <Label htmlFor="referral_route">Referral Route</Label>
                <Input 
                  id="referral_route" 
                  value={formData.referral_route} 
                  onChange={e => handleInputChange("referral_route", e.target.value)}
                  placeholder="How did they find us?"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="additional_information">Additional Notes</Label>
              <Textarea id="additional_information" value={formData.additional_information} onChange={e => handleInputChange("additional_information", e.target.value)} rows={3} />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            {mode === 'add' && (
              <div className="text-sm text-muted-foreground">
                <span className={remainingSlots === 0 ? 'text-red-500 font-semibold' : remainingSlots <= 5 ? 'text-yellow-600' : ''}>
                  Remaining: {remainingSlots} / {maxClients} slots
                </span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (mode === 'edit' ? 'Updating...' : 'Adding...') 
                  : (mode === 'edit' ? 'Update Client' : 'Add Client')
                }
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};