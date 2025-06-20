
import React, { useState } from "react";
import { format } from "date-fns";
import { FileText, Clock, Plus, User, Calendar, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCarePlanDialog } from "../dialogs/CreateCarePlanDialog";
import { DeleteCarePlanDialog } from "../dialogs/DeleteCarePlanDialog";
import { useClientCarePlans } from "@/hooks/useClientData";
import { useDeleteCarePlan } from "@/hooks/useDeleteCarePlan";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useParams } from "react-router-dom";

interface CarePlansTabProps {
  clientId: string;
  carePlans?: any[];
}

export const CarePlansTab: React.FC<CarePlansTabProps> = ({ clientId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carePlanToDelete, setCarePlanToDelete] = useState<any>(null);
  
  const { data: carePlans = [], isLoading } = useClientCarePlans(clientId);
  const { id: branchId } = useParams();
  const { data: branchStaff = [] } = useBranchStaff(branchId || '');
  const queryClient = useQueryClient();
  const deleteCarePlanMutation = useDeleteCarePlan();

  const createCarePlanMutation = useMutation({
    mutationFn: async (carePlanData: any) => {
      // Prepare the data based on provider type - display_id will be auto-generated
      const insertData: any = {
        client_id: clientId,
        display_id: '', // Empty string so trigger generates the ID
        title: carePlanData.title,
        start_date: carePlanData.start_date.toISOString().split('T')[0],
        end_date: carePlanData.end_date ? carePlanData.end_date.toISOString().split('T')[0] : null,
        review_date: carePlanData.review_date ? carePlanData.review_date.toISOString().split('T')[0] : null,
        status: 'active'
      };

      if (carePlanData.provider_type === 'staff' && carePlanData.staff_id) {
        // Find the staff member to get their name
        const staffMember = branchStaff.find(staff => staff.id === carePlanData.staff_id);
        insertData.staff_id = carePlanData.staff_id;
        insertData.provider_name = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff';
      } else {
        // External provider
        insertData.provider_name = carePlanData.provider_name;
      }

      const { data, error } = await supabase
        .from('client_care_plans')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans', clientId] });
    },
  });

  const handleCreateCarePlan = async (carePlanData: any) => {
    await createCarePlanMutation.mutateAsync(carePlanData);
  };

  const handleDeleteCarePlan = (carePlan: any) => {
    setCarePlanToDelete(carePlan);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCarePlan = () => {
    if (carePlanToDelete) {
      deleteCarePlanMutation.mutate(carePlanToDelete.id);
      setDeleteDialogOpen(false);
      setCarePlanToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderDisplay = (plan: any) => {
    if (plan.staff && plan.staff_id) {
      return `${plan.staff.first_name} ${plan.staff.last_name}`;
    }
    return plan.provider_name || 'Unknown Provider';
  };

  const isStaffProvider = (plan: any) => {
    return !!plan.staff_id;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Care Plans</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Create Plan</span>
            </Button>
          </div>
          <CardDescription>Care plans and treatment programs for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {carePlans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No care plans available for this client</p>
            </div>
          ) : (
            <div className="space-y-4">
              {carePlans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{plan.title}</h3>
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status}
                        </Badge>
                        {plan.display_id && (
                          <Badge variant="outline" className="text-xs">
                            {plan.display_id}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{getProviderDisplay(plan)}</span>
                          {isStaffProvider(plan) && (
                            <Badge variant="outline" className="text-xs ml-1">
                              Staff
                            </Badge>
                          )}
                          {!isStaffProvider(plan) && (
                            <Badge variant="outline" className="text-xs ml-1">
                              External
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Started: {format(new Date(plan.start_date), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      {plan.end_date && (
                        <div className="text-sm text-gray-600">
                          End Date: {format(new Date(plan.end_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {plan.review_date && (
                        <div className="text-sm text-gray-600">
                          Next Review: {format(new Date(plan.review_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {plan.goals_progress !== null && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{plan.goals_progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${plan.goals_progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCarePlan(plan)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Care Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCarePlanDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateCarePlan}
        clientId={clientId}
      />

      <DeleteCarePlanDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteCarePlan}
        carePlanTitle={carePlanToDelete?.title || ""}
        isLoading={deleteCarePlanMutation.isPending}
      />
    </div>
  );
};
