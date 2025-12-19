import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { useAuthorities } from '@/contexts/AuthoritiesContext';
import { useTravelRates } from '@/hooks/useTravelRates';
import {
  useClientAuthorityAccountingList,
  useCreateClientAuthorityAccounting,
  useUpdateClientAuthorityAccounting,
  useDeleteClientAuthorityAccounting,
  ClientAuthorityAccounting,
  ClientAuthorityAccountingInsert,
} from '@/hooks/useClientAuthorityAccounting';

const authorityAccountingSchema = z.object({
  authority_id: z.string().min(1, 'Authority is required'),
  reference_number: z.string().optional(),
  travel_rate_id: z.string().optional(),
  charge_based_on: z.enum(['planned_time', 'actual_time']).default('planned_time'),
  extra_time_calculation: z.boolean().default(false),
  client_contribution_required: z.boolean().default(false),
});

type AuthorityAccountingFormData = z.infer<typeof authorityAccountingSchema>;

interface AuthorityAccountingSettingsProps {
  clientId: string;
  branchId: string;
  organizationId?: string;
}

interface AuthorityEntryCardProps {
  entry?: ClientAuthorityAccounting;
  clientId: string;
  branchId: string;
  organizationId?: string;
  onSave: (data: ClientAuthorityAccountingInsert) => void;
  onUpdate: (id: string, data: Partial<AuthorityAccountingFormData>) => void;
  onDelete?: (id: string) => void;
  onCancel?: () => void;
  isNew?: boolean;
  isSaving?: boolean;
}

const AuthorityEntryCard: React.FC<AuthorityEntryCardProps> = ({
  entry,
  clientId,
  branchId,
  organizationId,
  onSave,
  onUpdate,
  onDelete,
  onCancel,
  isNew = false,
  isSaving = false,
}) => {
  const { authorities, isLoading: authoritiesLoading } = useAuthorities();
  const { data: travelRates = [], isLoading: travelRatesLoading } = useTravelRates(branchId);

  const form = useForm<AuthorityAccountingFormData>({
    resolver: zodResolver(authorityAccountingSchema),
    defaultValues: {
      authority_id: entry?.authority_id || '',
      reference_number: entry?.reference_number || '',
      travel_rate_id: entry?.travel_rate_id || '',
      charge_based_on: entry?.charge_based_on || 'planned_time',
      extra_time_calculation: entry?.extra_time_calculation || false,
      client_contribution_required: entry?.client_contribution_required || false,
    },
  });

  const handleSubmit = (data: AuthorityAccountingFormData) => {
    // Sanitize data: convert empty strings to undefined for optional fields
    const sanitizedData = {
      ...data,
      reference_number: data.reference_number || undefined,
      travel_rate_id: data.travel_rate_id || undefined,
    };

    if (isNew) {
      onSave({
        client_id: clientId,
        authority_id: sanitizedData.authority_id,
        reference_number: sanitizedData.reference_number,
        travel_rate_id: sanitizedData.travel_rate_id,
        charge_based_on: sanitizedData.charge_based_on,
        extra_time_calculation: sanitizedData.extra_time_calculation,
        client_contribution_required: sanitizedData.client_contribution_required,
        branch_id: branchId || undefined,
        organization_id: organizationId || undefined,
      });
    } else if (entry) {
      onUpdate(entry.id, sanitizedData);
    }
  };

  const selectedAuthority = authorities.find(a => a.id === form.watch('authority_id'));

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {isNew ? 'New Authority Entry' : (selectedAuthority?.organization || 'Authority Entry')}
            </CardTitle>
          </div>
          {!isNew && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entry!.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Authorities Dropdown */}
              <FormField
                control={form.control}
                name="authority_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authorities</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={authoritiesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select authority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {authorities.map((authority) => (
                          <SelectItem key={authority.id} value={authority.id}>
                            {authority.organization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reference Number */}
              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter reference number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Travel Dropdown */}
              <FormField
                control={form.control}
                name="travel_rate_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                      value={field.value || 'none'}
                      disabled={travelRatesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select travel rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {travelRates.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            {rate.title} - £{rate.rate_per_mile}/mile
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Charge Based On Radio */}
            <FormField
              control={form.control}
              name="charge_based_on"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you want to charge based on Planned Time or Actual Time?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-row space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="planned_time" id={`charge-planned-${entry?.id || 'new'}`} />
                        <Label htmlFor={`charge-planned-${entry?.id || 'new'}`}>Planned Time</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="actual_time" id={`charge-actual-${entry?.id || 'new'}`} />
                        <Label htmlFor={`charge-actual-${entry?.id || 'new'}`}>Actual Time</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Extra Time Calculation Radio */}
            <FormField
              control={form.control}
              name="extra_time_calculation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you want to calculate extra time?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === 'yes')}
                      value={field.value ? 'yes' : 'no'}
                      className="flex flex-row space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`extra-yes-${entry?.id || 'new'}`} />
                        <Label htmlFor={`extra-yes-${entry?.id || 'new'}`}>Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`extra-no-${entry?.id || 'new'}`} />
                        <Label htmlFor={`extra-no-${entry?.id || 'new'}`}>No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Contribution Required Radio */}
            <FormField
              control={form.control}
              name="client_contribution_required"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Is Client contribution required?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === 'yes')}
                      value={field.value ? 'yes' : 'no'}
                      className="flex flex-row space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`contribution-yes-${entry?.id || 'new'}`} />
                        <Label htmlFor={`contribution-yes-${entry?.id || 'new'}`}>Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`contribution-no-${entry?.id || 'new'}`} />
                        <Label htmlFor={`contribution-no-${entry?.id || 'new'}`}>No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              {isNew && onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? 'Saving...' : isNew ? 'Save Entry' : 'Update Entry'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export const AuthorityAccountingSettings: React.FC<AuthorityAccountingSettingsProps> = ({
  clientId,
  branchId,
  organizationId,
}) => {
  const [showNewEntry, setShowNewEntry] = useState(false);
  
  const { data: entries = [], isLoading } = useClientAuthorityAccountingList(clientId);
  const createMutation = useCreateClientAuthorityAccounting();
  const updateMutation = useUpdateClientAuthorityAccounting();
  const deleteMutation = useDeleteClientAuthorityAccounting();

  const handleCreate = (data: ClientAuthorityAccountingInsert) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowNewEntry(false),
    });
  };

  const handleUpdate = (id: string, updates: Partial<AuthorityAccountingFormData>) => {
    updateMutation.mutate({ id, clientId, updates });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this authority accounting entry?')) {
      deleteMutation.mutate({ id, clientId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading authority accounting settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Authority Accounting Settings
              </CardTitle>
              <CardDescription>
                Configure authority billing settings for this client
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowNewEntry(true)}
              disabled={showNewEntry}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* New Entry Form */}
      {showNewEntry && (
        <AuthorityEntryCard
          clientId={clientId}
          branchId={branchId}
          organizationId={organizationId}
          onSave={handleCreate}
          onUpdate={() => {}}
          onCancel={() => setShowNewEntry(false)}
          isNew={true}
          isSaving={createMutation.isPending}
        />
      )}

      {/* Existing Entries */}
      {entries.length === 0 && !showNewEntry ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No authority accounting entries found. Click "Add" to create one.
            </div>
          </CardContent>
        </Card>
      ) : (
        entries.map((entry) => (
          <AuthorityEntryCard
            key={entry.id}
            entry={entry}
            clientId={clientId}
            branchId={branchId}
            organizationId={organizationId}
            onSave={() => {}}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isSaving={updateMutation.isPending}
          />
        ))
      )}
    </div>
  );
};
