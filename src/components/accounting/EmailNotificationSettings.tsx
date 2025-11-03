import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useClientEmailSettings, useUpdateEmailSettings } from "@/hooks/useInvoiceEmailNotification";

interface EmailNotificationSettingsProps {
  clientId: string;
  clientName: string;
}

export const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({
  clientId,
  clientName,
}) => {
  const { data: settings, isLoading } = useClientEmailSettings(clientId);
  const updateSettings = useUpdateEmailSettings();

  const [formData, setFormData] = useState({
    send_invoice_emails: settings?.send_invoice_emails ?? true,
    email_on_generation: settings?.email_on_generation ?? true,
    email_on_due_date_reminder: settings?.email_on_due_date_reminder ?? true,
    reminder_days_before: settings?.reminder_days_before ?? 7,
    invoice_email: settings?.invoice_email || '',
    cc_emails: settings?.cc_emails || [],
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        send_invoice_emails: settings.send_invoice_emails ?? true,
        email_on_generation: settings.email_on_generation ?? true,
        email_on_due_date_reminder: settings.email_on_due_date_reminder ?? true,
        reminder_days_before: settings.reminder_days_before ?? 7,
        invoice_email: settings.invoice_email || '',
        cc_emails: settings.cc_emails || [],
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      client_id: clientId,
      ...formData,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading email settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notification Settings
            </CardTitle>
            <CardDescription>
              Configure email notifications for {clientName}
            </CardDescription>
          </div>
          {formData.send_invoice_emails ? (
            <Badge className="gap-1 bg-green-500">
              <CheckCircle2 className="h-3 w-3" />
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Disabled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Master Switch */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="send_invoice_emails" className="text-base font-medium">
                Enable Invoice Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Send automated emails for invoice events
              </p>
            </div>
            <Switch
              id="send_invoice_emails"
              checked={formData.send_invoice_emails}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, send_invoice_emails: checked })
              }
            />
          </div>

          {formData.send_invoice_emails && (
            <>
              {/* Email Preferences */}
              <div className="space-y-4">
                <h3 className="font-medium">Notification Preferences</h3>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label htmlFor="email_on_generation">
                      Email on Invoice Generation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when a new invoice is created
                    </p>
                  </div>
                  <Switch
                    id="email_on_generation"
                    checked={formData.email_on_generation}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, email_on_generation: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label htmlFor="email_on_due_date_reminder">
                      Email Due Date Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminder before invoice due date
                    </p>
                  </div>
                  <Switch
                    id="email_on_due_date_reminder"
                    checked={formData.email_on_due_date_reminder}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, email_on_due_date_reminder: checked })
                    }
                  />
                </div>

                {formData.email_on_due_date_reminder && (
                  <div className="pl-6">
                    <Label htmlFor="reminder_days_before">
                      Days Before Due Date
                    </Label>
                    <Input
                      id="reminder_days_before"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.reminder_days_before}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reminder_days_before: parseInt(e.target.value) || 7,
                        })
                      }
                      className="mt-2 max-w-xs"
                    />
                  </div>
                )}
              </div>

              {/* Email Override */}
              <div className="space-y-3">
                <h3 className="font-medium">Email Configuration</h3>
                
                <div>
                  <Label htmlFor="invoice_email">
                    Invoice Email (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Override the client's default email for invoices
                  </p>
                  <Input
                    id="invoice_email"
                    type="email"
                    placeholder="invoice@example.com"
                    value={formData.invoice_email}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_email: e.target.value })
                    }
                  />
                </div>
              </div>
            </>
          )}

          <Button 
            type="submit" 
            disabled={updateSettings.isPending}
            className="w-full"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
