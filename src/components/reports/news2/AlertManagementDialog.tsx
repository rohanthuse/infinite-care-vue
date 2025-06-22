
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface AlertManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Local interface for the dialog's alert settings
interface LocalAlertSettings {
  highThreshold: number;
  mediumThreshold: number;
  rapidIncreaseThreshold: number;
  notifyClinicianOnDuty: boolean;
  notifyAssignedNurse: boolean;
  notifyMedicalDirector: boolean;
  notifyRapidResponseTeam: boolean;
  useSystemNotifications: boolean;
  useEmail: boolean;
  useSMS: boolean;
  useMobileApp: boolean;
  reminderInterval: number;
  escalationTime: number;
  overrideEmail: string;
}

export function AlertManagementDialog({
  open,
  onOpenChange,
}: AlertManagementDialogProps) {
  // Default alert settings
  const defaultSettings: LocalAlertSettings = {
    highThreshold: 7,
    mediumThreshold: 5,
    rapidIncreaseThreshold: 3,
    notifyClinicianOnDuty: true,
    notifyAssignedNurse: true,
    notifyMedicalDirector: false,
    notifyRapidResponseTeam: true,
    useSystemNotifications: true,
    useEmail: true,
    useSMS: false,
    useMobileApp: true,
    reminderInterval: 60, // minutes
    escalationTime: 120, // minutes
    overrideEmail: "",
  };

  const [settings, setSettings] = useState<LocalAlertSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState("thresholds");

  const handleSave = () => {
    // In a real application, this would save to an API
    // For now, we just show a success toast
    toast.success("Alert settings saved successfully", {
      description: "Your NEWS2 alert configuration has been updated",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Alert Management</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="thresholds" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="thresholds">Alert Thresholds</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          </TabsList>

          <TabsContent value="thresholds" className="space-y-4 mt-4">
            <div>
              <Label className="mb-2 block">
                High Risk Threshold (NEWS2 Score)
              </Label>
              <div className="flex items-center space-x-4">
                <Slider
                  defaultValue={[settings.highThreshold]}
                  max={10}
                  min={1}
                  step={1}
                  value={[settings.highThreshold]}
                  onValueChange={(value) =>
                    setSettings({ ...settings, highThreshold: value[0] })
                  }
                  className="w-full"
                />
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  {settings.highThreshold}+
                </span>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                Medium Risk Threshold (NEWS2 Score)
              </Label>
              <div className="flex items-center space-x-4">
                <Slider
                  defaultValue={[settings.mediumThreshold]}
                  max={settings.highThreshold - 1}
                  min={1}
                  step={1}
                  value={[settings.mediumThreshold]}
                  onValueChange={(value) =>
                    setSettings({ ...settings, mediumThreshold: value[0] })
                  }
                  className="w-full"
                />
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                  {settings.mediumThreshold}-{settings.highThreshold - 1}
                </span>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                Rapid Increase Threshold (Points in 24hrs)
              </Label>
              <div className="flex items-center space-x-4">
                <Slider
                  defaultValue={[settings.rapidIncreaseThreshold]}
                  max={5}
                  min={1}
                  step={1}
                  value={[settings.rapidIncreaseThreshold]}
                  onValueChange={(value) =>
                    setSettings({ ...settings, rapidIncreaseThreshold: value[0] })
                  }
                  className="w-full"
                />
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  +{settings.rapidIncreaseThreshold}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clinicianOnDuty"
                  checked={settings.notifyClinicianOnDuty}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifyClinicianOnDuty: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="clinicianOnDuty">Clinician On Duty</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assignedNurse"
                  checked={settings.notifyAssignedNurse}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifyAssignedNurse: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="assignedNurse">Assigned Nurse</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="medicalDirector"
                  checked={settings.notifyMedicalDirector}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifyMedicalDirector: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="medicalDirector">Medical Director</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rapidResponseTeam"
                  checked={settings.notifyRapidResponseTeam}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifyRapidResponseTeam: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="rapidResponseTeam">Rapid Response Team</Label>
              </div>

              <div className="pt-4">
                <Label htmlFor="overrideEmail" className="mb-2 block">
                  Override Email (Optional)
                </Label>
                <Input
                  id="overrideEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={settings.overrideEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, overrideEmail: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  If provided, this email will receive all notifications
                  regardless of other settings.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Notification Channels</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="systemNotifications">
                      System Notifications
                    </Label>
                  </div>
                  <Switch
                    id="systemNotifications"
                    checked={settings.useSystemNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        useSystemNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="emailNotifications">Email</Label>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.useEmail}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        useEmail: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="smsNotifications">SMS</Label>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.useSMS}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        useSMS: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="mobileAppNotifications">Mobile App</Label>
                  </div>
                  <Switch
                    id="mobileAppNotifications"
                    checked={settings.useMobileApp}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        useMobileApp: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Reminder Settings</h3>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">
                    Reminder Interval (minutes)
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      defaultValue={[settings.reminderInterval]}
                      max={120}
                      min={15}
                      step={15}
                      value={[settings.reminderInterval]}
                      onValueChange={(value) =>
                        setSettings({ ...settings, reminderInterval: value[0] })
                      }
                      className="w-full"
                    />
                    <span className="bg-gray-100 px-3 py-1 rounded-full min-w-[60px] text-center">
                      {settings.reminderInterval} min
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">
                    Escalation Time (minutes)
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      defaultValue={[settings.escalationTime]}
                      max={240}
                      min={30}
                      step={30}
                      value={[settings.escalationTime]}
                      onValueChange={(value) =>
                        setSettings({ ...settings, escalationTime: value[0] })
                      }
                      className="w-full"
                    />
                    <span className="bg-gray-100 px-3 py-1 rounded-full min-w-[60px] text-center">
                      {settings.escalationTime} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
