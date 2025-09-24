import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Phone, Bell, Settings } from "lucide-react";

interface CarerCommunicationTabProps {
  carerId: string;
}

export const CarerCommunicationTab: React.FC<CarerCommunicationTabProps> = ({ carerId }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Email Notifications</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Schedule Changes</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">New Assignments</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Training Reminders</span>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">SMS Notifications</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Urgent Messages</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shift Reminders</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Client Updates</span>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Update Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recent Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Schedule Update</p>
                  <p className="text-sm text-muted-foreground">Tomorrow's visit moved to 2 PM</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Client Call</p>
                  <p className="text-sm text-muted-foreground">Mrs. Johnson regarding care plan</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Bell className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Training Reminder</p>
                  <p className="text-sm text-muted-foreground">First Aid certification expires next month</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};