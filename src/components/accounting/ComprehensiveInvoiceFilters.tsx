import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useAuthoritiesForBilling } from '@/hooks/useAuthorities';
import { BranchInvoiceFilters } from '@/hooks/useBranchInvoices';

interface ComprehensiveInvoiceFiltersProps {
  filters: BranchInvoiceFilters;
  onFiltersChange: (filters: BranchInvoiceFilters) => void;
  onReset: () => void;
}

export const ComprehensiveInvoiceFilters: React.FC<ComprehensiveInvoiceFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const { data: authorities = [] } = useAuthoritiesForBilling();

  const handleFilterChange = (key: keyof BranchInvoiceFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'ready_to_charge', label: 'Ready to Send' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const authorityTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'private', label: 'Private (Client)' },
    { value: 'local_authority', label: 'Local Authority' },
    { value: 'nhs', label: 'NHS' },
    { value: 'ccg', label: 'CCG' },
    { value: 'continuing_care', label: 'Continuing Care' },
    { value: 'other', label: 'Other' },
  ];

  const invoiceMethodOptions = [
    { value: '', label: 'All Methods' },
    { value: 'per_visit', label: 'Per Visit' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
    { value: 'adhoc', label: 'Ad-hoc' },
  ];

  // Handle single status selection by converting to/from array
  const handleStatusChange = (value: string) => {
    if (value === '') {
      handleFilterChange('status', undefined);
    } else {
      handleFilterChange('status', [value as any]);
    }
  };

  const currentStatus = filters.status && filters.status.length > 0 ? filters.status[0] : '';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Invoice number, client name..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Authority Type Filter */}
          <div className="space-y-2">
            <Label>Authority Type</Label>
            <Select
              value={filters.authorityType || ''}
              onValueChange={(value) => handleFilterChange('authorityType', value || undefined)}
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
              value={filters.invoiceMethod || ''}
              onValueChange={(value) => handleFilterChange('invoiceMethod', value || undefined)}
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

          {/* Min Amount */}
          <div className="space-y-2">
            <Label htmlFor="min-amount">Min Amount</Label>
            <Input
              id="min-amount"
              type="number"
              placeholder="0.00"
              value={filters.minAmount || ''}
              onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          {/* Max Amount */}
          <div className="space-y-2">
            <Label htmlFor="max-amount">Max Amount</Label>
            <Input
              id="max-amount"
              type="number"
              placeholder="0.00"
              value={filters.maxAmount || ''}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
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