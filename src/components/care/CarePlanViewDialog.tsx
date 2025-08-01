import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Edit, FileText, Calendar, User, Target, Activity, Pill, Heart, Utensils, ShieldCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useCarePlanData } from '@/hooks/useCarePlanData';

interface CarePlanViewDialogProps {
  carePlanId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CarePlanViewDialog({ carePlanId, open, onOpenChange }: CarePlanViewDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const { data: carePlan, isLoading } = useCarePlanData(carePlanId);

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleExport = () => {
    // Export functionality - to be implemented
    console.log('Export care plan:', carePlanId);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!carePlan) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Care plan not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Care Plan - {carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : 'Unknown Client'}
              </DialogTitle>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(carePlan.status)}>
                  {carePlan.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {carePlan.display_id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant={isEditMode ? "destructive" : "default"} 
                size="sm" 
                onClick={handleEditToggle}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? "Cancel Edit" : "Edit Plan"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Overview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provider</label>
                    <p className="text-sm">
                      {carePlan.provider_name || (carePlan.staff ? `${carePlan.staff.first_name} ${carePlan.staff.last_name}` : 'Not assigned')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provider Type</label>
                    <p className="text-sm capitalize">{carePlan.staff_id ? 'Internal Staff' : 'External Provider'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-sm">
                      {carePlan.start_date ? format(new Date(carePlan.start_date), 'PPP') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="text-sm">
                      {carePlan.end_date ? format(new Date(carePlan.end_date), 'PPP') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Review Date</label>
                    <p className="text-sm">
                      Not scheduled
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm">
                      {format(new Date(carePlan.created_at), 'PPP')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Care Plan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Care Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Care Plan Overview</h3>
                  <p className="text-muted-foreground mb-4">
                    This care plan contains detailed information about the client's care requirements, 
                    goals, and support needs. Additional details are available in the edit mode.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{carePlan.title || 'Standard Care'}</div>
                      <div className="text-xs text-muted-foreground">Care Type</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{carePlan.status}</div>
                      <div className="text-xs text-muted-foreground">Status</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {format(new Date(carePlan.updated_at), 'PPP')}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {isEditMode && (
                <Button>
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}