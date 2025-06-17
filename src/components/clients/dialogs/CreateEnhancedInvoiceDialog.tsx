import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateEnhancedInvoice, UninvoicedBooking } from "@/hooks/useEnhancedClientBilling";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  tax_amount: z.number().min(0, "Tax amount must be positive"),
  currency: z.string().default("GBP"),
  payment_terms: z.string().default("30 days"),
  notes: z.string().optional(),
  booking_id: z.string().optional(),
  service_provided_date: z.string().optional(),
  line_items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0, "Unit price must be positive"),
    discount_amount: z.number().min(0, "Discount must be positive").optional(),
  })).min(1, "At least one line item is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateEnhancedInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  uninvoicedBookings?: UninvoicedBooking[];
}

export function CreateEnhancedInvoiceDialog({ 
  open, 
  onOpenChange, 
  clientId, 
  uninvoicedBookings = [] 
}: CreateEnhancedInvoiceDialogProps) {
  const [selectedBooking, setSelectedBooking] = useState<UninvoicedBooking | null>(null);
  const createInvoiceMutation = useCreateEnhancedInvoice();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      invoice_number: `INV-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tax_amount: 0,
      currency: "GBP",
      payment_terms: "30 days",
      notes: "",
      line_items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          discount_amount: 0,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  });

  const handleBookingSelect = (bookingId: string) => {
    const booking = uninvoicedBookings.find(b => b.booking_id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      form.setValue('booking_id', booking.booking_id);
      form.setValue('service_provided_date', booking.end_time.split('T')[0]);
      form.setValue('description', `Service: ${booking.service_title}`);
      form.setValue('line_items', [{
        description: booking.service_title,
        quantity: 1,
        unit_price: booking.revenue || 0,
        discount_amount: 0,
      }]);
    }
  };

  const calculateLineTotal = (index: number) => {
    const lineItem = form.watch(`line_items.${index}`);
    return (lineItem.quantity * lineItem.unit_price) - (lineItem.discount_amount || 0);
  };

  const calculateSubtotal = () => {
    return form.watch('line_items').reduce((sum, item) => 
      sum + (item.quantity * item.unit_price) - (item.discount_amount || 0), 0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (form.watch('tax_amount') || 0);
  };

  async function onSubmit(data: FormValues) {
    try {
      // Validate and transform line items to ensure required fields
      const validatedLineItems = data.line_items.map(item => ({
        service_id: undefined, // Optional field
        description: item.description || "", // Ensure it's not undefined
        quantity: item.quantity || 1, // Ensure it's not undefined
        unit_price: item.unit_price || 0, // Ensure it's not undefined
        discount_amount: item.discount_amount || 0,
      }));

      const invoiceData = {
        client_id: clientId,
        description: data.description,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        tax_amount: data.tax_amount,
        currency: data.currency,
        payment_terms: data.payment_terms,
        notes: data.notes,
        booking_id: data.booking_id,
        service_provided_date: data.service_provided_date,
        line_items: validatedLineItems,
      };
      
      await createInvoiceMutation.mutateAsync(invoiceData);
      form.reset();
      setSelectedBooking(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Plus className="h-5 w-5" />
            Create Enhanced Invoice
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive invoice with line items and detailed billing information
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Uninvoiced Services Section */}
            {uninvoicedBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Create from Uninvoiced Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={handleBookingSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service to invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {uninvoicedBookings.map((booking) => (
                        <SelectItem key={booking.booking_id} value={booking.booking_id}>
                          {booking.service_title} - {booking.client_name} (${booking.revenue})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Basic Invoice Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedBooking && (
                <FormField
                  control={form.control}
                  name="service_provided_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Provided Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line Items Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Invoice Line Items</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: "", quantity: 1, unit_price: 0, discount_amount: 0 })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.discount_amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-2 text-right">
                      <span className="text-sm font-medium">
                        Line Total: ${calculateLineTotal(index).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tax and Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tax_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${(form.watch('tax_amount') || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
