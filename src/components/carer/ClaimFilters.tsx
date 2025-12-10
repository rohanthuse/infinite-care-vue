import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface ClaimFiltersProps {
  dateFrom: string;
  dateTo: string;
  status: string;
  category?: string;
  categoryOptions?: { value: string; label: string }[];
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onClear: () => void;
  statusOptions: { value: string; label: string }[];
}

export const ClaimFilters = ({
  dateFrom,
  dateTo,
  status,
  category,
  categoryOptions,
  onDateFromChange,
  onDateToChange,
  onStatusChange,
  onCategoryChange,
  onClear,
  statusOptions,
}: ClaimFiltersProps) => {
  const hasFilters = dateFrom || dateTo || status !== 'all' || (category && category !== 'all');

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">From:</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-36 h-8"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">To:</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-36 h-8"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-32 h-8">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {categoryOptions && onCategoryChange && (
        <Select value={category || 'all'} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};
