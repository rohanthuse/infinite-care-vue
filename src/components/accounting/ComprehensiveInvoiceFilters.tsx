import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  SafeSelectWrapper as Select,
  SafeSelectContent as SelectContent,
  SafeSelectItem as SelectItem,
  SafeSelectTrigger as SelectTrigger,
  SafeSelectValue as SelectValue,
} from '@/components/ui/safe-select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useAuthoritiesForBilling } from '@/hooks/useAuthorities';
import { BranchInvoiceFilters } from '@/hooks/useBranchInvoices';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { useClientsList } from '@/hooks/useAccountingData';

interface ComprehensiveInvoiceFiltersProps {
  branchId: string;
  filters: BranchInvoiceFilters;
  onFiltersChange: (filters: BranchInvoiceFilters) => void;
  onReset: () => void;
}

export const ComprehensiveInvoiceFilters: React.FC<ComprehensiveInvoiceFiltersProps> = ({
  branchId,
  filters,
  onFiltersChange,
  onReset
}) => {
  const { data: authorities = [] } = useAuthoritiesForBilling();
  const { data: clients = [] } = useClientsList(branchId);

  const handleFilterChange = (key: keyof BranchInvoiceFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const statusOptions: MultiSelectOption[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'ready_to_charge', label: 'Ready to Send' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const clientOptions: MultiSelectOption[] = clients
    .filter(client => client.first_name && client.last_name)
    .map(client => ({
      label: `${client.first_name} ${client.last_name}`,
      value: client.id,
      description: client.pin_code || client.email || undefined
    }));

  const authorityTypeOptions = [
    { value: '__ALL__', label: 'All Types' },
    { value: 'private', label: 'Private (Client)' },
    { value: 'local_authority', label: 'Local Authority' },
    { value: 'nhs', label: 'NHS' },
    { value: 'ccg', label: 'CCG' },
    { value: 'continuing_care', label: 'Continuing Care' },
    { value: 'other', label: 'Other' },
  ];

  const invoiceMethodOptions = [
    { value: '__ALL__', label: 'All Methods' },
    { value: 'per_visit', label: 'Per Visit' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
    { value: 'adhoc', label: 'Ad-hoc' },
  ];


  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Client name, description..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Client Name Multi-Select */}
          <div className="space-y-2">
            <Label>Client Name</Label>
            <MultiSelect
              options={clientOptions}
              selected={filters.clientIds || []}
              onSelectionChange={(clientIds) => handleFilterChange('clientIds', clientIds.length > 0 ? clientIds : undefined)}
              placeholder="Select clients..."
              searchPlaceholder="Search clients..."
              emptyText="No clients found"
              maxDisplay={2}
              showSelectAll={true}
            />
          </div>

          {/* Status Multi-Select */}
          <div className="space-y-2">
            <Label>Status</Label>
            <MultiSelect
              options={statusOptions}
              selected={filters.status || []}
              onSelectionChange={(statuses) => handleFilterChange('status', statuses.length > 0 ? statuses : undefined)}
              placeholder="Select statuses..."
              searchPlaceholder="Search statuses..."
              emptyText="No statuses available"
              maxDisplay={2}
              showSelectAll={true}
            />
          </div>

          {/* Invoice Number Search */}
          <div className="space-y-2">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <Input
              id="invoice-number"
              placeholder="Search by invoice number..."
              value={filters.invoiceNumber || ''}
              onChange={(e) => handleFilterChange('invoiceNumber', e.target.value || undefined)}
            />
          </div>

          {/* Authority Type Filter */}
          <div className="space-y-2">
            <Label>Authority Type</Label>
            <Select
              value={filters.authorityType || '__ALL__'}
              onValueChange={(value) => handleFilterChange('authorityType', value === '__ALL__' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {authorityTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Method Filter */}
          <div className="space-y-2">
            <Label>Invoice Method</Label>
            <Select
              value={filters.invoiceMethod || '__ALL__'}
              onValueChange={(value) => handleFilterChange('invoiceMethod', value === '__ALL__' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {invoiceMethodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label htmlFor="date-from">Date From</Label>
            <Input
              id="date-from"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label htmlFor="date-to">Date To</Label>
            <Input
              id="date-to"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="ready-to-send"
              checked={filters.isReadyToSend || false}
              onCheckedChange={(checked) => handleFilterChange('isReadyToSend', checked)}
            />
            <Label htmlFor="ready-to-send">Ready to Send Only</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="former-clients"
              checked={filters.isFormerClient || false}
              onCheckedChange={(checked) => handleFilterChange('isFormerClient', checked)}
            />
            <Label htmlFor="former-clients">Former Clients</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onReset} size="sm">
            <X className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};