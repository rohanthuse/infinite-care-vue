import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Bell, Lock, User } from "lucide-react";

interface CarerSettingsTabProps {
  carerId: string;
}

export const CarerSettingsTab: React.FC<CarerSettingsTabProps> = ({ carerId }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Email Notifications</Label>
            <Switch id="notifications" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms">SMS Notifications</Label>
            <Switch id="sms" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="privacy">Profile Visibility</Label>
            <Switch id="privacy" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};