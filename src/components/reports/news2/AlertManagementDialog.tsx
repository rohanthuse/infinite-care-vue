
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellRing, RefreshCw } from "lucide-react";

interface AlertManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertManagementDialog({
  open,
  onOpenChange,
}: AlertManagementDialogProps) {
  const handleSaveAlertSettings = () => {
    toast.success("Alert settings saved successfully");
    onOpenChange(false);
  };

  const handleTestAlerts = () => {
    toast.info("Test alert sent successfully", {
      description: "Check your notification channels to verify receipt",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              <span>NEWS2 Alert Management</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Score Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="high-threshold">High Risk Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="7">
                      <SelectTrigger id="high-threshold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-red-500 font-medium">High</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Scores at or above this value will trigger high risk alerts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medium-threshold">Medium Risk Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="5">
                      <SelectTrigger id="medium-threshold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-amber-500 font-medium">Medium</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Scores at or above this value will trigger medium risk alerts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rapid-increase">Rapid Increase Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="2">
                      <SelectTrigger id="rapid-increase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">+1</SelectItem>
                        <SelectItem value="2">+2</SelectItem>
                        <SelectItem value="3">+3</SelectItem>
                        <SelectItem value="4">+4</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-blue-500 font-medium">Points</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Alert if score increases by this amount between observations
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Alert Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="clinician" defaultChecked />
                    <Label htmlFor="clinician" className="text-sm font-normal">
                      Clinician on duty
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="nurse" defaultChecked />
                    <Label htmlFor="nurse" className="text-sm font-normal">
                      Assigned nurse
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="medical-director" defaultChecked />
                    <Label htmlFor="medical-director" className="text-sm font-normal">
                      Medical director (high risk only)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="rapid-response" />
                    <Label htmlFor="rapid-response" className="text-sm font-normal">
                      Rapid response team (high risk only)
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notification Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="system" defaultChecked />
                    <Label htmlFor="system" className="text-sm font-normal">
                      System notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="email" defaultChecked />
                    <Label htmlFor="email" className="text-sm font-normal">
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sms" />
                    <Label htmlFor="sms" className="text-sm font-normal">
                      SMS
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="app" defaultChecked />
                    <Label htmlFor="app" className="text-sm font-normal">
                      Mobile app push notifications
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Alert Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repeat-interval">Reminder Interval</Label>
                  <Select defaultValue="30">
                    <SelectTrigger id="repeat-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="never">Never repeat</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    How often to repeat unacknowledged alerts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalation">Escalation Time</Label>
                  <Select defaultValue="60">
                    <SelectTrigger id="escalation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="never">Don't escalate</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    When to escalate unacknowledged critical alerts
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Override Email for Alerts</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Optional email for urgent alerts"
                className="flex-1"
              />
              <Button variant="outline" onClick={handleTestAlerts} type="button">
                <Bell className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use default staff contact methods
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveAlertSettings}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
