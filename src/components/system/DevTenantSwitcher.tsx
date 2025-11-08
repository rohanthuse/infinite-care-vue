import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Settings, RefreshCw, Trash2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

export const DevTenantSwitcher: React.FC = () => {
  const [currentTenantSlug, setCurrentTenantSlug] = useState<string>('');
  const [customTenantSlug, setCustomTenantSlug] = useState<string>('');
  const [testingConnectivity, setTestingConnectivity] = useState<boolean>(false);
  const { data: organizations, isLoading, error: orgsError } = useOrganizations();
  const { organization, tenantSlug: contextTenantSlug, error: tenantError } = useTenant();
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem('dev-tenant') || '';
    setCurrentTenantSlug(stored);
  }, []);

  const handleTenantChange = (slug: string) => {
    console.log('[DevTenantSwitcher] Switching to tenant slug:', slug);
    
    if (slug) {
      localStorage.setItem('dev-tenant', slug);
      toast.success(`Switched to tenant: ${slug}`);
      console.log('[DevTenantSwitcher] Set localStorage dev-tenant to:', slug);
    } else {
      localStorage.removeItem('dev-tenant');
      toast.success('Cleared tenant slug');
      console.log('[DevTenantSwitcher] Cleared localStorage dev-tenant');
    }
    
    // Invalidate tenant queries and reload
    queryClient.invalidateQueries({ queryKey: ['organization'] });
    setTimeout(() => {
      console.log('[DevTenantSwitcher] Reloading page...');
      window.location.reload();
    }, 500);
  };

  const handleCustomTenantSlug = () => {
    if (!customTenantSlug.trim()) {
      toast.error('Please enter a tenant slug');
      return;
    }
    handleTenantChange(customTenantSlug.trim().toLowerCase());
  };

  const clearTenantSlug = () => {
    setCustomTenantSlug('');
    handleTenantChange('');
  };

  const testConnectivity = async () => {
    if (!currentTenantSlug) {
      toast.error('No tenant slug set to test');
      return;
    }
    
    setTestingConnectivity(true);
    try {
      // Test if the edge function can load the organization
      const result = await queryClient.fetchQuery({
        queryKey: ['test-tenant', currentTenantSlug],
        queryFn: async () => {
          const { data, error } = await supabase.functions.invoke('list-system-tenants');
          if (error) throw error;
          const tenants = Array.isArray(data) ? data : data?.tenants || [];
          return tenants.find((t: any) => t.slug === currentTenantSlug);
        }
      });
      
      if (result) {
        toast.success(`✅ Connectivity test passed for ${currentTenantSlug}`);
      } else {
        toast.error(`❌ No organisation found with slug: ${currentTenantSlug}`);
      }
    } catch (error: any) {
      toast.error(`❌ Connectivity test failed: ${error.message}`);
    } finally {
      setTestingConnectivity(false);
    }
  };

  // Only show in development
  if (window.location.hostname !== 'localhost') {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Development Tools
        </CardTitle>
        <CardDescription>
          Switch between tenant organisations for testing (path-based routing)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Section */}
        <div className="space-y-2">
          <Label>Current Status</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Tenant Slug:</span>
              <span className="font-mono">{currentTenantSlug || '(none)'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Context Slug:</span>
              <span className="font-mono">{contextTenantSlug || '(none)'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Organisation:</span>
              <div className="flex items-center gap-1">
                {organization ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Loaded</span>
                  </>
                ) : tenantError ? (
                  <>
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Error</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Edge Function:</span>
              <div className="flex items-center gap-1">
                {orgsError ? (
                  <>
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Error</span>
                  </>
                ) : organizations ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">{organizations.length} orgs</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Loading...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Available Organisations</Label>
          <Select onValueChange={handleTenantChange} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading..." : "Select organisation"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Clear (Main Site)</SelectItem>
              {organizations?.map((org) => (
                <SelectItem key={org.id} value={org.slug || ''}>
                  {org.name} ({org.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Custom Tenant Slug</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter tenant slug"
              value={customTenantSlug}
              onChange={(e) => setCustomTenantSlug(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomTenantSlug()}
            />
            <Button onClick={handleCustomTenantSlug} size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {currentTenantSlug && (
            <>
              <Button 
                onClick={testConnectivity} 
                disabled={testingConnectivity}
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                {testingConnectivity ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Test Connectivity
              </Button>
              
              <Button 
                onClick={() => window.open(`https://med-infinite.care/${currentTenantSlug}`, '_blank')}
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Test Production URL
              </Button>
              
              <Button onClick={clearTenantSlug} variant="destructive" size="sm" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Tenant Slug
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> This tool is only available in development mode to help test different tenant configurations.</p>
        </div>
      </CardContent>
    </Card>
  );
};