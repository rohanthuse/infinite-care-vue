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
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AddMemberDialog } from "@/components/AddMemberDialog";
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
  join_date: string;
  permissions?: any;
  is_system_user: boolean;
}

interface OrganizationAdminsTableProps {
  organizationId: string;
}

export const OrganizationAdminsTable: React.FC<OrganizationAdminsTableProps> = ({ 
  organizationId 
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch organization members with their profile data
  const { data: members = [], isLoading, error, refetch } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      console.log('Fetching organisation members for:', organizationId);
      
      // PART 1: Fetch regular organization members
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
        console.error('Error fetching organisation members:', membersError);
        throw membersError;
      }

      // Get user IDs to fetch profiles
      const userIds = orgMembers?.map(member => member.user_id) || [];
      
      // Fetch user profiles from the profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // PART 2: Fetch System Portal users
      const { data: systemUsers, error: systemUsersError } = await supabase
        .from('system_user_organizations')
        .select(`
          id,
          system_user_id,
          role,
          assigned_at,
          system_users (
            id,
            first_name,
            last_name,
            email,
            is_active
          )
        `)
        .eq('organization_id', organizationId);

      if (systemUsersError) {
        console.error('Error fetching system users:', systemUsersError);
      }

      console.log('Regular members:', orgMembers);
      console.log('System Portal users:', systemUsers);

      // PART 3: Combine both data sources into unified format
      const regularMembers = (orgMembers || []).map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        
        return {
          id: member.id,
          user_id: member.user_id,
          email: profile?.email || 'Unknown',
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          role: member.role,
          status: member.status,
          join_date: member.joined_at,
          permissions: member.permissions,
          is_system_user: false,
        };
      });

      const systemMembers = (systemUsers || []).map(item => {
        const systemUser = Array.isArray(item.system_users) 
          ? item.system_users[0] 
          : item.system_users;
        
        return {
          id: item.id,
          user_id: item.system_user_id,
          email: systemUser?.email || 'Unknown',
          first_name: systemUser?.first_name,
          last_name: systemUser?.last_name,
          role: 'super_admin',
          status: systemUser?.is_active ? 'active' : 'inactive',
          join_date: item.assigned_at,
          permissions: null,
          is_system_user: true,
        };
      });

      // Combine and return all members
      const allMembers = [...regularMembers, ...systemMembers];
      console.log('Combined members:', allMembers);
      
      return allMembers;
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

      toast.success(`Removed ${userEmail} from organisation`);
      refetch();
    } catch (error: any) {
      console.error('Remove member error:', error);
      toast.error("Failed to remove member: " + error.message);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.is_system_user && 'system portal'.includes(searchTerm.toLowerCase()))
  );

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Error loading organisation members: {error.message}</p>
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
            placeholder="Search organisation members..."
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
                    Loading organisation members...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm ? "No members match your search." : "No organisation members found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : 'N/A'}
                      </span>
                      {member.is_system_user && (
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          ⭐ System Portal
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={member.is_system_user ? "default" : "secondary"} 
                      className={member.is_system_user 
                        ? "capitalize bg-purple-600 text-white" 
                        : "capitalize"
                      }
                    >
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={member.status === 'active' ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.join_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!member.is_system_user ? (
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
                                Are you sure you want to remove this member from the organisation? 
                                They will lose access to all organisation resources.
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
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="text-xs text-gray-500 cursor-not-allowed"
                        >
                          System User
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};