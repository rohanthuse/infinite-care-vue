import React from 'react';
import { Combobox } from '@/components/ui/combobox';
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
  // Transform organizations into the format expected by Combobox
  const options = organizations.map(org => ({
    value: org.id,
    label: org.name,
    description: org.slug,
  }));

  return (
    <div className="space-y-1">
      <Combobox
        options={options}
        value={value}
        onValueChange={onValueChange}
        placeholder="Select organization..."
        searchPlaceholder="Search organizations..."
        emptyText={isLoading ? "Loading organizations..." : "No organizations found"}
        className={error ? 'border-red-500' : ''}
      />
    </div>
  );
};