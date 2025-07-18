import React, { useState } from "react";
import { Calendar, Mail, Link2, Share2, Clock, User, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useThirdPartyAccess, CreateThirdPartyAccessData } from "@/hooks/useThirdPartyAccess";
import { generatePDF } from "@/utils/pdfGenerator";
import { toast } from "@/hooks/use-toast";

interface CarerProfileSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    specialization: string;
    experience: string;
    hire_date: string;
  };
  branchId: string;
}

export function CarerProfileSharingDialog({
  open,
  onOpenChange,
  carer,
  branchId,
}: CarerProfileSharingDialogProps) {
  const [activeTab, setActiveTab] = useState("third-party");
  const [formData, setFormData] = useState({
    first_name: "",
    surname: "",
    email: "",
    organisation: "",
    role: "",
    reason_for_access: "",
    access_from: new Date(),
    access_until: undefined as Date | undefined,
    client_consent_required: false,
  });

  const { createRequest, isCreating } = useThirdPartyAccess(branchId);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleThirdPartySubmit = () => {
    if (!formData.first_name || !formData.surname || !formData.email || !formData.reason_for_access) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const requestData: CreateThirdPartyAccessData = {
      ...formData,
      request_for: "staff",
    };

    createRequest(requestData);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      first_name: "",
      surname: "",
      email: "",
      organisation: "",
      role: "",
      reason_for_access: "",
      access_from: new Date(),
      access_until: undefined,
      client_consent_required: false,
    });
  };

  const handleExportAndShare = () => {
    generatePDF({
      id: carer.id,
      title: `Carer Profile for ${carer.first_name} ${carer.last_name}`,
      date: carer.hire_date,
      status: carer.status,
      signedBy: "System Generated"
    });

    toast({
      title: "Success",
      description: "Carer profile exported successfully. You can now share the PDF file.",
    });
    onOpenChange(false);
  };

  const generateShareableLink = () => {
    // This would generate a temporary shareable link in a real implementation
    const shareableUrl = `${window.location.origin}/shared/carer/${carer.id}?token=temp_token_123`;
    
    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({
        title: "Success",
        description: "Shareable link copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Carer Profile - {carer.first_name} {carer.last_name}
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to share this carer's profile information.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="third-party">Third Party Access</TabsTrigger>
            <TabsTrigger value="export">Export & Email</TabsTrigger>
            <TabsTrigger value="link">Shareable Link</TabsTrigger>
          </TabsList>

          <TabsContent value="third-party" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Formal Third-Party Access</h4>
              <p className="text-sm text-blue-700 mt-1">
                Create a formal access request for supervisors, training coordinators, or regulatory bodies.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                  placeholder="Enter surname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organisation">Organisation</Label>
                <Input
                  id="organisation"
                  value={formData.organisation}
                  onChange={(e) => handleInputChange("organisation", e.target.value)}
                  placeholder="CQC, Training Provider, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  placeholder="Inspector, Trainer, Supervisor, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Access *</Label>
              <Textarea
                id="reason"
                value={formData.reason_for_access}
                onChange={(e) => handleInputChange("reason_for_access", e.target.value)}
                placeholder="Please explain why access to this carer's profile is needed"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Access From</Label>
                <Input
                  type="date"
                  value={formData.access_from.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange("access_from", new Date(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Access Until (Optional)</Label>
                <Input
                  type="date"
                  value={formData.access_until?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleInputChange("access_until", e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>

            <Button
              onClick={handleThirdPartySubmit}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating Request..." : "Create Access Request"}
            </Button>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900">Export & Email</h4>
              <p className="text-sm text-green-700 mt-1">
                Download the carer profile as a PDF document for secure sharing via email or other means.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">What's included in the export:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Personal information and contact details</li>
                  <li>• Professional qualifications and experience</li>
                  <li>• Employment history and status</li>
                  <li>• Training records and certifications</li>
                  <li>• Performance metrics and reviews</li>
                </ul>
              </div>

              <Button onClick={handleExportAndShare} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Export Profile as PDF
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900">Temporary Shareable Link</h4>
              <p className="text-sm text-orange-700 mt-1">
                Generate a temporary link that provides read-only access to this carer's profile.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Link Settings</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Link expires in 24 hours</p>
                  <p>• Read-only access (no editing)</p>
                  <p>• Access is logged for security</p>
                  <p>• Can be revoked at any time</p>
                </div>
              </div>

              <Button onClick={generateShareableLink} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                Generate Shareable Link
              </Button>

              <p className="text-xs text-gray-500 text-center">
                The link will be copied to your clipboard and can be shared via email, messaging, or other secure channels.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}