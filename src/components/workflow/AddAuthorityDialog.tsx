import React from "react";
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
});

type FormValues = z.infer<typeof formSchema>;

export interface AuthorityData {
  id: string;
  organization: string;
  telephone: string;
  contactName: string;
  address: string;
  needsCM2000: boolean;
}

export type DialogMode = 'add' | 'view' | 'edit';

interface AddAuthorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: AuthorityData) => void;
  mode?: DialogMode;
  initialData?: AuthorityData | null;
}

export const AddAuthorityDialog = ({ 
  open, 
  onOpenChange, 
  onSave, 
  mode = 'add',
  initialData 
}: AddAuthorityDialogProps) => {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization: initialData?.organization || "",
      telephone: initialData?.telephone || "",
      email: "",
      address: initialData?.address || "",
      contactName: initialData?.contactName || "",
      contactPhone: "",
      contactEmail: "",
      invoiceSetting: "",
      invoiceNameDisplay: "",
      billingAddress: "",
      invoiceEmail: "",
      needsCM2000: initialData?.needsCM2000 || false,
    },
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (open && initialData) {
      form.reset({
        organization: initialData.organization || "",
        telephone: initialData.telephone || "",
        email: "",
        address: initialData.address || "",
        contactName: initialData.contactName || "",
        contactPhone: "",
        contactEmail: "",
        invoiceSetting: "",
        invoiceNameDisplay: "",
        billingAddress: "",
        invoiceEmail: "",
        needsCM2000: initialData.needsCM2000 || false,
      });
    } else if (open && !initialData) {
      form.reset({
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
      });
    }
  }, [open, initialData, form]);

  const onSubmit = (data: FormValues) => {
    const authorityData: AuthorityData = {
      id: isEditMode && initialData ? initialData.id : crypto.randomUUID(),
      organization: data.organization,
      telephone: data.telephone || "",
      contactName: data.contactName || "",
      address: data.address || "",
      needsCM2000: data.needsCM2000,
    };
    
    onSave?.(authorityData);
    
    toast({
      title: isEditMode ? "Authority Updated" : "Authority Added",
      description: `${data.organization} has been ${isEditMode ? 'updated' : 'added'} successfully.`,
    });
    form.reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'view': return 'View Authority';
      case 'edit': return 'Edit Authority';
      default: return 'Authority Information';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">{getDialogTitle()}</DialogTitle>
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
                          <Input placeholder="Enter organization name" {...field} disabled={isViewMode} />
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
                            <Input placeholder="Enter phone number" {...field} disabled={isViewMode} />
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
                            <Input type="email" placeholder="Enter email address" {...field} disabled={isViewMode} />
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
                            disabled={isViewMode}
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
                          <Input placeholder="Enter contact name" {...field} disabled={isViewMode} />
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
                            <Input placeholder="Enter contact phone" {...field} disabled={isViewMode} />
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
                            <Input type="email" placeholder="Enter contact email" {...field} disabled={isViewMode} />
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger disabled={isViewMode}>
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger disabled={isViewMode}>
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
                            disabled={isViewMode}
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
                          <Input type="email" placeholder="Enter invoice email" {...field} disabled={isViewMode} />
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
                <CardContent>
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
                            disabled={isViewMode}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-background px-6 py-4 border-t flex justify-end gap-3">
          {isViewMode ? (
            <Button type="button" variant="outline" onClick={handleCancel}>
              Close
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" form="authority-form">
                Save
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAuthorityDialog;
