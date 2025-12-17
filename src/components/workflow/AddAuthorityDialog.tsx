import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Building2, User, FileText, Settings } from "lucide-react";

const phoneRegex = /^[\d\s\-\+\(\)]*$/;

const formSchema = z.object({
  // Section 1: Authority Info
  organization: z.string().min(1, "Organization is required"),
  telephone: z.string().regex(phoneRegex, "Invalid phone number").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  
  // Section 2: Key Contact
  contactName: z.string().optional(),
  contactPhone: z.string().regex(phoneRegex, "Invalid phone number").optional().or(z.literal("")),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  
  // Section 3: Authority Invoice Configuration
  invoiceSetting: z.string().optional(),
  invoiceNameDisplay: z.string().optional(),
  billingAddress: z.string().optional(),
  invoiceEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  
  // Section 4: CM2000 Integration
  needsCM2000: z.boolean().default(false),
  cm2000Organization: z.string().optional(),
  cm2000Telephone: z.string().regex(phoneRegex, "Invalid phone number").optional().or(z.literal("")),
  cm2000Address: z.string().optional(),
  cm2000Email: z.string().email("Invalid email address").optional().or(z.literal("")),
  cm2000BillingAddress: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddAuthorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddAuthorityDialog = ({ open, onOpenChange }: AddAuthorityDialogProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization: "",
      telephone: "",
      email: "",
      address: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      invoiceSetting: "",
      invoiceNameDisplay: "",
      billingAddress: "",
      invoiceEmail: "",
      needsCM2000: false,
      cm2000Organization: "",
      cm2000Telephone: "",
      cm2000Address: "",
      cm2000Email: "",
      cm2000BillingAddress: "",
    },
  });

  const needsCM2000 = form.watch("needsCM2000");

  const onSubmit = (data: FormValues) => {
    console.log("Authority form data:", data);
    toast({
      title: "Authority Added",
      description: `${data.organization} has been added successfully.`,
    });
    form.reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Authority Information</DialogTitle>
        </DialogHeader>

        <div className="px-6">
          <Form {...form}>
            <form id="authority-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              {/* Section 1: Authority Info */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Authority Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter organization name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="telephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telephone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter full address" 
                            className="min-h-[80px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section 2: Key Contact */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Key Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter contact email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Authority Invoice Configuration */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Authority Invoice Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="invoiceSetting"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select invoice setting</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an invoice setting" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard Invoice</SelectItem>
                            <SelectItem value="detailed">Detailed Invoice</SelectItem>
                            <SelectItem value="summary">Summary Invoice</SelectItem>
                            <SelectItem value="custom">Custom Invoice</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoiceNameDisplay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select how you want names to appear in the invoices</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select name display option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="initials">Initials</SelectItem>
                            <SelectItem value="full_name">Full Name</SelectItem>
                            <SelectItem value="none">No initials or Name</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter billing address" 
                            className="min-h-[80px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="invoiceEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter invoice email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section 4: CM2000 Integration */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    CM2000 Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">CM2000</p>
                  <FormField
                    control={form.control}
                    name="needsCM2000"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-normal">
                            Does this authority need to send data to CM2000?
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {needsCM2000 && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <FormField
                        control={form.control}
                        name="cm2000Organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter CM2000 organization" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cm2000Telephone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telephone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter CM2000 telephone" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="cm2000Email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter CM2000 email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="cm2000Address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter CM2000 address" 
                                className="min-h-[80px] resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cm2000BillingAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billing Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter CM2000 billing address" 
                                className="min-h-[80px] resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <div className="sticky bottom-0 z-10 bg-background px-6 py-4 border-t flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" form="authority-form">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAuthorityDialog;
