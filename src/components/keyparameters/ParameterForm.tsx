
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ParameterFormProps {
  parameterType: string;
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ParameterForm: React.FC<ParameterFormProps> = ({
  parameterType,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const form = useForm({
    defaultValues: {
      title: initialData?.title || '',
      status: initialData?.status || 'Active',
      fromDate: initialData?.from_date || '',
      ratePerMile: initialData?.rate_per_mile || 0,
      ratePerHour: initialData?.rate_per_hour || 0,
      userType: initialData?.user_type || '',
      type: initialData?.type || 'Increment',
      amount: initialData?.amount || 0,
      tax: initialData?.tax || 0,
      registeredBy: initialData?.registered_by || 'Admin',
      registeredOn: initialData?.registered_on || new Date().toISOString().split('T')[0],
    },
  });

  const handleSubmit = (data: any) => {
    // Transform data based on parameter type
    let transformedData = { ...data };
    
    if (parameterType === 'travel-rates') {
      transformedData = {
        title: data.title,
        status: data.status,
        from_date: data.fromDate,
        rate_per_mile: parseFloat(data.ratePerMile),
        rate_per_hour: parseFloat(data.ratePerHour),
        user_type: data.userType,
      };
    } else if (parameterType === 'expense-types') {
      transformedData = {
        title: data.title,
        status: data.status,
        type: data.type,
        amount: parseFloat(data.amount),
        tax: parseFloat(data.tax),
      };
    } else if (parameterType === 'bank-holidays') {
      transformedData = {
        title: data.title,
        status: data.status,
        registered_by: data.registeredBy,
        registered_on: data.registeredOn,
      };
    } else {
      transformedData = {
        title: data.title,
        status: data.status,
      };
    }

    onSubmit(transformedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {parameterType === 'travel-rates' && (
          <>
            <FormField
              control={form.control}
              name="fromDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ratePerMile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per Mile (£)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ratePerHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per Hour (£)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user type" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {parameterType === 'expense-types' && (
          <>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Increment">Increment</SelectItem>
                      <SelectItem value="Decrement">Decrement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (£)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate (0-1)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" max="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {parameterType === 'bank-holidays' && (
          <>
            <FormField
              control={form.control}
              name="registeredBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered By</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter registered by" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="registeredOn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered On</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
