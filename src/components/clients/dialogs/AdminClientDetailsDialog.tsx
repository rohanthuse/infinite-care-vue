import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { PersonalInfoTab } from "@/components/care/tabs/PersonalInfoTab";
import { useClientPersonalInfo, useUpdateClientPersonalInfo } from "@/hooks/useClientPersonalInfo";
import { useClientMedicalInfo } from "@/hooks/useClientMedicalInfo";
import { useUpdateClient } from "@/hooks/useUpdateClient";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Users, Stethoscope, FileText, Mail, MapPin, Calendar, UserCheck } from "lucide-react";

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
  const [activeMainTab, setActiveMainTab] = useState("personal");
  const [activeSubTab, setActiveSubTab] = useState("profile");
  
  const { data: personalInfo, isLoading } = useClientPersonalInfo(client?.id || '');
  const { data: medicalInfo } = useClientMedicalInfo(client?.id || '');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            Client Details - {client.first_name} {client.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-full">
          {/* Left Panel - Client Information */}
          <div className="w-80 border-r border-border bg-muted/30">
            <ScrollArea className="h-[calc(90vh-80px)]">
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
            <div className="border-b border-border px-6 py-4">
              <ClientTabBar 
                activeTab={activeMainTab}
                onChange={setActiveMainTab}
              />
            </div>

            <ScrollArea className="flex-1">
              {/* Personal Info Tab */}
              {activeMainTab === "personal" && (
                <div className="p-6">
                  <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                      <TabsTrigger value="extended">Extended Details</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile" className="mt-6">
                      <PersonalInfoTab
                        client={client}
                        personalInfo={personalInfo}
                        medicalInfo={medicalInfo}
                        onEditPersonalInfo={() => {
                          // Handle client profile editing
                          console.log("Edit personal info clicked");
                        }}
                        onEditMedicalInfo={() => {
                          // Handle medical info editing
                          console.log("Edit medical info clicked");
                        }}
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

                          {/* Next of Kin Section */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Users className="h-4 w-4 text-primary" />
                              <h3 className="text-lg font-semibold">Next of Kin</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="next_of_kin_name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Next of Kin Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter next of kin name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="next_of_kin_phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Next of Kin Phone</FormLabel>
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
                              name="next_of_kin_relationship"
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
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator />

                          {/* GP Information Section */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Stethoscope className="h-4 w-4 text-primary" />
                              <h3 className="text-lg font-semibold">General Practitioner (GP)</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="gp_name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>GP Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter GP name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="gp_phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>GP Phone</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter GP phone number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="gp_practice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GP Practice</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter GP practice name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator />

                          {/* Preferences Section */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <FileText className="h-4 w-4 text-primary" />
                              <h3 className="text-lg font-semibold">Preferences & Information</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="preferred_communication"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Preferred Communication</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select preference" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="text">Text Message</SelectItem>
                                        <SelectItem value="letter">Letter</SelectItem>
                                        <SelectItem value="face-to-face">Face to Face</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="language_preferences"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Language Preferences</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter preferred language" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="religion"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Religion</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter religion" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="marital_status"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Marital Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="single">Single</SelectItem>
                                        <SelectItem value="married">Married</SelectItem>
                                        <SelectItem value="divorced">Divorced</SelectItem>
                                        <SelectItem value="widowed">Widowed</SelectItem>
                                        <SelectItem value="separated">Separated</SelectItem>
                                        <SelectItem value="partner">In Partnership</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="cultural_preferences"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cultural Preferences</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter cultural preferences and considerations" 
                                      className="min-h-[80px]"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3 pt-6 border-t border-border">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => onOpenChange(false)}
                              disabled={updatePersonalInfo.isPending}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={updatePersonalInfo.isPending}
                              className="min-w-[100px]"
                            >
                              {updatePersonalInfo.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Other Main Tabs - Placeholder content */}
              {activeMainTab === "notes" && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Notes & Communications</h3>
                    <p className="text-sm text-muted-foreground">This section will contain client notes and communication history.</p>
                  </div>
                </div>
              )}

              {activeMainTab === "documents" && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Documents & Files</h3>
                    <p className="text-sm text-muted-foreground">This section will contain client documents and file uploads.</p>
                  </div>
                </div>
              )}

              {activeMainTab === "appointments" && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Appointments & Scheduling</h3>
                    <p className="text-sm text-muted-foreground">This section will contain appointment scheduling and history.</p>
                  </div>
                </div>
              )}

              {activeMainTab === "billing" && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Billing & Payments</h3>
                    <p className="text-sm text-muted-foreground">This section will contain billing information and payment history.</p>
                  </div>
                </div>
              )}

              {activeMainTab === "careplans" && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Care Plans</h3>
                    <p className="text-sm text-muted-foreground">This section will contain care plan details and management.</p>
                  </div>
                </div>
              )}

              {activeMainTab === "eventslogs" && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Events & Activity Logs</h3>
                    <p className="text-sm text-muted-foreground">This section will contain activity logs and event history.</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}