import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Settings, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const DevSubdomainSwitcher: React.FC = () => {
  const [currentSubdomain, setCurrentSubdomain] = useState<string>('');
  const [customSubdomain, setCustomSubdomain] = useState<string>('');
  const { data: organizations, isLoading } = useOrganizations();
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
        <div className="space-y-2">
          <Label>Current Subdomain</Label>
          <div className="text-sm font-mono bg-muted p-2 rounded">
            {currentSubdomain || '(none - main site)'}
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

        {currentSubdomain && (
          <Button onClick={clearSubdomain} variant="destructive" size="sm" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Subdomain
          </Button>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> This tool is only available in development mode to help test different tenant configurations.</p>
        </div>
      </CardContent>
    </Card>
  );
};