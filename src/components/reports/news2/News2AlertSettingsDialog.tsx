
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { News2Patient, mockAlertSettings } from "@/data/mockNews2Data";

interface News2AlertSettingsDialogProps {
  patient: News2Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const News2AlertSettingsDialog: React.FC<News2AlertSettingsDialogProps> = ({
  patient,
  open,
  onOpenChange
}) => {
  // Find existing alert settings for this patient or use defaults
  const existingSettings = mockAlertSettings.find(s => s.patientId === patient.id);
  
  const [enableAlerts, setEnableAlerts] = useState(existingSettings?.enableAlerts ?? true);
  const [increasedMonitoringThreshold, setIncreasedMonitoringThreshold] = useState(
    existingSettings?.increasedMonitoringThreshold ?? 5
  );
  const [emergencyCareThreshold, setEmergencyCareThreshold] = useState(
    existingSettings?.emergencyCareThreshold ?? 7
  );
  const [notifyByEmail, setNotifyByEmail] = useState(existingSettings?.notifyByEmail ?? true);
  const [notifyByPush, setNotifyByPush] = useState(existingSettings?.notifyByPush ?? true);
  const [notifyByFlag, setNotifyByFlag] = useState(existingSettings?.notifyByFlag ?? true);
  
  const handleSave = () => {
    // In a real application, we would save these settings to the database
    toast.success("Alert settings saved successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alert Settings</DialogTitle>
          <DialogDescription>
            Configure NEWS2 score alerts for {patient.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-alerts">Enable Alerts</Label>
              <p className="text-sm text-gray-500">
                Get notified when NEWS2 scores exceed thresholds
              </p>
            </div>
            <Switch
              id="enable-alerts"
              checked={enableAlerts}
              onCheckedChange={setEnableAlerts}
            />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="increased-monitoring">Increased Monitoring Alert</Label>
                <span className="text-sm font-medium">Score ≥ {increasedMonitoringThreshold}</span>
              </div>
              <Slider
                id="increased-monitoring"
                min={1}
                max={10}
                step={1}
                value={[increasedMonitoringThreshold]}
                onValueChange={(values) => setIncreasedMonitoringThreshold(values[0])}
                disabled={!enableAlerts}
              />
              <p className="text-sm text-gray-500">
                Alert when patient requires increased monitoring frequency
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="emergency-care">Emergency Care Alert</Label>
                <span className="text-sm font-medium">Score ≥ {emergencyCareThreshold}</span>
              </div>
              <Slider
                id="emergency-care"
                min={5}
                max={12}
                step={1}
                value={[emergencyCareThreshold]}
                onValueChange={(values) => setEmergencyCareThreshold(values[0])}
                disabled={!enableAlerts}
              />
              <p className="text-sm text-gray-500">
                Alert when urgent clinical review is needed
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Notification Methods</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-email" className="cursor-pointer">Email Notifications</Label>
                <Switch
                  id="notify-email"
                  checked={notifyByEmail}
                  onCheckedChange={setNotifyByEmail}
                  disabled={!enableAlerts}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-push" className="cursor-pointer">Push Notifications</Label>
                <Switch
                  id="notify-push"
                  checked={notifyByPush}
                  onCheckedChange={setNotifyByPush}
                  disabled={!enableAlerts}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-flag" className="cursor-pointer">Dashboard Flag</Label>
                <Switch
                  id="notify-flag"
                  checked={notifyByFlag}
                  onCheckedChange={setNotifyByFlag}
                  disabled={!enableAlerts}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
