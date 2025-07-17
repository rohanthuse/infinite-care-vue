import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBranchTrainingMetrics } from "@/hooks/useBranchTrainingMetrics";

interface TrainingMetricsEmailButtonProps {
  branchId: string;
  branchName: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function TrainingMetricsEmailButton({ 
  branchId, 
  branchName, 
  variant = "default",
  size = "default" 
}: TrainingMetricsEmailButtonProps) {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [subject, setSubject] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: metrics, isLoading } = useBranchTrainingMetrics(branchId);

  const addRecipient = () => {
    const email = emailInput.trim();
    if (!email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (recipients.includes(email)) {
      toast.error("Email already added");
      return;
    }

    setRecipients([...recipients, email]);
    setEmailInput("");
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRecipient();
    }
  };

  const sendEmail = async () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    if (!metrics) {
      toast.error("Training metrics data not available");
      return;
    }

    setIsSending(true);

    try {
      const emailData = {
        branchName,
        recipients,
        metrics: {
          summary: metrics.summary,
          staffMetrics: metrics.staffMetrics.map(staff => ({
            staffName: staff.staffName,
            specialization: staff.specialization,
            complianceRate: staff.complianceRate,
            overdue: staff.overdue,
            expiring: staff.expiring,
            overdueTrainings: staff.overdueTrainings,
          })),
          categoryMetrics: metrics.categoryMetrics,
        },
        reportDate: new Date().toISOString(),
        subject: subject || undefined,
      };

      const { data, error } = await supabase.functions.invoke('send-training-metrics', {
        body: emailData,
      });

      if (error) throw error;

      toast.success(`Training metrics report sent to ${recipients.length} recipient(s)`);
      setOpen(false);
      setRecipients([]);
      setSubject("");
    } catch (error) {
      console.error("Error sending training metrics email:", error);
      toast.error("Failed to send training metrics report");
    } finally {
      setIsSending(false);
    }
  };

  const defaultSubject = `Training Metrics Report - ${branchName} - ${new Date().toLocaleDateString('en-GB')}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading}>
          <Mail className="h-4 w-4 mr-2" />
          Email Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Email Training Metrics Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              placeholder={defaultSubject}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave blank to use default subject
            </p>
          </div>

          <div>
            <Label htmlFor="recipients">Recipients</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="recipients"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addRecipient}
                disabled={!emailInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {recipients.length > 0 && (
            <div>
              <Label>Selected Recipients ({recipients.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeRecipient(email)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metrics && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium text-sm mb-2">Report Preview</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• {metrics.summary.totalStaff} staff members</p>
                <p>• {metrics.summary.overallComplianceRate}% overall compliance</p>
                <p>• {metrics.summary.overdueTrainings} overdue trainings</p>
                <p>• {metrics.summary.expiringTrainings} expiring soon</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={sendEmail}
              disabled={recipients.length === 0 || !metrics || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}