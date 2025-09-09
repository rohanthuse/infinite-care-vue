import React from "react";
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
import { useClientPersonalInfo, useUpdateClientPersonalInfo } from "@/hooks/useClientPersonalInfo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Users, Stethoscope, FileText } from "lucide-react";

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
  const { data: personalInfo, isLoading } = useClientPersonalInfo(client?.id || '');
  const updatePersonalInfo = useUpdateClientPersonalInfo();
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Client Details - {client.first_name} {client.last_name}
          </DialogTitle>
          <DialogDescription>
            Update extended client information including emergency contacts, preferences, and GP details.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Emergency Contact Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="h-4 w-4" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </CardContent>
              </Card>

              {/* Next of Kin Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-4 w-4" />
                    Next of Kin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </CardContent>
              </Card>

              {/* GP Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="h-4 w-4" />
                    General Practitioner (GP)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </CardContent>
              </Card>

              {/* Preferences Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-4 w-4" />
                    Preferences & Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            placeholder="Enter any cultural preferences or requirements"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
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
                >
                  {updatePersonalInfo.isPending ? "Saving..." : "Save Details"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}