
import React, { useState, useMemo } from 'react';
import { Form, AssigneeType, FormPermissions } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Check, Search, FileText, Calendar, Clock, AlertTriangle, Upload, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useBranchStaffAndClients } from '@/hooks/useBranchStaffAndClients';
import { useBranchNavigation } from '@/hooks/useBranchNavigation';
import { useBranchAdmins } from '@/hooks/useBranchAdmins';

interface FormBuilderPublishProps {
  form: Form;
  onPublish: (requiresReview: boolean, assignees: any[]) => void;
  branchId: string;
  onUpdatePermissions?: (permissions: FormPermissions) => void;
}

export const FormBuilderPublish: React.FC<FormBuilderPublishProps> = ({
  form,
  onPublish,
  branchId,
  onUpdatePermissions,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('clients');
  const [searchValue, setSearchValue] = useState<string>('');
  const [requiresReview, setRequiresReview] = useState<boolean>(form.requiresReview || false);
  const [selectedAssignees, setSelectedAssignees] = useState<{[key: string]: boolean}>(() => {
    const initialState: {[key: string]: boolean} = {};
    form.assignees.forEach(assignee => {
      initialState[assignee.id] = true;
    });
    return initialState;
  });

  const defaultPermissions: FormPermissions = {
    viewAccess: ['admin', 'branch-manager'],
    editAccess: ['admin'],
    submitAccess: ['client', 'staff'],
    manageAccess: ['admin'],
  };
  
  const [permissions, setPermissions] = useState<FormPermissions>(
    form.permissions || defaultPermissions
  );

  const [activePermissionsTab, setActivePermissionsTab] = useState<string>('view');
  
  // Fetch real data from hooks
  const { staff, clients, isLoading: isLoadingStaffAndClients } = useBranchStaffAndClients(branchId);
  const { data: branches = [], isLoading: isLoadingBranches } = useBranchNavigation();
  const { data: branchAdmins = [], isLoading: isLoadingAdmins } = useBranchAdmins(branchId);

  // Transform the real data into the format expected by the UI
  const realClients = useMemo(() => {
    return clients.map(client => ({
      id: client.id,
      name: `${client.first_name} ${client.last_name}`.trim(),
      type: 'client' as const,
      email: client.email || '',
      avatar: `${client.first_name?.charAt(0) || ''}${client.last_name?.charAt(0) || ''}`.toUpperCase()
    }));
  }, [clients]);

  const realStaff = useMemo(() => {
    return staff.map(member => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`.trim(),
      type: 'staff' as const,
      role: member.specialization || 'Staff Member',
      avatar: `${member.first_name?.charAt(0) || ''}${member.last_name?.charAt(0) || ''}`.toUpperCase()
    }));
  }, [staff]);


  const realBranches = useMemo(() => {
    return branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      type: 'branch' as const,
      location: branch.country || 'Location not specified',
      avatar: branch.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)
    }));
  }, [branches]);

  const realBranchAdmins = useMemo(() => {
    return branchAdmins.map(admin => ({
      id: admin.id,
      name: `${admin.first_name} ${admin.last_name}`.trim(),
      type: 'branch_admin' as const,
      email: admin.email || '',
      avatar: `${admin.first_name?.charAt(0) || ''}${admin.last_name?.charAt(0) || ''}`.toUpperCase()
    }));
  }, [branchAdmins]);

  // Mock roles for permissions
  const mockRoles = [
    { id: 'admin', name: 'Administrator', description: 'Full system access' },
    { id: 'branch-manager', name: 'Branch Manager', description: 'Manages branch operations' },
    { id: 'staff', name: 'Staff', description: 'Medical and support staff' },
    { id: 'client', name: 'Client', description: 'Receives services' }
  ];

  // Filter the real data based on search value
  const filteredClients = useMemo(() => {
    return realClients.filter(client => 
      client.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      client.email.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [realClients, searchValue]);
  
  const filteredStaff = useMemo(() => {
    return realStaff.filter(staff => 
      staff.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [realStaff, searchValue]);
  
  
  const filteredBranches = useMemo(() => {
    return realBranches.filter(branch => 
      branch.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (branch.location && branch.location.toLowerCase().includes(searchValue.toLowerCase()))
    );
  }, [realBranches, searchValue]);

  const filteredBranchAdmins = useMemo(() => {
    return realBranchAdmins.filter(admin => 
      admin.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [realBranchAdmins, searchValue]);

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setSearchValue('');
  };

  const handleSelectAssignee = (id: string, checked: boolean) => {
    setSelectedAssignees(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const handlePublish = () => {
    const assignees = Object.entries(selectedAssignees)
      .filter(([_, isSelected]) => isSelected)
      .map(([id, _]) => {
        const allEntities = [...realClients, ...realStaff, ...realBranches, ...realBranchAdmins];
        const entity = allEntities.find(entity => entity.id === id);
        if (!entity) return null;
        
        return {
          type: entity.type as AssigneeType,
          id: entity.id,
          name: entity.name
        };
      })
      .filter(Boolean);
    
    if (onUpdatePermissions) {
      onUpdatePermissions(permissions);
    }
    
    onPublish(requiresReview, assignees);
  };

  const getSelectedCount = () => {
    return Object.values(selectedAssignees).filter(Boolean).length;
  };

  const handlePermissionChange = (permissionType: keyof FormPermissions, roleId: string, checked: boolean) => {
    setPermissions(prev => {
      const updatedPermissions = { ...prev };
      
      if (checked) {
        if (!updatedPermissions[permissionType].includes(roleId)) {
          updatedPermissions[permissionType] = [...updatedPermissions[permissionType], roleId];
        }
      } else {
        updatedPermissions[permissionType] = updatedPermissions[permissionType].filter(id => id !== roleId);
      }
      
      return updatedPermissions;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Form Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Form Title</h3>
                <p className="font-medium">{form.title}</p>
              </div>
              
              {form.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p>{form.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Number of Fields</h3>
                <p>{form.elements.length}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(form.createdAt).toLocaleDateString()}
                  <Clock className="h-4 w-4 text-gray-400 ml-2" />
                  {new Date(form.createdAt).toLocaleTimeString()}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(form.updatedAt).toLocaleDateString()}
                  <Clock className="h-4 w-4 text-gray-400 ml-2" />
                  {new Date(form.updatedAt).toLocaleTimeString()}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="flex items-center gap-2">
                  {form.published ? (
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Draft</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="requiresReview" 
                  checked={requiresReview}
                  onCheckedChange={(checked) => setRequiresReview(!!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="requiresReview" className="font-medium">
                    Require Review
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Submissions will need to be reviewed by an admin before being finalized.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Form Permissions
            </CardTitle>
            <CardDescription>Configure who can view, edit, submit and manage this form</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activePermissionsTab} onValueChange={setActivePermissionsTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="view">View</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="submit">Submit</TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
              </TabsList>
              
              <TabsContent value="view">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">Select who can view this form</p>
                  {mockRoles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                      <Checkbox 
                        id={`view-${role.id}`} 
                        checked={permissions.viewAccess.includes(role.id)}
                        onCheckedChange={(checked) => handlePermissionChange('viewAccess', role.id, !!checked)}
                      />
                      <Label htmlFor={`view-${role.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="edit">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">Select who can edit this form</p>
                  {mockRoles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                      <Checkbox 
                        id={`edit-${role.id}`} 
                        checked={permissions.editAccess.includes(role.id)}
                        onCheckedChange={(checked) => handlePermissionChange('editAccess', role.id, !!checked)}
                      />
                      <Label htmlFor={`edit-${role.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="submit">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">Select who can submit this form</p>
                  {mockRoles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                      <Checkbox 
                        id={`submit-${role.id}`} 
                        checked={permissions.submitAccess.includes(role.id)}
                        onCheckedChange={(checked) => handlePermissionChange('submitAccess', role.id, !!checked)}
                      />
                      <Label htmlFor={`submit-${role.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="manage">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">Select who can manage this form and its submissions</p>
                  {mockRoles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                      <Checkbox 
                        id={`manage-${role.id}`} 
                        checked={permissions.manageAccess.includes(role.id)}
                        onCheckedChange={(checked) => handlePermissionChange('manageAccess', role.id, !!checked)}
                      />
                      <Label htmlFor={`manage-${role.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Assign Form To</CardTitle>
          <CardDescription>Select who should receive this form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Tabs value={selectedTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="branches">Branches</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[250px] mt-2">
                <TabsContent value="clients" className="space-y-2 py-2">
                  {isLoadingStaffAndClients ? (
                    <div className="text-center py-8 text-gray-500">Loading clients...</div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No clients found</div>
                  ) : (
                    filteredClients.map(client => (
                      <div key={client.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                        <Checkbox 
                          id={`client-${client.id}`} 
                          checked={!!selectedAssignees[client.id]} 
                          onCheckedChange={(checked) => handleSelectAssignee(client.id, !!checked)}
                        />
                        <div className="flex items-center flex-1 gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">{client.avatar}</AvatarFallback>
                          </Avatar>
                          <Label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-gray-500">{client.email}</div>
                          </Label>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="staff" className="space-y-2 py-2">
                  {isLoadingStaffAndClients ? (
                    <div className="text-center py-8 text-gray-500">Loading staff...</div>
                  ) : filteredStaff.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No staff found</div>
                  ) : (
                    filteredStaff.map(staff => (
                      <div key={staff.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                        <Checkbox 
                          id={`staff-${staff.id}`} 
                          checked={!!selectedAssignees[staff.id]} 
                          onCheckedChange={(checked) => handleSelectAssignee(staff.id, !!checked)}
                        />
                        <div className="flex items-center flex-1 gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-purple-100 text-purple-600">{staff.avatar}</AvatarFallback>
                          </Avatar>
                          <Label htmlFor={`staff-${staff.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-xs text-gray-500">{staff.role}</div>
                          </Label>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                
                <TabsContent value="branches" className="space-y-2 py-2">
                  {isLoadingBranches ? (
                    <div className="text-center py-8 text-gray-500">Loading branches...</div>
                  ) : filteredBranches.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No branches found</div>
                  ) : (
                    filteredBranches.map(branch => (
                      <div key={branch.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                        <Checkbox 
                          id={`branch-${branch.id}`} 
                          checked={!!selectedAssignees[branch.id]} 
                          onCheckedChange={(checked) => handleSelectAssignee(branch.id, !!checked)}
                        />
                        <div className="flex items-center flex-1 gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-amber-100 text-amber-600">{branch.avatar}</AvatarFallback>
                          </Avatar>
                          <Label htmlFor={`branch-${branch.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{branch.name}</div>
                            <div className="text-xs text-gray-500">{branch.location}</div>
                          </Label>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="admins" className="space-y-2 py-2">
                  {isLoadingAdmins ? (
                    <div className="text-center py-8 text-gray-500">Loading branch admins...</div>
                  ) : filteredBranchAdmins.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No branch admins found</div>
                  ) : (
                    filteredBranchAdmins.map(admin => (
                      <div key={admin.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                        <Checkbox 
                          id={`admin-${admin.id}`} 
                          checked={!!selectedAssignees[admin.id]} 
                          onCheckedChange={(checked) => handleSelectAssignee(admin.id, !!checked)}
                        />
                        <div className="flex items-center flex-1 gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-red-100 text-red-600">{admin.avatar}</AvatarFallback>
                          </Avatar>
                          <Label htmlFor={`admin-${admin.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{admin.name}</div>
                            <div className="text-xs text-gray-500">{admin.email}</div>
                          </Label>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                Selected: <span className="font-medium">{getSelectedCount()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800">Important</h3>
          <p className="text-sm text-blue-600">
            Once published, this form will be available to all selected assignees. You can still edit it after publishing.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handlePublish} 
          disabled={getSelectedCount() === 0}
        >
          <Upload className="h-4 w-4 mr-2" />
          Publish Form
        </Button>
      </div>
    </div>
  );
};
