
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, User, Activity, CheckCircle, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AlertManagementDialogProps {
  alert: any;
  patient: any;
  onClose: () => void;
}

export const AlertManagementDialog = ({ alert, patient, onClose }: AlertManagementDialogProps) => {
  const queryClient = useQueryClient();

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-600">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="warning" className="bg-orange-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'high_score':
        return 'High Score Alert';
      case 'deteriorating':
        return 'Deteriorating Condition';
      case 'overdue_observation':
        return 'Overdue Observation';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleAcknowledge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication required');
        return;
      }

      const { error } = await supabase
        .from('news2_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      if (error) throw error;

      // Invalidate and refetch alerts
      queryClient.invalidateQueries({ queryKey: ['news2-alerts'] });
      
      toast.success('Alert acknowledged successfully');
      onClose();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async () => {
    try {
      const { error } = await supabase
        .from('news2_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      if (error) throw error;

      // Invalidate and refetch alerts
      queryClient.invalidateQueries({ queryKey: ['news2-alerts'] });
      
      toast.success('Alert resolved successfully');
      onClose();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const patientName = patient?.client ? 
    `${patient.client.first_name} ${patient.client.last_name}` : 
    'Unknown Patient';

  const latestScore = patient?.latest_observation?.total_score || 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${
              alert.severity === 'critical' || alert.severity === 'high' ? 'text-red-500' :
              alert.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
            }`} />
            Clinical Alert Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alert Information</h3>
              {getSeverityBadge(alert.severity)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Alert Type:</span>
                <p>{getAlertTypeLabel(alert.alert_type)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Created:</span>
                <p>{format(new Date(alert.created_at), "dd MMM yyyy, HH:mm")}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Status:</span>
                <p className="flex items-center gap-1">
                  {alert.acknowledged ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Acknowledged
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-orange-500" />
                      Pending
                    </>
                  )}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Patient:</span>
                <p className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {patientName}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Alert Message */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Alert Message</h4>
            <div className={`p-3 rounded-lg border-l-4 ${
              alert.severity === 'critical' || alert.severity === 'high' ? 'border-l-red-500 bg-red-50' :
              alert.severity === 'medium' ? 'border-l-orange-500 bg-orange-50' :
              'border-l-yellow-500 bg-yellow-50'
            }`}>
              <p className="text-gray-800">{alert.message}</p>
            </div>
          </div>

          {/* Patient Context */}
          {patient && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Patient Context</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Latest NEWS2 Score:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                        latestScore >= 7 ? "bg-red-500" : 
                        latestScore >= 5 ? "bg-orange-500" : "bg-green-500"
                      }`}>
                        {latestScore}
                      </div>
                      <span className="text-gray-600">
                        ({latestScore >= 7 ? 'High Risk' : latestScore >= 5 ? 'Medium Risk' : 'Low Risk'})
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Risk Category:</span>
                    <p className="mt-1">{patient.risk_category?.charAt(0).toUpperCase() + patient.risk_category?.slice(1)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Monitoring Frequency:</span>
                    <p className="mt-1">{patient.monitoring_frequency}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Last Observation:</span>
                    <p className="mt-1">
                      {patient.latest_observation?.recorded_at ? 
                        format(new Date(patient.latest_observation.recorded_at), "dd MMM, HH:mm") :
                        'No observations recorded'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Acknowledgment Info */}
          {alert.acknowledged && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Acknowledgment</h4>
                <div className="text-sm text-gray-600">
                  <p>Acknowledged on {format(new Date(alert.acknowledged_at), "dd MMM yyyy, HH:mm")}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          
          {!alert.acknowledged && (
            <Button onClick={handleAcknowledge} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Acknowledge Alert
            </Button>
          )}
          
          {alert.acknowledged && !alert.resolved && (
            <Button onClick={handleResolve} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              <Activity className="h-4 w-4 mr-2" />
              Resolve Alert
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
