import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, ArrowRight, MapPin, Globe, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Branch {
  id: string;
  name: string;
  country: string;
  currency: string;
  status: string;
  branch_type: string;
  organization_id: string;
}

interface TenantBranchNavigationProps {
  organizationId: string;
}

export const TenantBranchNavigation: React.FC<TenantBranchNavigationProps> = ({ 
  organizationId 
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch branches for this organization
  const { data: branches, isLoading, error } = useQuery({
    queryKey: ['organization-branches', organizationId],
    queryFn: async () => {
      console.log('Fetching branches for organization:', organizationId);
      
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching organization branches:', error);
        throw error;
      }

      console.log('Organization branches:', data);
      return data || [];
    },
    enabled: !!organizationId,
  });

  const handleEnterBranch = (branch: Branch) => {
    // For tenant context, navigate to tenant-specific branch dashboard
    const encodedBranchName = encodeURIComponent(branch.name);
    console.log('Navigating to tenant branch:', branch.id, branch.name, encodedBranchName);
    navigate(`/branch-dashboard/${branch.id}/${encodedBranchName}`);
  };

  const filteredBranches = branches?.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.branch_type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading organization branches...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading branches: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-lg border border-gray-200 p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Organization Branches</h2>
            <p className="text-gray-500 text-sm">Navigate to any branch within your organization</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {branches?.length || 0} active branches
          </div>
          <Button
            onClick={() => {
              toast.info("Add branch functionality coming soon!");
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search branches by name, country, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Branches Grid */}
      {filteredBranches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? "No branches match your search." : "No active branches found for this organization."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-blue-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">
                        {branch.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{branch.country}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-green-100 text-green-800 border-green-200"
                    >
                      {branch.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {branch.currency}
                    </span>
                    <span className="capitalize">{branch.branch_type}</span>
                  </div>

                  <Button
                    onClick={() => handleEnterBranch(branch)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    Enter Branch
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};