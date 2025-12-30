import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Clock, FileText, Shield, Award, Plus, Edit, Trash2 } from "lucide-react";
import { useStaffEssentials } from "@/hooks/useStaffEssentials";
import { AddEssentialDialog } from "./AddEssentialDialog";
import { UpdateEssentialDialog } from "./UpdateEssentialDialog";
import type { StaffEssential } from "@/hooks/useStaffEssentials";

interface CarerEssentialsTabProps {
  carerId: string;
}

export const CarerEssentialsTab: React.FC<CarerEssentialsTabProps> = ({ carerId }) => {
  const {
    essentials,
    isLoading,
    completionPercentage,
    actionRequiredItems,
    addEssential,
    updateEssential,
    deleteEssential,
    isAddingEssential,
  } = useStaffEssentials(carerId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedEssential, setSelectedEssential] = useState<StaffEssential | null>(null);

  const handleEdit = (essential: StaffEssential) => {
    setSelectedEssential(essential);
    setUpdateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this essential requirement?')) {
      deleteEssential(id);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'complete':
        return { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'expiring':
        return { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
      case 'pending':
        return { icon: Clock, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      default:
        return { icon: Clock, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Background':
        return Shield;
      case 'Legal':
        return FileText;
      case 'Training':
        return Award;
      case 'Health':
        return CheckCircle;
      default:
        return FileText;
    }
  };

  const completedCount = essentials.filter(item => item.status === 'complete').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Essentials Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Essentials Checklist
              </CardTitle>
              <Button onClick={() => setAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Essential
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Completion</span>
                <span>{completedCount}/{essentials.length} Complete</span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </div>

            {essentials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No essentials configured yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Essential
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {essentials.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  const CategoryIcon = getCategoryIcon(item.category);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div key={item.id} className={`p-4 rounded-lg border ${statusInfo.bg}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`h-8 w-8 rounded-full bg-white flex items-center justify-center`}>
                            <CategoryIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.display_name}</h4>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            {item.expiry_date && (
                              <p className="text-xs text-muted-foreground">
                                Expires: {new Date(item.expiry_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                          <Badge variant="custom" className={statusInfo.badge}>
                            {item.status === 'complete' && 'Complete'}
                            {item.status === 'expiring' && 'Expiring Soon'}
                            {item.status === 'expired' && 'Expired'}
                            {item.status === 'pending' && 'Pending'}
                            {item.status === 'not_required' && 'Not Required'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionRequiredItems.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                      <div>
                        <p className="font-medium">{item.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.status === 'expiring' && item.expiry_date
                            ? `Expires ${new Date(item.expiry_date).toLocaleDateString()}`
                            : item.status === 'expired'
                            ? 'Expired - action required'
                            : 'Awaiting completion'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      {item.status === 'expiring' || item.status === 'expired' ? 'Renew' : 'Complete'}
                    </Button>
                  </div>
                );
              })}
              
              {actionRequiredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All essentials are up to date!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddEssentialDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        staffId={carerId}
        onAdd={addEssential}
      />

      <UpdateEssentialDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        essential={selectedEssential}
        onUpdate={(id, data) => updateEssential({ id, data })}
      />
    </>
  );
};