import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Settings, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { EditOrganizationMemberPermissionsDialog } from "@/components/EditOrganizationMemberPermissionsDialog";
import { getPermissionsSummary } from "@/hooks/useOrganizationMemberPermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrganizationMember {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  status: string;
  joined_at: string;
  permissions?: any;
}

interface OrganizationAdminsTableProps {
  organizationId: string;
}

export const OrganizationAdminsTable: React.FC<OrganizationAdminsTableProps> = ({ 
  organizationId 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  // Fetch organization members with their profile data
  const { data: members = [], isLoading, error, refetch } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      console.log('Fetching organization members for:', organizationId);
      
      // Get organization members
      const { data: orgMembers, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          permissions
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (membersError) {
        console.error('Error fetching organization members:', membersError);
        throw membersError;
      }

      if (!orgMembers || orgMembers.length === 0) {
        console.log('No organization members found');
        return [];
      }

      // Get user IDs to fetch profiles
      const userIds = orgMembers.map(member => member.user_id);
      
      // Fetch user profiles (join with auth.users via system_users if needed)
      const { data: systemUsers, error: systemUsersError } = await supabase
        .from('system_users')
        .select('id, auth_user_id, email, first_name, last_name')
        .in('auth_user_id', userIds);

      if (systemUsersError) {
        console.error('Error fetching system users:', systemUsersError);
        // Continue without profile data
      }

      console.log('Organization members data:', orgMembers);
      console.log('System users data:', systemUsers);

      // Combine the data
      const membersWithProfiles = orgMembers.map(member => {
        const systemUser = systemUsers?.find(su => su.auth_user_id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          email: systemUser?.email || 'Unknown',
          first_name: systemUser?.first_name,
          last_name: systemUser?.last_name,
          role: member.role,
          status: member.status,
          joined_at: member.joined_at,
          permissions: member.permissions,
        };
      });

      console.log('Members with profiles:', membersWithProfiles);
      return membersWithProfiles;
    },
    enabled: !!organizationId,
    retry: 3,
    retryDelay: 1000,
  });

  const handleDeleteMember = async (memberId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ status: 'inactive' })
        .eq('id', memberId);

      if (error) {
        console.error('Error removing organization member:', error);
        throw error;
      }

      toast.success(`Removed ${userEmail} from organization`);
      refetch();
    } catch (error: any) {
      console.error('Remove member error:', error);
      toast.error("Failed to remove member: " + error.message);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Error loading organization members: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search organization members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <AddMemberDialog />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading organization members...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm ? "No members match your search." : "No organization members found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.first_name && member.last_name
                      ? `${member.first_name} ${member.last_name}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge 
                        variant={member.status === 'active' ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {member.status}
                      </Badge>
                      {member.permissions && (
                        <div className="text-xs text-gray-500">
                          {getPermissionsSummary(member.permissions as any)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joined_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMember({
                            id: member.id,
                            name: member.first_name && member.last_name 
                              ? `${member.first_name} ${member.last_name}` 
                              : 'N/A',
                            email: member.email,
                            role: member.role
                          });
                          setIsPermissionsDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this member from the organization? 
                              They will lose access to all organization resources.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMember(member.id, member.email)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Permissions Dialog */}
      {selectedMember && (
        <EditOrganizationMemberPermissionsDialog
          isOpen={isPermissionsDialogOpen}
          onClose={() => {
            setIsPermissionsDialogOpen(false);
            setSelectedMember(null);
            refetch(); // Refetch data when dialog closes
          }}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          memberEmail={selectedMember.email}
          memberRole={selectedMember.role}
        />
      )}
    </div>
  );
};