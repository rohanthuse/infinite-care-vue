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

export const DevSubdomainSwitcher: React.FC = () => {
  const [currentSubdomain, setCurrentSubdomain] = useState<string>('');
  const [customSubdomain, setCustomSubdomain] = useState<string>('');
  const [testingConnectivity, setTestingConnectivity] = useState<boolean>(false);
  const { data: organizations, isLoading, error: orgsError } = useOrganizations();
  const { organization, subdomain: contextSubdomain, error: tenantError } = useTenant();
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem('dev-subdomain') || '';
    setCurrentSubdomain(stored);
  }, []);

  const handleSubdomainChange = (subdomain: string) => {
    console.log('[DevSubdomainSwitcher] Switching to subdomain:', subdomain);
    
    if (subdomain) {
      localStorage.setItem('dev-subdomain', subdomain);
      toast.success(`Switched to tenant: ${subdomain}`);
      console.log('[DevSubdomainSwitcher] Set localStorage dev-subdomain to:', subdomain);
    } else {
      localStorage.removeItem('dev-subdomain');
      toast.success('Cleared tenant subdomain');
      console.log('[DevSubdomainSwitcher] Cleared localStorage dev-subdomain');
    }
    
    // Invalidate tenant queries and reload
    queryClient.invalidateQueries({ queryKey: ['organization'] });
    setTimeout(() => {
      console.log('[DevSubdomainSwitcher] Reloading page...');
      window.location.reload();
    }, 500);
  };

  const handleCustomSubdomain = () => {
    if (!customSubdomain.trim()) {
      toast.error('Please enter a subdomain');
      return;
    }
    handleSubdomainChange(customSubdomain.trim().toLowerCase());
  };

  const clearSubdomain = () => {
    setCustomSubdomain('');
    handleSubdomainChange('');
  };

  const testConnectivity = async () => {
    if (!currentSubdomain) {
      toast.error('No subdomain set to test');
      return;
    }
    
    setTestingConnectivity(true);
    try {
      // Test if the edge function can load the organization
      const result = await queryClient.fetchQuery({
        queryKey: ['test-tenant', currentSubdomain],
        queryFn: async () => {
          const { data, error } = await supabase.functions.invoke('list-system-tenants');
          if (error) throw error;
          const tenants = Array.isArray(data) ? data : data?.tenants || [];
          return tenants.find((t: any) => t.subdomain === currentSubdomain);
        }
      });
      
      if (result) {
        toast.success(`✅ Connectivity test passed for ${currentSubdomain}`);
      } else {
        toast.error(`❌ No organization found with subdomain: ${currentSubdomain}`);
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
          Switch between tenant organizations for testing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Section */}
        <div className="space-y-2">
          <Label>Current Status</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Subdomain:</span>
              <span className="font-mono">{currentSubdomain || '(none)'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Context Subdomain:</span>
              <span className="font-mono">{contextSubdomain || '(none)'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Organization:</span>
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
          <Label>Available Organizations</Label>
          <Select onValueChange={handleSubdomainChange} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading..." : "Select organization"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Clear (Main Site)</SelectItem>
              {organizations?.map((org) => (
                <SelectItem key={org.id} value={org.subdomain || ''}>
                  {org.name} ({org.subdomain})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Custom Subdomain</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter subdomain"
              value={customSubdomain}
              onChange={(e) => setCustomSubdomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubdomain()}
            />
            <Button onClick={handleCustomSubdomain} size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {currentSubdomain && (
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
                onClick={() => window.open(`https://${currentSubdomain}.med-infinite.care`, '_blank')}
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Test Production URL
              </Button>
              
              <Button onClick={clearSubdomain} variant="destructive" size="sm" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Subdomain
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