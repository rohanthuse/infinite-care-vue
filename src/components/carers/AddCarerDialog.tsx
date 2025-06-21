
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, User, Shield, FileText, CreditCard } from "lucide-react";
import { useCreateCarerWithInvitation, CreateCarerData } from "@/data/hooks/useBranchCarers";
import { toast } from "sonner";

interface AddCarerDialogProps {
  branchId?: string;
}

export const AddCarerDialog = ({ branchId }: AddCarerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState<Partial<CreateCarerData>>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    experience: "",
    specialization: "",
    availability: "Full-time",
    date_of_birth: "",
    national_insurance_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    dbs_check_date: "",
    dbs_certificate_number: "",
    dbs_status: "pending",
    qualifications: [],
    certifications: [],
    contract_start_date: "",
    contract_type: "permanent",
    salary_amount: 0,
    salary_frequency: "monthly",
    bank_account_name: "",
    bank_account_number: "",
    bank_sort_code: "",
    bank_name: "",
  });

  const createCarerMutation = useCreateCarerWithInvitation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!branchId) {
      toast.error("No branch ID provided");
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.specialization) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const carerData: CreateCarerData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.address,
        experience: formData.experience,
        specialization: formData.specialization,
        availability: formData.availability || "Full-time",
        date_of_birth: formData.date_of_birth,
        branch_id: branchId,
        national_insurance_number: formData.national_insurance_number,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        dbs_check_date: formData.dbs_check_date,
        dbs_certificate_number: formData.dbs_certificate_number,
        dbs_status: formData.dbs_status,
        qualifications: formData.qualifications,
        certifications: formData.certifications,
        contract_start_date: formData.contract_start_date,
        contract_type: formData.contract_type,
        salary_amount: formData.salary_amount,
        salary_frequency: formData.salary_frequency,
        bank_account_name: formData.bank_account_name,
        bank_account_number: formData.bank_account_number,
        bank_sort_code: formData.bank_sort_code,
        bank_name: formData.bank_name,
      };

      await createCarerMutation.mutateAsync(carerData);
      
      // Reset form and close dialog
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        experience: "",
        specialization: "",
        availability: "Full-time",
        date_of_birth: "",
        national_insurance_number: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: "",
        dbs_check_date: "",
        dbs_certificate_number: "",
        dbs_status: "pending",
        qualifications: [],
        certifications: [],
        contract_start_date: "",
        contract_type: "permanent",
        salary_amount: 0,
        salary_frequency: "monthly",
        bank_account_name: "",
        bank_account_number: "",
        bank_sort_code: "",
        bank_name: "",
      });
      setActiveTab("personal");
      setOpen(false);
    } catch (error) {
      console.error('[AddCarerDialog] Error creating carer:', error);
    }
  };

  const handleInputChange = (field: keyof CreateCarerData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Carer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Carer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="contract" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contract
              </TabsTrigger>
              <TabsTrigger value="banking" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Banking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niNumber">National Insurance Number</Label>
                  <Input
                    id="niNumber"
                    value={formData.national_insurance_number}
                    onChange={(e) => handleInputChange("national_insurance_number", e.target.value)}
                    placeholder="QQ 12 34 56 C"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Name</Label>
                    <Input
                      id="emergencyName"
                      value={formData.emergency_contact_name}
                      onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input
                    id="emergencyRelationship"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Select value={formData.specialization} onValueChange={(value) => handleInputChange("specialization", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home Care">Home Care</SelectItem>
                    <SelectItem value="Elderly Care">Elderly Care</SelectItem>
                    <SelectItem value="Disability Support">Disability Support</SelectItem>
                    <SelectItem value="Mental Health">Mental Health</SelectItem>
                    <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                    <SelectItem value="Nurse">Nurse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select value={formData.availability} onValueChange={(value) => handleInputChange("availability", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="On-call">On-call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    placeholder="e.g., 3 years"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">DBS Check</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dbsDate">DBS Check Date</Label>
                    <Input
                      id="dbsDate"
                      type="date"
                      value={formData.dbs_check_date}
                      onChange={(e) => handleInputChange("dbs_check_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dbsCertificate">Certificate Number</Label>
                    <Input
                      id="dbsCertificate"
                      value={formData.dbs_certificate_number}
                      onChange={(e) => handleInputChange("dbs_certificate_number", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dbsStatus">DBS Status</Label>
                  <Select value={formData.dbs_status} onValueChange={(value) => handleInputChange("dbs_status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select DBS status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="issues">Issues Found</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contract" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractStart">Contract Start Date</Label>
                  <Input
                    id="contractStart"
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) => handleInputChange("contract_start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type</Label>
                  <Select value={formData.contract_type} onValueChange={(value) => handleInputChange("contract_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="zero-hours">Zero Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary Amount</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary_amount}
                    onChange={(e) => handleInputChange("salary_amount", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryFreq">Salary Frequency</Label>
                  <Select value={formData.salary_frequency} onValueChange={(value) => handleInputChange("salary_frequency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="banking" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange("bank_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  value={formData.bank_account_name}
                  onChange={(e) => handleInputChange("bank_account_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortCode">Sort Code</Label>
                  <Input
                    id="sortCode"
                    value={formData.bank_sort_code}
                    onChange={(e) => handleInputChange("bank_sort_code", e.target.value)}
                    placeholder="12-34-56"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.bank_account_number}
                    onChange={(e) => handleInputChange("bank_account_number", e.target.value)}
                    placeholder="12345678"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {activeTab !== "personal" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["personal", "compliance", "contract", "banking"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
                  }}
                >
                  Previous
                </Button>
              )}
              {activeTab !== "banking" ? (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ["personal", "compliance", "contract", "banking"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={createCarerMutation.isPending}>
                  {createCarerMutation.isPending ? "Adding..." : "Add Carer & Send Invitation"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
