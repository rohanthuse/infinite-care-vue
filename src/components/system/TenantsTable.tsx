import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Building, Eye, Edit, Trash2, Plus, Search, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  contact_email: string | null;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  activeUsers: number;
}
interface TenantsTableProps {
  tenants: Tenant[] | undefined;
  isLoading: boolean;
  onAddTenant: () => void;
  onViewTenant: (tenant: Tenant) => void;
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenant: Tenant) => void;
}
export const TenantsTable = ({
  tenants,
  isLoading,
  onAddTenant,
  onViewTenant,
  onEditTenant,
  onDeleteTenant
}: TenantsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter tenants based on search and status
  const filteredTenants = tenants?.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) || tenant.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];
  const handleExport = () => {
    if (!tenants?.length) {
      toast.error('No tenant data to export');
      return;
    }
    const csvData = tenants.map(tenant => ({
      Name: tenant.name,
      Subdomain: tenant.subdomain,
      'Contact Email': tenant.contact_email || '',
      Plan: tenant.subscription_plan,
      Status: tenant.subscription_status,
      'Active Users': tenant.activeUsers,
      'Created Date': format(new Date(tenant.created_at), 'yyyy-MM-dd')
    }));
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Tenant data exported successfully');
  };
  if (isLoading) {
    return <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tenant organizations...</p>
          </div>
        </CardContent>
      </Card>;
  }
  if (!tenants || tenants.length === 0) {
    return <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Building className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Tenants Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first tenant organization to get started with the multi-tenant system.
            </p>
            <Button onClick={onAddTenant} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Tenant
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">All Tenant Organizations</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and monitor tenant organizations ({filteredTenants.length} of {tenants?.length || 0})
            </p>
          </div>
          <div className="flex items-center gap-2">
            
            <Button size="sm" onClick={onAddTenant} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tenant
            </Button>
          </div>
        </div>
        
        {/* Search and Filter Section */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tenants..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Organization</TableHead>
                <TableHead className="font-semibold">Subdomain</TableHead>
                <TableHead className="font-semibold">Plan</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Users</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map(tenant => <TableRow key={tenant.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{tenant.name}</div>
                        {tenant.contact_email && <div className="text-sm text-muted-foreground">{tenant.contact_email}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {tenant.subdomain}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {tenant.subscription_plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'destructive'} className="capitalize">
                      {tenant.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{tenant.activeUsers}</span>
                      <span className="text-xs text-muted-foreground">active</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(tenant.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-1">
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10" onClick={() => onViewTenant(tenant)} title="View tenant details">
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950" onClick={() => onEditTenant(tenant)} title="Edit tenant">
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDeleteTenant(tenant)} title="Delete tenant">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
};