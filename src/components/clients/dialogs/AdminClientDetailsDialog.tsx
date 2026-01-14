import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useControlledDialog } from "@/hooks/useDialogManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; 
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientTabBar } from "@/components/clients/ClientTabBar";
import { PersonalInfoTab } from "@/components/clients/tabs/PersonalInfoTab";
import { CarePlansTab } from "@/components/clients/tabs/CarePlansTab";
import { ClientNews2Tab } from "@/components/clients/tabs/ClientNews2Tab";
import { ClientAccountingTab } from "@/components/clients/tabs/ClientAccountingTab";
import { AppointmentsTab } from "@/components/clients/tabs/AppointmentsTab";
import { HandoverSummaryTab } from "@/components/clients/tabs/HandoverSummaryTab";
import { useClientBookings } from "@/hooks/useClientBookings";
import { EntityDocumentsSection } from "@/components/documents/EntityDocumentsSection";
import { useClientPersonalInfo, useUpdateClientPersonalInfo } from "@/hooks/useClientPersonalInfo";
import { useClientMedicalInfo } from "@/hooks/useClientMedicalInfo";
import { useUpdateClient } from "@/hooks/useUpdateClient";
import { useServiceRates } from "@/hooks/useAccountingData";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Users, Stethoscope, FileText, Mail, MapPin, Calendar, UserCheck, X, Plus, BarChart3, Clock, PoundSterling, Activity, MessageCircle, CreditCard, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  preferred_communication: z.string().optional(),
  cultural_preferences: z.string().optional(),
  language_preferences: z.string().optional(),
  religion: z.string().optional(),
  marital_status: z.string().optional(),
  next_of_kin_name: z.string().optional(),
  next_of_kin_phone: z.string().optional(),
  next_of_kin_relationship: z.string().optional(),
  gp_name: z.string().optional(),
  gp_practice: z.string().optional(),
  gp_phone: z.string().optional(),
  // General information fields
  main_reasons_for_care: z.string().optional(),
  used_other_care_providers: z.boolean().optional(),
  fallen_past_six_months: z.boolean().optional(),
  has_assistance_device: z.boolean().optional(),
  arrange_assistance_device: z.boolean().optional(),
  bereavement_past_two_years: z.boolean().optional(),
  warnings: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
  important_occasions: z.array(z.object({
    occasion: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AdminClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
}

export function AdminClientDetailsDialog({
  open,
  onOpenChange,
  client,
}: AdminClientDetailsDialogProps) {
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState("profile");
  
  // Use controlled dialog for proper cleanup and route change handling
  const dialogId = `admin-client-details-${client?.id || 'unknown'}`;
  const controlledDialog = useControlledDialog(dialogId, open);
  
  // Sync with external open/onOpenChange props
  React.useEffect(() => {
    if (open !== controlledDialog.open) {
      controlledDialog.onOpenChange(open);
    }
  }, [open, controlledDialog.open, controlledDialog.onOpenChange]);
  
  React.useEffect(() => {
    onOpenChange(controlledDialog.open);
  }, [controlledDialog.open, onOpenChange]);
  
  // Dynamic array handlers for General Information
  const handleAddWarning = () => {
    const current = form.getValues("warnings") || [];
    form.setValue("warnings", [...current, ""]);
  };

  const handleRemoveWarning = (index: number) => {
    const current = form.getValues("warnings") || [];
    form.setValue("warnings", current.filter((_, i) => i !== index));
  };

  const handleAddInstruction = () => {
    const current = form.getValues("instructions") || [];
    form.setValue("instructions", [...current, ""]);
  };

  const handleRemoveInstruction = (index: number) => {
    const current = form.getValues("instructions") || [];
    form.setValue("instructions", current.filter((_, i) => i !== index));
  };

  const handleAddOccasion = () => {
    const current = form.getValues("important_occasions") || [];
    form.setValue("important_occasions", [...current, { occasion: "", date: "" }]);
  };

  const handleRemoveOccasion = (index: number) => {
    const current = form.getValues("important_occasions") || [];
    form.setValue("important_occasions", current.filter((_, i) => i !== index));
  };
  
  const { data: personalInfo, isLoading } = useClientPersonalInfo(client?.id || '');
  const { data: medicalInfo } = useClientMedicalInfo(client?.id || '');
  const { data: serviceRates = [] } = useServiceRates(client?.branch_id);
  const { data: clientBookings = [] } = useClientBookings(client?.id || '');
  const updatePersonalInfo = useUpdateClientPersonalInfo();
  const updateClient = useUpdateClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
      preferred_communication: "",
      cultural_preferences: "",
      language_preferences: "",
      religion: "",
      marital_status: "",
      next_of_kin_name: "",
      next_of_kin_phone: "",
      next_of_kin_relationship: "",
      gp_name: "",
      gp_practice: "",
      gp_phone: "",
      main_reasons_for_care: "",
      used_other_care_providers: false,
      fallen_past_six_months: false,
      has_assistance_device: false,
      arrange_assistance_device: false,
      bereavement_past_two_years: false,
      warnings: [],
      instructions: [],
      important_occasions: [],
    },
  });

  // Update form when personal info loads
  React.useEffect(() => {
    if (personalInfo) {
      form.reset({
        emergency_contact_name: personalInfo.emergency_contact_name || "",
        emergency_contact_phone: personalInfo.emergency_contact_phone || "",
        emergency_contact_relationship: personalInfo.emergency_contact_relationship || "",
        preferred_communication: personalInfo.preferred_communication || "",
        cultural_preferences: personalInfo.cultural_preferences || "",
        language_preferences: personalInfo.language_preferences || "",
        religion: personalInfo.religion || "",
        marital_status: personalInfo.marital_status || "",
        next_of_kin_name: personalInfo.next_of_kin_name || "",
        next_of_kin_phone: personalInfo.next_of_kin_phone || "",
        next_of_kin_relationship: personalInfo.next_of_kin_relationship || "",
        gp_name: personalInfo.gp_name || "",
        gp_practice: personalInfo.gp_practice || "",
        gp_phone: personalInfo.gp_phone || "",
        main_reasons_for_care: personalInfo.main_reasons_for_care || "",
        used_other_care_providers: personalInfo.used_other_care_providers || false,
        fallen_past_six_months: personalInfo.fallen_past_six_months || false,
        has_assistance_device: personalInfo.has_assistance_device || false,
        arrange_assistance_device: personalInfo.arrange_assistance_device || false,
        bereavement_past_two_years: personalInfo.bereavement_past_two_years || false,
        warnings: personalInfo.warnings || [],
        instructions: personalInfo.instructions || [],
        important_occasions: personalInfo.important_occasions || [],
      });
    }
  }, [personalInfo, form]);

  const onSubmit = (data: FormData) => {
    if (!client?.id) return;

    updatePersonalInfo.mutate(
      {
        client_id: client.id,
        ...data,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Client details updated successfully",
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update client details",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!client) return null;

  return (
    <Dialog open={controlledDialog.open} onOpenChange={controlledDialog.onOpenChange}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] p-0 overflow-hidden"
        onEscapeKeyDown={() => controlledDialog.onOpenChange(false)}
        onPointerDownOutside={() => controlledDialog.onOpenChange(false)}
      >
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            Client Details - {client.first_name} {client.last_name}
          </DialogTitle>
          <DialogDescription>
            View and manage comprehensive client information, care plans, and personal details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(95vh-80px)]">
          {/* Left Panel - Client Information */}
          <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-6">
                {/* Client Summary Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-4 w-4" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{client.first_name} {client.last_name}</span>
                      </div>
                      
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      
                      {client.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-2">{client.address}</span>
                        </div>
                      )}
                      
                      {client.date_of_birth && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>DOB: {new Date(client.date_of_birth).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Current Personal Info Summary */}
                {personalInfo && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Current Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {personalInfo.emergency_contact_name && (
                        <div>
                          <span className="font-medium">Emergency: </span>
                          <span>{personalInfo.emergency_contact_name}</span>
                        </div>
                      )}
                      {personalInfo.gp_name && (
                        <div>
                          <span className="font-medium">GP: </span>
                          <span>{personalInfo.gp_name}</span>
                        </div>
                      )}
                      {personalInfo.preferred_communication && (
                        <div>
                          <span className="font-medium">Prefers: </span>
                          <span className="capitalize">{personalInfo.preferred_communication}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Tabbed Content */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex flex-col h-full">
              <div className="border-b border-border px-6 py-4">
                <ClientTabBar 
                  activeTab={activeMainTab}
                  onChange={setActiveMainTab}
                />
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="min-h-full">
                <TabsContent value="overview" className="mt-0 p-6">
                  <div className="space-y-6">
                    {/* Client Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Registration Length Card */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Registration Length</p>
                              <p className="text-lg font-semibold">
                                {client.registered_on || client.created_at 
                                  ? formatDistanceToNow(new Date(client.registered_on || client.created_at), { addSuffix: false })
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Contact Information Card */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Contact Methods</p>
                              <p className="text-lg font-semibold">
                                {[client.email, client.mobile_number, client.telephone_number, client.phone].filter(Boolean).length || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Location Card */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Location</p>
                              <p className="text-sm font-semibold truncate">
                                {client.address || client.region || "Not specified"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Active Rates Card */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <PoundSterling className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Active Rates</p>
                              <p className="text-lg font-semibold">
                                {serviceRates.filter(rate => rate.status === 'active').length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Total Appointments Card */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Total Appointments</p>
                              <p className="text-lg font-semibold">
                                {clientBookings.length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Client Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Basic Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Joined On:</span>
                              <p className="font-medium">
                                {client.registered_on 
                                  ? new Date(client.registered_on).toLocaleDateString()
                                  : client.created_at 
                                    ? new Date(client.created_at).toLocaleDateString()
                                    : "Not available"}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Status:</span>
                              <p className="font-medium capitalize">{client.status || "Active"}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Active From:</span>
                              <p className="font-medium">
                                {client.active_from 
                                  ? new Date(client.active_from).toLocaleDateString('en-GB')
                                  : "Not set"}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Active Until:</span>
                              <p className={`font-medium ${
                                client.active_until && new Date(client.active_until) < new Date()
                                  ? 'text-destructive'
                                  : ''
                              }`}>
                                {client.active_until 
                                  ? new Date(client.active_until).toLocaleDateString('en-GB')
                                  : "Not set"}
                                {client.active_until && new Date(client.active_until) < new Date() && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive text-destructive-foreground">
                                    Expired
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Email:</span>
                              <p className="font-medium">{client.email || "Not provided"}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Mobile:</span>
                              <p className="font-medium">{client.mobile_number || client.phone || "Not provided"}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Telephone:</span>
                              <p className="font-medium">{client.telephone_number || "Not provided"}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Location:</span>
                              <p className="font-medium">{client.address || client.region || "Not specified"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Service Rates Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Service Rates Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {serviceRates.length > 0 ? (
                            <div className="space-y-3">
                              {serviceRates.slice(0, 5).map((rate) => (
                                <div key={rate.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                  <div>
                                    <p className="font-medium text-sm">{rate.service_name}</p>
                                    <p className="text-xs text-muted-foreground">{rate.rate_type}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-sm">{formatCurrency(rate.amount)}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{rate.status}</p>
                                  </div>
                                </div>
                              ))}
                              {serviceRates.length > 5 && (
                                <p className="text-xs text-center text-muted-foreground pt-2">
                                  +{serviceRates.length - 5} more rates available in Rates tab
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-sm text-muted-foreground">No service rates configured</p>
                              <p className="text-xs text-muted-foreground mt-1">Rates can be added in the Rates tab</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="mt-0 p-6">
                  <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                      <TabsTrigger value="extended">Extended Details</TabsTrigger>
                      <TabsTrigger value="general">General Information</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile" className="mt-6">
                      <PersonalInfoTab
                        client={client}
                      />
                    </TabsContent>
                    
                    <TabsContent value="extended" className="mt-6">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                          {/* Emergency Contact Section */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Phone className="h-4 w-4 text-primary" />
                              <h3 className="text-lg font-semibold">Emergency Contact</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="emergency_contact_name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter emergency contact name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="emergency_contact_phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Phone</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter phone number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="emergency_contact_relationship"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Relationship</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select relationship" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="spouse">Spouse</SelectItem>
                                      <SelectItem value="partner">Partner</SelectItem>
                                      <SelectItem value="parent">Parent</SelectItem>
                                      <SelectItem value="child">Child</SelectItem>
                                      <SelectItem value="sibling">Sibling</SelectItem>
                                      <SelectItem value="friend">Friend</SelectItem>
                                      <SelectItem value="carer">Carer</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator />

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3 pt-6 border-t border-border">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => onOpenChange(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={updatePersonalInfo.isPending}
                            >
                              {updatePersonalInfo.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </TabsContent>
                    
                    <TabsContent value="general" className="mt-6">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                          {/* Care & Support Section */}
                          <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900">Care & Support</h3>
                            
                            <FormField
                              control={form.control}
                              name="main_reasons_for_care"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Main reasons for arranging care and support?</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Please describe the main reasons for arranging care and support..."
                                      className="min-h-[100px]"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="used_other_care_providers"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center justify-between">
                                      <FormLabel>Have you previously used other care providers?</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={(value) => field.onChange(value === "true")}
                                          value={field.value ? "true" : "false"}
                                          className="flex space-x-6"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id="used_providers_yes" />
                                            <Label htmlFor="used_providers_yes">Yes</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id="used_providers_no" />
                                            <Label htmlFor="used_providers_no">No</Label>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="fallen_past_six_months"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center justify-between">
                                      <FormLabel>Have you had any falls in the past 6 months?</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={(value) => field.onChange(value === "true")}
                                          value={field.value ? "true" : "false"}
                                          className="flex space-x-6"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id="fallen_yes" />
                                            <Label htmlFor="fallen_yes">Yes</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id="fallen_no" />
                                            <Label htmlFor="fallen_no">No</Label>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="has_assistance_device"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center justify-between">
                                      <FormLabel>Do you have any assistance devices (e.g., walking frame, mobility scooter)?</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={(value) => field.onChange(value === "true")}
                                          value={field.value ? "true" : "false"}
                                          className="flex space-x-6"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id="has_device_yes" />
                                            <Label htmlFor="has_device_yes">Yes</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id="has_device_no" />
                                            <Label htmlFor="has_device_no">No</Label>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="arrange_assistance_device"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center justify-between">
                                      <FormLabel>Would you like us to arrange an assistance device for you?</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={(value) => field.onChange(value === "true")}
                                          value={field.value ? "true" : "false"}
                                          className="flex space-x-6"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id="arrange_device_yes" />
                                            <Label htmlFor="arrange_device_yes">Yes</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id="arrange_device_no" />
                                            <Label htmlFor="arrange_device_no">No</Label>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="bereavement_past_two_years"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center justify-between">
                                      <FormLabel>Have you experienced any bereavements in the past 2 years?</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={(value) => field.onChange(value === "true")}
                                          value={field.value ? "true" : "false"}
                                          className="flex space-x-6"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id="bereavement_yes" />
                                            <Label htmlFor="bereavement_yes">Yes</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id="bereavement_no" />
                                            <Label htmlFor="bereavement_no">No</Label>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Warning And Instructions Section */}
                          <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900">Warning And Instructions</h3>
                            
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-sm font-medium">Warning:</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddWarning}
                                    className="text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Warning
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {(form.watch("warnings") || []).map((warning: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input
                                        placeholder="Enter warning..."
                                        value={warning}
                                        onChange={(e) => {
                                          const newWarnings = [...(form.getValues("warnings") || [])];
                                          newWarnings[index] = e.target.value;
                                          form.setValue("warnings", newWarnings);
                                        }}
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveWarning(index)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  {(form.watch("warnings") || []).length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No warnings added yet.</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-sm font-medium">Instructions:</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddInstruction}
                                    className="text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Instruction
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {(form.watch("instructions") || []).map((instruction: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input
                                        placeholder="Enter instruction..."
                                        value={instruction}
                                        onChange={(e) => {
                                          const newInstructions = [...(form.getValues("instructions") || [])];
                                          newInstructions[index] = e.target.value;
                                          form.setValue("instructions", newInstructions);
                                        }}
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveInstruction(index)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  {(form.watch("instructions") || []).length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No instructions added yet.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Important Occasions Section */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900">Important Occasions</h3>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddOccasion}
                                className="text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                            
                            <div className="border rounded-lg">
                              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b font-medium text-sm">
                                <div>Occasion</div>
                                <div>Date</div>
                                <div>Actions</div>
                              </div>
                              
                              {(form.watch("important_occasions") || []).length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                  No records found
                                </div>
                              ) : (
                                <div className="divide-y">
                                  {(form.watch("important_occasions") || []).map((occasion: any, index: number) => (
                                    <div key={index} className="grid grid-cols-3 gap-4 p-4 items-center">
                                      <Input
                                        placeholder="Occasion name..."
                                        value={occasion.occasion || ""}
                                        onChange={(e) => {
                                          const newOccasions = [...(form.getValues("important_occasions") || [])];
                                          newOccasions[index] = { ...newOccasions[index], occasion: e.target.value };
                                          form.setValue("important_occasions", newOccasions);
                                        }}
                                      />
                                      <Input
                                        type="date"
                                        value={occasion.date || ""}
                                        onChange={(e) => {
                                          const newOccasions = [...(form.getValues("important_occasions") || [])];
                                          newOccasions[index] = { ...newOccasions[index], date: e.target.value };
                                          form.setValue("important_occasions", newOccasions);
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveOccasion(index)}
                                        className="text-red-500 hover:text-red-700 justify-start"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3 pt-6 border-t border-border">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => onOpenChange(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={updatePersonalInfo.isPending}
                            >
                              {updatePersonalInfo.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="general" className="mt-0 p-6">
                  <ClientAccountingTab 
                    clientId={client.id} 
                    branchId={client.branch_id}
                  />
                </TabsContent>

                <TabsContent value="news2" className="mt-0 p-6">
                  <ClientNews2Tab clientId={client.id} />
                </TabsContent>

                <TabsContent value="careplans" className="mt-0 p-6">
                  <CarePlansTab clientId={client.id} />
                </TabsContent>

                <TabsContent value="notes" className="mt-0 p-6">
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">Client Notes</h3>
                    <p className="text-sm text-muted-foreground mt-2">Notes management coming soon...</p>
                  </div>
                </TabsContent>

                <TabsContent value="handover" className="mt-0 p-6">
                  <HandoverSummaryTab 
                    clientId={client.id}
                    clientName={`${client.first_name} ${client.last_name}`}
                    clientPhone={client.phone || client.mobile_number || undefined}
                    clientAddress={client.address || undefined}
                    branchId={client.branch_id}
                  />
                </TabsContent>

                <TabsContent value="documents" className="mt-0 p-6">
                  <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                    <EntityDocumentsSection 
                      entityType="client"
                      entityId={client.id}
                      showAdminSection={true}
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="appointments" className="mt-0 p-6">
                  <AppointmentsTab 
                    clientId={client.id} 
                    clientName={`${client.first_name} ${client.last_name}`} 
                  />
                </TabsContent>

                <TabsContent value="billing" className="mt-0 p-6">
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">Billing Information</h3>
                    <p className="text-sm text-muted-foreground mt-2">Billing and invoice management coming soon...</p>
                  </div>
                </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}