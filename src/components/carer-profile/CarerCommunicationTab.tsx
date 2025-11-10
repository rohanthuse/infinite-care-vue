import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Bell, Settings, CircleDashed } from "lucide-react";
import { useStaffCommunication } from "@/hooks/useStaffCommunication";
import { formatDistanceToNow } from "date-fns";

interface CarerCommunicationTabProps {
  carerId: string;
}

export const CarerCommunicationTab: React.FC<CarerCommunicationTabProps> = ({ carerId }) => {
  const { preferences, recentMessages, isLoading } = useStaffCommunication(carerId);

  // Group preferences by type (email, sms, push, etc.)
  const emailPrefs = preferences.filter(p => p.notification_type.includes('email'));
  const smsPrefs = preferences.filter(p => p.notification_type.includes('sms'));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Communication Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No notification preferences configured yet.</p>
              <p className="text-sm mt-1">Default settings will be used.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Notifications */}
              <div className="space-y-2">
                <h4 className="font-medium">Email Notifications</h4>
                {emailPrefs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No email preferences set</p>
                ) : (
                  <div className="space-y-2">
                    {emailPrefs.map((pref) => (
                      <div key={pref.notification_type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {pref.notification_type.replace('email_', '').replace(/_/g, ' ')}
                        </span>
                        <Badge variant={pref.enabled ? "default" : "secondary"}>
                          {pref.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SMS Notifications */}
              <div className="space-y-2">
                <h4 className="font-medium">SMS Notifications</h4>
                {smsPrefs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No SMS preferences set</p>
                ) : (
                  <div className="space-y-2">
                    {smsPrefs.map((pref) => (
                      <div key={pref.notification_type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {pref.notification_type.replace('sms_', '').replace(/_/g, ' ')}
                        </span>
                        <Badge variant={pref.enabled ? "default" : "secondary"}>
                          {pref.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" disabled>
              <Settings className="h-4 w-4 mr-2" />
              Update Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Communications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recent Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CircleDashed className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No communication records found.</p>
              <p className="text-sm mt-1">Messages will appear here once the staff member starts communicating.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.slice(0, 5).map((message) => (
                <div
                  key={message.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {message.thread_subject || 'Message'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.content.length > 60
                          ? `${message.content.substring(0, 60)}...`
                          : message.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {message.sender_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};