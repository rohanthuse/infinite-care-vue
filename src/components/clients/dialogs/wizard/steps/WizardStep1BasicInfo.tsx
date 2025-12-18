
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CalendarIcon, Stethoscope, Phone, Mail, MapPin, Building } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { StaffMultiSelect } from "@/components/ui/staff-multi-select";
import { EnhancedStaff } from "@/hooks/useSearchableStaff";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface WizardStep1BasicInfoProps {
  form: UseFormReturn<any>;
}

export function WizardStep1BasicInfo({ form }: WizardStep1BasicInfoProps) {
  const { id: branchId } = useParams();
  const [providerType, setProviderType] = React.useState<"staff" | "external">("staff");

  // Initialize staff_ids from existing staff_id for backward compatibility
  // This runs once on mount to handle legacy single-staff data
  const initializedRef = React.useRef(false);
  
  React.useEffect(() => {
    // Only run initialization once
    if (initializedRef.current) return;
    
    const existingStaffId = form.getValues('staff_id');
    const existingStaffIds = form.getValues('staff_ids');
    
    // If staff_ids already has data (loaded from junction table), don't overwrite
    if (existingStaffIds && existingStaffIds.length > 0) {
      console.log('[WizardStep1BasicInfo] staff_ids already populated:', existingStaffIds);
      initializedRef.current = true;
      return;
    }
    
    // If we have a single staff_id but no staff_ids array, initialize it (backward compat)
    if (existingStaffId && (!existingStaffIds || existingStaffIds.length === 0)) {
      console.log('[WizardStep1BasicInfo] Initializing staff_ids from legacy staff_id:', existingStaffId);
      form.setValue('staff_ids', [existingStaffId]);
      initializedRef.current = true;
    }
  }, [form]);

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'provider_type') {
        setProviderType(value.provider_type);
        if (value.provider_type === "staff") {
          form.setValue("provider_name", "");
        } else {
          form.setValue("staff_id", null);
          form.setValue("staff_ids", []);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleStaffSelectionChange = (ids: string[], staffData: EnhancedStaff[]) => {
    form.setValue('staff_ids', ids);
    // Set primary staff_id for backward compatibility
    form.setValue('staff_id', ids.length > 0 ? ids[0] : null);
    // Set provider_name as comma-separated list of names
    const names = staffData.map(s => s.full_name).join(', ');
    form.setValue('provider_name', names || '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">
          Essential details for creating a comprehensive care plan including personal information. Information has been pre-populated from the client's profile where available.
        </p>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Care Plan Title *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Comprehensive Personal Care Plan"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="provider_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="staff">Internal Staff Member</SelectItem>
                    <SelectItem value="external">External Provider</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {providerType === "staff" ? (
            <FormField
              control={form.control}
              name="staff_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Staff Members *</FormLabel>
                  <FormControl>
                    <StaffMultiSelect
                      branchId={branchId || ''}
                      selectedIds={field.value || []}
                      onChange={handleStaffSelectionChange}
                      placeholder="Select staff members..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="provider_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External Provider Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Dr. John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="care_plan_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Care Plan Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standard">Standard Care Plan</SelectItem>
                    <SelectItem value="intensive">Intensive Care Plan</SelectItem>
                    <SelectItem value="respite">Respite Care Plan</SelectItem>
                    <SelectItem value="palliative">Palliative Care Plan</SelectItem>
                    <SelectItem value="rehabilitation">Rehabilitation Plan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="review_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Review Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* GP Information Section */}
        <Card className="mt-8">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-green-600" />
              GP Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gp_info.gp_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GP Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter GP name" 
                        {...field} 
                      />
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
                    <FormLabel className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      GP Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter GP phone number" 
                        {...field} 
                      />
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
                    <FormLabel className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      GP Email
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter GP email" 
                        type="email"
                        {...field} 
                      />
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
                      <Input 
                        placeholder="Enter NHS number" 
                        {...field} 
                      />
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
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      GP Address
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter GP practice address" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pharmacy Contact Section */}
        <Card className="mt-6">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-600" />
              Pharmacy Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="pharmacy_info.pharmacy_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pharmacy Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter pharmacy name" 
                        {...field} 
                      />
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
                    <FormLabel className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter pharmacy phone number" 
                        {...field} 
                      />
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
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Pharmacy Address
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter pharmacy address" 
                        {...field} 
                      />
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
                    <FormLabel className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter pharmacy email" 
                        type="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </Form>
    </div>
  );
}
