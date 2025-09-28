import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { Filter, X, Search } from 'lucide-react';
import { BranchInvoiceFilters } from '@/hooks/useBranchInvoices';

interface ComprehensiveInvoiceFiltersProps {
  filters: BranchInvoiceFilters;
  onFiltersChange: (filters: BranchInvoiceFilters) => void;
  onReset: () => void;
  clients?: { id: string; first_name: string; last_name: string }[];
  clientGroups?: { id: string; name: string }[];
}

export const ComprehensiveInvoiceFilters: React.FC<ComprehensiveInvoiceFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  clients = [],
  clientGroups = []
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof BranchInvoiceFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatus = filters.status || [];
    if (checked) {
      updateFilter('status', [...currentStatus, status as any]);
    } else {
      updateFilter('status', currentStatus.filter(s => s !== status));
    }
  };

  const handlePaidStatusChange = (paidStatus: string, checked: boolean) => {
    const currentPaidStatus = filters.paidStatus || [];
    if (checked) {
      updateFilter('paidStatus', [...currentPaidStatus, paidStatus as any]);
    } else {
      updateFilter('paidStatus', currentPaidStatus.filter(s => s !== paidStatus));
    }
  };

  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof BranchInvoiceFilters] !== undefined && 
    filters[key as keyof BranchInvoiceFilters] !== null &&
    (Array.isArray(filters[key as keyof BranchInvoiceFilters]) ? 
      (filters[key as keyof BranchInvoiceFilters] as any[]).length > 0 : true)
  ).length;

  return (
    <div className="space-y-4">
      {/* Search and basic filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search invoices or invoice number..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Mandatory date filters */}
        <div className="flex gap-2 items-center">
          <Label className="text-sm font-medium">Period:</Label>
          <EnhancedDatePicker
            value={filters.startDate ? new Date(filters.startDate) : undefined}
            onChange={(date) => updateFilter('startDate', date?.toISOString().split('T')[0])}
            placeholder="Start Date *"
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <EnhancedDatePicker
            value={filters.endDate ? new Date(filters.endDate) : undefined}
            onChange={(date) => updateFilter('endDate', date?.toISOString().split('T')[0])}
            placeholder="End Date *"
            className="w-32"
          />
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Advanced Filters</h4>
                <Button variant="ghost" size="sm" onClick={onReset}>
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'draft', label: 'Draft' },
                    { value: 'ready_to_charge', label: 'Ready to Charge' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'future_invoice', label: 'Future Invoice' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'cancelled', label: 'Cancelled' }
                  ].map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={status.value}
                        checked={(filters.status || []).includes(status.value as any)}
                        onCheckedChange={(checked) => handleStatusChange(status.value, checked as boolean)}
                      />
                      <Label htmlFor={status.value} className="text-sm">{status.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authority Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Authority</Label>
                <Select
                  value={filters.authorityType || 'all'}
                  onValueChange={(value) => updateFilter('authorityType', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authorities</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="local_authority">Local Authority</SelectItem>
                    <SelectItem value="nhs">NHS</SelectItem>
                    <SelectItem value="ccg">CCG</SelectItem>
                    <SelectItem value="continuing_care">Continuing Care</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Invoice Method</Label>
                <Select
                  value={filters.invoiceMethod || 'all'}
                  onValueChange={(value) => updateFilter('invoiceMethod', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="per_visit">Per Visit</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="adhoc">Ad-hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pay Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pay Method</Label>
                <Select
                  value={filters.payMethod || 'all'}
                  onValueChange={(value) => updateFilter('payMethod', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pay method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="direct_debit">Direct Debit</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="bacs">BACS</SelectItem>
                    <SelectItem value="faster_payment">Faster Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Paid Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Paid Status</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'unpaid', label: 'Unpaid' },
                    { value: 'partially_paid', label: 'Partially Paid' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'refunded', label: 'Refunded' },
                    { value: 'written_off', label: 'Written-off' }
                  ].map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`paid-${status.value}`}
                        checked={(filters.paidStatus || []).includes(status.value as any)}
                        onCheckedChange={(checked) => handlePaidStatusChange(status.value, checked as boolean)}
                      />
                      <Label htmlFor={`paid-${status.value}`} className="text-sm">{status.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Flags</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ready-to-send"
                      checked={filters.isReadyToSend === true}
                      onCheckedChange={(checked) => updateFilter('isReadyToSend', checked ? true : undefined)}
                    />
                    <Label htmlFor="ready-to-send" className="text-sm">Ready to Send</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="former-client"
                      checked={filters.isFormerClient === true}
                      onCheckedChange={(checked) => updateFilter('isFormerClient', checked ? true : undefined)}
                    />
                    <Label htmlFor="former-client" className="text-sm">Former Client</Label>
                  </div>
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min £"
                    value={filters.minAmount || ''}
                    onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-24"
                  />
                  <span className="self-center text-sm text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max £"
                    value={filters.maxAmount || ''}
                    onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};