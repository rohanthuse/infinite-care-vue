import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { OrganizationOption } from '@/hooks/useOrganizations';

interface SearchableOrganizationSelectProps {
  organizations: OrganizationOption[];
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
  error?: string;
}

export const SearchableOrganizationSelect: React.FC<SearchableOrganizationSelectProps> = ({
  organizations,
  value,
  onValueChange,
  isLoading = false,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrganizations = useMemo(() => {
    if (!searchTerm) return organizations;
    return organizations.filter(org =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [organizations, searchTerm]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={error ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        <div className="flex items-center px-3 pb-2">
          <Search className="mr-2 h-4 w-4 opacity-50" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full border-0 bg-transparent p-0 focus:ring-0"
          />
        </div>
        <div className="border-t border-border" />
        {isLoading ? (
          <SelectItem value="" disabled>Loading organizations...</SelectItem>
        ) : filteredOrganizations.length > 0 ? (
          filteredOrganizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                {org.slug && (
                  <span className="text-xs text-muted-foreground">{org.slug}</span>
                )}
              </div>
            </SelectItem>
          ))
        ) : searchTerm ? (
          <SelectItem value="" disabled>No organizations found for "{searchTerm}"</SelectItem>
        ) : (
          <SelectItem value="" disabled>No organizations available</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};