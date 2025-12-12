import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Stethoscope, Phone, Mail, MapPin, Building } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WizardStepGPPharmacyProps {
  form: UseFormReturn<any>;
}

export function WizardStepGPPharmacy({ form }: WizardStepGPPharmacyProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">GP & Pharmacy Information</h2>
        <p className="text-gray-600">
          Enter details for the client's GP and pharmacy contacts.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* GP Information */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">GP Information</CardTitle>
              </div>
              <CardDescription>General Practitioner details</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gp_info.gp_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GP Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gp_info.gp_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GP Phone Number</FormLabel>
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

                <FormField
                  control={form.control}
                  name="gp_info.gp_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GP Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="gp@surgery.nhs.uk" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gp_info.nhs_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NHS Number</FormLabel>
                      <FormControl>
                        <Input placeholder="XXX XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gp_info.gp_address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>GP Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Full practice address" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pharmacy Information */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Pharmacy Contact</CardTitle>
              </div>
              <CardDescription>Pharmacy details for prescriptions</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pharmacy_info.pharmacy_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pharmacy Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Boots Pharmacy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pharmacy_info.pharmacy_phone"
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

                <FormField
                  control={form.control}
                  name="pharmacy_info.pharmacy_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="pharmacy@email.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pharmacy_info.pharmacy_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pharmacy Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Full pharmacy address" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
}
