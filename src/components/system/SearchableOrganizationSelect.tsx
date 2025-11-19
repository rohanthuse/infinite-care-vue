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
  // Map subscription plan values to display names
  const formatSubscriptionPlan = (plan?: string): string => {
    if (!plan) return '';
    const planMap: Record<string, string> = {
      'basic': 'Basic Plan',
      'professional': 'Professional Plan',
      'pro': 'Pro Plan',
      'enterprise': 'Enterprise Plan',
      '0-10': '0-10 Users',
      '11-25': '11-25 Users',
      '26-50': '26-50 Users',
      '51-100': '51-100 Users',
      '101-250': '101-250 Users',
      '251-500': '251-500 Users',
      '500+': '500+ Users',
    };
    return planMap[plan] || plan;
  };

  // Transform organizations into the format expected by Combobox
  const options = organizations.map(org => {
    const planDisplay = formatSubscriptionPlan(org.subscription_plan);
    return {
      value: org.id,
      label: org.name,
      description: planDisplay ? `${org.slug} • ${planDisplay}` : org.slug,
    };
  });

  return (
    <div className="space-y-1">
      <Combobox
        options={options}
        value={value}
        onValueChange={onValueChange}
        placeholder="Select organisation..."
        searchPlaceholder="Search organisations..."
        emptyText={isLoading ? "Loading organisations..." : "No organisations found"}
        className={error ? 'border-red-500' : ''}
      />
    </div>
  );
};