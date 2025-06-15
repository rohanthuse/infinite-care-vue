import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, User, X, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AddAdminFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAdded: () => void;
}

const titleOptions = ["Mr", "Mrs", "Ms", "Dr", "Prof"];
const countryOptions = ["England", "Scotland", "Wales", "Northern Ireland"];

const initialPermissions = {
  system: true,
  finance: true,
  under_review_care_plan: true,
  confirmed_care_plan: true,
  reviews: true,
  third_party: true,
  report_accounting: true,
  report_total_working_hours: true,
  report_staff: true,
  report_client: true,
  report_service: true,
  accounting_extra_time: true,
  accounting_expense: true,
  accounting_travel: true,
  accounting_invoices: true,
  accounting_gross_payslip: true,
  accounting_travel_management: true,
  accounting_client_rate: true,
  accounting_authority_rate: true,
  accounting_staff_rate: true,
  accounting_rate_management: true,
  accounting_staff_bank_detail: true,
};

type Permissions = typeof initialPermissions;

export function AddAdminForm({
  isOpen,
  onClose,
  onAdminAdded
}: AddAdminFormProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [date, setDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);

  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    branchId: "",
    title: "",
    firstName: "",
    middleName: "",
    surname: "",
    email: "",
    telephone: "",
    mobile: "",
    gender: "male",
    knownAs: "",
    country: "",
    city: "",
    postalCode: "",
    houseNumber: "",
    street: "",
    county: ""
  });

  const handlePermissionChange = (permission: keyof Permissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: value }));
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { branchId, title, firstName, surname, email, mobile, country } = formData;
    if (!branchId || !title || !firstName || !surname || !email || !mobile || !country) {
      toast({
        title: "Required fields missing",
        description: "Please fill out all fields marked with an asterisk (*).",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.surname,
          branchId: formData.branchId,
          permissions: permissions,
        }
      });

      if (error) {
        // Catches network errors or function crashes
        throw new Error(error.message);
      }
      
      if (data && data.error) {
        // Catches application-level errors from the function
        throw new Error(data.error);
      }

      toast({
        title: "Admin Invited",
        description: `An invitation email has been sent to ${formData.email}.`,
        duration: 5000
      });
      onAdminAdded(); // This will refetch the admins list and close the modal
    } catch (error: any) {
      console.error('Failed to invite admin:', error);
      toast({
        title: "Invitation Failed",
        description: error.message || "An unexpected error occurred. Please check the function logs for details.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: branches, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('branches').select('id, name');
      if (error) {
        toast({ title: "Error", description: "Could not fetch branches.", variant: "destructive" });
        return [];
      }
      return data;
    },
    enabled: isOpen, // Only fetch when the dialog is open
  });

  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle className="text-xl flex items-center font-semibold text-gray-800">
            <User className="h-5 w-5 mr-2 text-blue-600" /> Add Admin
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full" onValueChange={setActiveTab}>
            <div className="px-6 border-b">
              <TabsList className="h-12 p-0 bg-transparent border-b-0">
                <TabsTrigger value="personal" className={cn("h-12 px-4 border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none bg-transparent", activeTab === "personal" ? "font-medium" : "text-gray-500")}>
                  Personal Details
                </TabsTrigger>
                <TabsTrigger value="permissions" className={cn("h-12 px-4 border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none bg-transparent", activeTab === "permissions" ? "font-medium" : "text-gray-500")}>
                  Permissions
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <TabsContent value="personal" className="m-0 py-2">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="branch" className="text-gray-700 font-medium flex items-center">
                        Branches<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select value={formData.branchId} onValueChange={value => handleFormChange('branchId', value)}>
                        <SelectTrigger id="branch" className="w-full h-10 rounded-md border-gray-300" disabled={isLoadingBranches}>
                          <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select Branch..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {branches?.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-gray-700 font-medium flex items-center">
                        Title<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select value={formData.title} onValueChange={value => handleFormChange('title', value)}>
                        <SelectTrigger id="title" className="w-full h-10 rounded-md border-gray-300">
                          <SelectValue placeholder="Select Item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {titleOptions.map(title => <SelectItem key={title} value={title}>{title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700 font-medium flex items-center">
                        First Name<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input id="firstName" value={formData.firstName} onChange={e => handleFormChange('firstName', e.target.value)} className="h-10 rounded-md border-gray-300" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName" className="text-gray-700 font-medium">
                        Middle Name
                      </Label>
                      <Input id="middleName" value={formData.middleName} onChange={e => handleFormChange('middleName', e.target.value)} className="h-10 rounded-md border-gray-300" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="surname" className="text-gray-700 font-medium flex items-center">
                        Surname<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input id="surname" value={formData.surname} onChange={e => handleFormChange('surname', e.target.value)} className="h-10 rounded-md border-gray-300" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="knownAs" className="text-gray-700 font-medium">
                        Known As
                      </Label>
                      <Input id="knownAs" value={formData.knownAs} onChange={e => handleFormChange('knownAs', e.target.value)} className="h-10 rounded-md border-gray-300" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium flex items-center">
                        Email<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => handleFormChange('email', e.target.value)} className="h-10 rounded-md border-gray-300" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-gray-700 font-medium">
                        Date of Birth
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full h-10 rounded-md border-gray-300 text-left font-normal justify-start", !date && "text-gray-400")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "dd-MM-yyyy") : "dd-mm-yyyy"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="text-gray-700 font-medium">
                        Telephone
                      </Label>
                      <Input id="telephone" type="tel" value={formData.telephone} onChange={e => handleFormChange('telephone', e.target.value)} className="h-10 rounded-md border-gray-300" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-gray-700 font-medium flex items-center">
                        Mobile<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input id="mobile" type="tel" value={formData.mobile} onChange={e => handleFormChange('mobile', e.target.value)} className="h-10 rounded-md border-gray-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Gender
                    </Label>
                    <RadioGroup value={formData.gender} onValueChange={value => handleFormChange('gender', value)} className="flex items-center space-x-6 pt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Address Fields */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Address Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-gray-700 font-medium flex items-center">
                          Country<span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select value={formData.country} onValueChange={value => handleFormChange('country', value)}>
                          <SelectTrigger id="country" className="w-full h-10 rounded-md border-gray-300">
                            <SelectValue placeholder="Select Country..." />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map(country => <SelectItem key={country} value={country}>{country}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-gray-700 font-medium">
                          City
                        </Label>
                        <Input id="city" value={formData.city} onChange={e => handleFormChange('city', e.target.value)} className="h-10 rounded-md border-gray-300" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-gray-700 font-medium">
                          Postal Code
                        </Label>
                        <Input id="postalCode" value={formData.postalCode} onChange={e => handleFormChange('postalCode', e.target.value)} className="h-10 rounded-md border-gray-300" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="houseNumber" className="text-gray-700 font-medium">
                          House No/Name
                        </Label>
                        <Input id="houseNumber" value={formData.houseNumber} onChange={e => handleFormChange('houseNumber', e.target.value)} className="h-10 rounded-md border-gray-300" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="street" className="text-gray-700 font-medium">
                          Street
                        </Label>
                        <Input id="street" value={formData.street} onChange={e => handleFormChange('street', e.target.value)} className="h-10 rounded-md border-gray-300" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="county" className="text-gray-700 font-medium">
                          County
                        </Label>
                        <Input id="county" value={formData.county} onChange={e => handleFormChange('county', e.target.value)} className="h-10 rounded-md border-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="m-0 py-2 space-y-6">
                {/* Branch Settings Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Branch Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system" className="text-gray-700">System</Label>
                      <Switch id="system" checked={permissions.system} onCheckedChange={(value) => handlePermissionChange('system', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="finance" className="text-gray-700">Finance</Label>
                      <Switch id="finance" checked={permissions.finance} onCheckedChange={(value) => handlePermissionChange('finance', value)} />
                    </div>
                  </div>
                </div>

                {/* Care Plan Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Care Plan</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="underReviewCarePlan" className="text-gray-700">Under Review Care Plan</Label>
                      <Switch id="underReviewCarePlan" checked={permissions.under_review_care_plan} onCheckedChange={(value) => handlePermissionChange('under_review_care_plan', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="confirmedCarePlan" className="text-gray-700">Confirmed Care Plan</Label>
                      <Switch id="confirmedCarePlan" checked={permissions.confirmed_care_plan} onCheckedChange={(value) => handlePermissionChange('confirmed_care_plan', value)} />
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Reviews</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reviews" className="text-gray-700">Reviews</Label>
                      <Switch id="reviews" checked={permissions.reviews} onCheckedChange={(value) => handlePermissionChange('reviews', value)} />
                    </div>
                  </div>
                </div>

                {/* Third Party Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Third Party</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="thirdParty" className="text-gray-700">Third Party</Label>
                      <Switch id="thirdParty" checked={permissions.third_party} onCheckedChange={(value) => handlePermissionChange('third_party', value)} />
                    </div>
                  </div>
                </div>

                {/* Branch Report Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Branch Report</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accounting" className="text-gray-700">Accounting</Label>
                      <Switch id="accounting" checked={permissions.report_accounting} onCheckedChange={(value) => handlePermissionChange('report_accounting', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="totalWorkingHours" className="text-gray-700">Total Working Hours</Label>
                      <Switch id="totalWorkingHours" checked={permissions.report_total_working_hours} onCheckedChange={(value) => handlePermissionChange('report_total_working_hours', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staff" className="text-gray-700">Staff</Label>
                      <Switch id="staff" checked={permissions.report_staff} onCheckedChange={(value) => handlePermissionChange('report_staff', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="client" className="text-gray-700">Client</Label>
                      <Switch id="client" checked={permissions.report_client} onCheckedChange={(value) => handlePermissionChange('report_client', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="service" className="text-gray-700">Service</Label>
                      <Switch id="service" checked={permissions.report_service} onCheckedChange={(value) => handlePermissionChange('report_service', value)} />
                    </div>
                  </div>
                </div>

                {/* Accounting Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Accounting</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="extraTime" className="text-gray-700">Extra Time</Label>
                      <Switch id="extraTime" checked={permissions.accounting_extra_time} onCheckedChange={(value) => handlePermissionChange('accounting_extra_time', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expense" className="text-gray-700">Expense</Label>
                      <Switch id="expense" checked={permissions.accounting_expense} onCheckedChange={(value) => handlePermissionChange('accounting_expense', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="travel" className="text-gray-700">Travel</Label>
                      <Switch id="travel" checked={permissions.accounting_travel} onCheckedChange={(value) => handlePermissionChange('accounting_travel', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="invoices" className="text-gray-700">Invoices</Label>
                      <Switch id="invoices" checked={permissions.accounting_invoices} onCheckedChange={(value) => handlePermissionChange('accounting_invoices', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="grossPayslip" className="text-gray-700">Gross Payslip</Label>
                      <Switch id="grossPayslip" checked={permissions.accounting_gross_payslip} onCheckedChange={(value) => handlePermissionChange('accounting_gross_payslip', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="travelManagement" className="text-gray-700">Travel Management</Label>
                      <Switch id="travelManagement" checked={permissions.accounting_travel_management} onCheckedChange={(value) => handlePermissionChange('accounting_travel_management', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clientRate" className="text-gray-700">Client Rate</Label>
                      <Switch id="clientRate" checked={permissions.accounting_client_rate} onCheckedChange={(value) => handlePermissionChange('accounting_client_rate', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="authorityRate" className="text-gray-700">Authority Rate</Label>
                      <Switch id="authorityRate" checked={permissions.accounting_authority_rate} onCheckedChange={(value) => handlePermissionChange('accounting_authority_rate', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staffRate" className="text-gray-700">Staff Rate</Label>
                      <Switch id="staffRate" checked={permissions.accounting_staff_rate} onCheckedChange={(value) => handlePermissionChange('accounting_staff_rate', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rateManagement" className="text-gray-700">Rate Management</Label>
                      <Switch id="rateManagement" checked={permissions.accounting_rate_management} onCheckedChange={(value) => handlePermissionChange('accounting_rate_management', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staffBankDetail" className="text-gray-700">Staff's Bank Detail</Label>
                      <Switch id="staffBankDetail" checked={permissions.accounting_staff_bank_detail} onCheckedChange={(value) => handlePermissionChange('accounting_staff_bank_detail', value)} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-gray-50/80">
              <div className="flex justify-end gap-2 w-full">
                <Button type="button" variant="outline" onClick={onClose} className="border-gray-200 rounded-md" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inviting...</> : 'Invite Admin'}
                </Button>
              </div>
            </DialogFooter>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>;
}
