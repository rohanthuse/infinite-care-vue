import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow, TableCell
} from '@/components/ui/table';
import { 
  Search, Filter, Eye, Edit, Trash2, 
  MoreHorizontal, Users, CheckCircle,
  Clock, AlertCircle, FileX, UserCheck, MessageSquare,
  RefreshCw, PauseCircle, Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AdminChangeRequestViewDialog } from './AdminChangeRequestViewDialog';
import { AssignCarePlanDialog } from './AssignCarePlanDialog';
import { CarePlanStatusChangeDialog } from './CarePlanStatusChangeDialog';

interface CarePlan {
  id: string;
  display_id: string;
  title?: string;
  client: {
    first_name: string;
    last_name: string;
    id: string;
  };
  created_at: string;
  updated_at: string;
  status: string;
  provider_name: string;
  staff?: {
    first_name: string;
    last_name: string;
  };
  notes?: string;
  completion_percentage?: number;
  changes_requested_at?: string;
  change_request_comments?: string;
  changes_requested_by?: string;
}

interface AdminCarePlanManagementProps {
  carePlans: CarePlan[];
  branchId: string;
  branchName: string;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onEditDraft: (id: string) => void;
  onDelete: (plan: any) => void;
  onStatusChange?: (id: string) => void;
  onViewChangeRequest?: (plan: CarePlan) => void;
}

const statusConfig = {
  'draft': { 
    label: 'Draft', 
    variant: 'secondary' as const, 
    color: 'text-gray-600 bg-gray-50', 
    icon: FileX 
  },
  'pending_client_approval': { 
    label: 'Pending Client Approval', 
    variant: 'outline' as const, 
    color: 'text-amber-600 bg-amber-50', 
    icon: Clock 
  },
  'active': { 
    label: 'Active', 
    variant: 'default' as const, 
    color: 'text-green-600 bg-green-50', 
    icon: CheckCircle 
  },
  'approved': { 
    label: 'Client Approved', 
    variant: 'default' as const, 
    color: 'text-blue-600 bg-blue-50', 
    icon: UserCheck 
  },
  'rejected': { 
    label: 'Changes Requested', 
    variant: 'destructive' as const, 
    color: 'text-red-600 bg-red-50', 
    icon: AlertCircle 
  },
  'on_hold': { 
    label: 'On Hold', 
    variant: 'outline' as const, 
    color: 'text-orange-600 bg-orange-50', 
    icon: PauseCircle 
  },
  'completed': { 
    label: 'Completed', 
    variant: 'default' as const, 
    color: 'text-purple-600 bg-purple-50', 
    icon: CheckCircle 
  },
  'archived': { 
    label: 'Archived', 
    variant: 'secondary' as const, 
    color: 'text-gray-600 bg-gray-50', 
    icon: Archive 
  }
};

