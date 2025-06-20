
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTravelRateOptions } from '@/hooks/useParameterOptions';
import { useTravelRates } from '@/hooks/useKeyParameters';

interface TravelRateFormProps {
  onSubmit: (data: any) => void;
  defaultValues?: any;
}

export const TravelRateForm: React.FC<TravelRateFormProps> = ({
  onSubmit,
  defaultValues,
}) => {
  const { options: travelRateOptions, isLoading } = useTravelRateOptions();
  const { data: travelRates } = useTravelRates();
  
  const form = useForm({
    defaultValues: {
      travel_rate_id: '',
      distance_miles: 0,
      duration_hours: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      ...defaultValues,
    },
  });

  const selectedRateId = form.watch('travel_rate_id');
  const selectedRate = travelRates?.find(rate => rate.id === selectedRateId);

  const handleSubmit = (data: any) => {
    const calculatedCost = selectedRate ? 
      (data.distance_miles * selectedRate.rate_per_mile) + (data.duration_hours * selectedRate.rate_per_hour) : 0;
    
    onSubmit({
      ...data,
      calculated_cost: calculatedCost,
      rate_per_mile: selectedRate?.rate_per_mile || 0,
      rate_per_hour: selectedRate?.rate_per_hour || 0,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="travel_rate_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Travel Rate</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Loading rates..." : "Select travel rate"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {travelRateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedRate && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Rate: £{selectedRate.rate_per_mile}/mile, £{selectedRate.rate_per_hour}/hour
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="distance_miles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distance (miles)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="0.0" 
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
            name="duration_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="0.0" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Travel description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedRate && form.watch('distance_miles') > 0 || form.watch('duration_hours') > 0 ? (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-700">
              Estimated Cost: £{(
                (form.watch('distance_miles') * (selectedRate?.rate_per_mile || 0)) + 
                (form.watch('duration_hours') * (selectedRate?.rate_per_hour || 0))
              ).toFixed(2)}
            </p>
          </div>
        ) : null}

        <Button type="submit" className="w-full">
          Submit Travel Record
        </Button>
      </form>
    </Form>
  );
};