export const AdminCarePlanManagement: React.FC<AdminCarePlanManagementProps> = ({
  carePlans,
  branchId,
  branchName,
  onView,
  onEdit,
  onEditDraft,
  onDelete,
  onViewChangeRequest
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [changeRequestDialogOpen, setChangeRequestDialogOpen] = useState(false);
  const [selectedCarePlan, setSelectedCarePlan] = useState<CarePlan | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [carePlanToAssign, setCarePlanToAssign] = useState<CarePlan | null>(null);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [carePlanToChangeStatus, setCarePlanToChangeStatus] = useState<CarePlan | null>(null);
  const navigate = useNavigate();

  // Filter care plans based on search and status
  const filteredPlans = carePlans.filter(plan => {
    const matchesSearch = 
      `${plan.client.first_name} ${plan.client.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.display_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.title && plan.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group plans by status for better organization
  const groupedPlans = {
    draft: filteredPlans.filter(plan => plan.status === 'draft'),
    pending_client_approval: filteredPlans.filter(plan => plan.status === 'pending_client_approval'),
    active: filteredPlans.filter(plan => plan.status === 'active'),
    approved: filteredPlans.filter(plan => plan.status === 'approved'),
    rejected: filteredPlans.filter(plan => plan.status === 'rejected')
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  const handleClientClick = (clientId: string) => {
    if (branchId && branchName) {
      // Get tenant context for proper navigation
      const tenantSlug = window.location.pathname.split('/')[1];
      const basePath = tenantSlug && tenantSlug !== 'branch-dashboard' ? `/${tenantSlug}` : '';
      const clientPath = `${basePath}/branch-dashboard/${branchId}/${branchName}/clients/${clientId}`;
      console.log('[AdminCarePlanManagement] Navigating to tenant-aware client path:', clientPath);
      navigate(clientPath);
    }
  };

  const handleViewChangeRequest = (plan: CarePlan) => {
    setSelectedCarePlan(plan);
    setChangeRequestDialogOpen(true);
  };

  const handleEditFromChangeRequest = (carePlanId: string) => {
    onEdit(carePlanId);
  };

  const handleAssignCarer = (plan: CarePlan) => {
    setCarePlanToAssign(plan);
    setAssignDialogOpen(true);
  };

  const handleChangeStatus = (plan: CarePlan) => {
    setCarePlanToChangeStatus(plan);
    setStatusChangeDialogOpen(true);
  };

  const renderCarePlanRow = (plan: CarePlan) => {
    const statusInfo = getStatusConfig(plan.status);
    const StatusIcon = statusInfo.icon;
    const hasChangeRequest = plan.changes_requested_at && plan.change_request_comments;

    return (
      <TableRow key={plan.id}>
        <TableCell>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{plan.display_id}</span>
              {hasChangeRequest && (
                <div className="h-4 w-4 text-amber-600" title="Has change request">
                  <MessageSquare className="h-4 w-4" />
                </div>
              )}
            </div>
            {plan.title && (
              <div className="text-sm text-muted-foreground">{plan.title}</div>
            )}
          </div>
        </TableCell>
        
        <TableCell>
          <button 
            onClick={() => handleClientClick(plan.client.id)}
            className="text-left hover:underline"
          >
            <div className="font-medium">
              {plan.client.first_name} {plan.client.last_name}
            </div>
          </button>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
            {hasChangeRequest && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Change Request
              </Badge>
            )}
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="text-sm">
              {plan.staff 
                ? `${plan.staff.first_name} ${plan.staff.last_name}` 
                : plan.provider_name || 'Unassigned'
              }
            </div>
            {!plan.staff && !plan.provider_name && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Unassigned
              </Badge>
            )}
          </div>
        </TableCell>
        
        <TableCell>
          <div className="text-sm text-muted-foreground">
            {format(new Date(plan.updated_at), 'MMM dd, yyyy')}
          </div>
        </TableCell>
        
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white z-50 border shadow-md">
              <DropdownMenuItem onClick={() => onView(plan.display_id || plan.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              
              {hasChangeRequest && (
                <DropdownMenuItem onClick={() => handleViewChangeRequest(plan)}>
                  <MessageSquare className="h-4 w-4 mr-2 text-amber-600" />
                  View Change Request
                </DropdownMenuItem>
              )}

              {(plan.status === 'approved' || plan.status === 'active') && (
                <DropdownMenuItem onClick={() => handleAssignCarer(plan)}>
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Carer
                </DropdownMenuItem>
              )}
              
              {plan.status === 'draft' ? (
                <DropdownMenuItem onClick={() => onEditDraft(plan.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Draft
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEdit(plan.display_id || plan.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Care Plan
                </DropdownMenuItem>
              )}
              
              
              <DropdownMenuItem onClick={() => handleChangeStatus(plan)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Change Status
              </DropdownMenuItem>
              
              {plan.status === 'draft' && (
                <DropdownMenuItem 
                  onClick={() => onDelete(plan)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Draft
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search care plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="pending_client_approval">Pending Client Approval</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="approved">Client Approved</SelectItem>
            <SelectItem value="rejected">Changes Requested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(groupedPlans).map(([status, plans]) => {
          const statusInfo = getStatusConfig(status);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{statusInfo.label}</span>
                  </div>
                  <span className="text-2xl font-bold">{plans.length}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Care Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Care Plans ({filteredPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'No care plans match your filters.'
                : 'No care plans found for this branch.'
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Provider</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map(renderCarePlanRow)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Change Request View Dialog */}
      <AdminChangeRequestViewDialog
        open={changeRequestDialogOpen}
        onOpenChange={setChangeRequestDialogOpen}
        carePlan={selectedCarePlan}
        onEditCarePlan={handleEditFromChangeRequest}
      />

      {/* Assign Care Plan Dialog */}
      <AssignCarePlanDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        carePlan={carePlanToAssign}
        branchId={branchId}
      />

      {/* Status Change Dialog */}
      <CarePlanStatusChangeDialog
        open={statusChangeDialogOpen}
        onOpenChange={setStatusChangeDialogOpen}
        carePlan={carePlanToChangeStatus}
      />
    </div>
  );
};