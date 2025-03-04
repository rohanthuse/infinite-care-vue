
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { UserPlus, Calendar as CalendarIcon, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AddAdminFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const branchOptions = [
  "Brielle Health Care Services- Milton Keynes",
  "Brielle Health Care Services- London",
  "Brielle Health Care Services- Manchester"
];

const titleOptions = [
  "Mr",
  "Mrs",
  "Ms",
  "Dr",
  "Prof"
];

const countryOptions = [
  "England",
  "Scotland",
  "Wales",
  "Northern Ireland"
];

export function AddAdminForm({ isOpen, onClose }: AddAdminFormProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [date, setDate] = useState<Date>();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Admin created successfully",
      description: "The new administrator has been added to the system",
      duration: 3000,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle className="text-xl flex items-center font-semibold text-gray-800">
            <User className="h-5 w-5 mr-2 text-blue-600" /> Add Admin
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full" onValueChange={setActiveTab}>
            <div className="px-6 border-b">
              <TabsList className="h-12 p-0 bg-transparent border-b-0 space-x-6">
                <TabsTrigger 
                  value="personal" 
                  className={cn(
                    "h-12 px-0 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent",
                    activeTab === "personal" ? "font-medium" : "text-gray-500"
                  )}
                >
                  Personal Details
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  className={cn(
                    "h-12 px-0 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent",
                    activeTab === "permissions" ? "font-medium" : "text-gray-500"
                  )}
                >
                  Permissions
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <TabsContent value="personal" className="m-0 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch" className="text-gray-700 font-medium flex items-center">
                        Branch<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select required>
                        <SelectTrigger id="branch" className="w-full h-10 rounded-lg border-gray-200">
                          <SelectValue placeholder="Select Branch..." />
                        </SelectTrigger>
                        <SelectContent>
                          {branchOptions.map((branch) => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-red-500 text-xs mt-1">This field is required.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-gray-700 font-medium flex items-center">
                        Title<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select required>
                        <SelectTrigger id="title" className="w-full h-10 rounded-lg border-gray-200">
                          <SelectValue placeholder="Select Title..." />
                        </SelectTrigger>
                        <SelectContent>
                          {titleOptions.map((title) => (
                            <SelectItem key={title} value={title}>{title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-red-500 text-xs mt-1">This field is required.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700 font-medium flex items-center">
                        First Name<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input id="firstName" required className="h-10 rounded-lg border-gray-200" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName" className="text-gray-700 font-medium">
                        Middle Name
                      </Label>
                      <Input id="middleName" className="h-10 rounded-lg border-gray-200" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="surname" className="text-gray-700 font-medium flex items-center">
                        Surname<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input id="surname" required className="h-10 rounded-lg border-gray-200" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium flex items-center">
                        Email<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input id="email" type="email" required className="h-10 rounded-lg border-gray-200" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-gray-700 font-medium">
                        Date of Birth
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-10 rounded-lg border-gray-200 text-left font-normal justify-start",
                              !date && "text-gray-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "dd-MM-yyyy") : "dd-mm-yyyy"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="text-gray-700 font-medium">
                        Telephone
                      </Label>
                      <Input id="telephone" type="tel" className="h-10 rounded-lg border-gray-200" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-gray-700 font-medium flex items-center">
                        Mobile<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input id="mobile" required type="tel" className="h-10 rounded-lg border-gray-200" />
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label className="text-gray-700 font-medium">
                        Gender
                      </Label>
                      <RadioGroup defaultValue="male" className="flex items-center space-x-6 pt-2">
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
                  </div>
                </div>
                
                {/* Address Fields Section */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-gray-700 font-medium flex items-center">
                        Country<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select required>
                        <SelectTrigger id="country" className="w-full h-10 rounded-lg border-gray-200">
                          <SelectValue placeholder="Select Country..." />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((country) => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-700 font-medium">
                        City
                      </Label>
                      <Input id="city" className="h-10 rounded-lg border-gray-200" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-gray-700 font-medium">
                        Postal Code
                      </Label>
                      <Input id="postalCode" className="h-10 rounded-lg border-gray-200" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber" className="text-gray-700 font-medium">
                        House No/Name
                      </Label>
                      <Input id="houseNumber" className="h-10 rounded-lg border-gray-200" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-gray-700 font-medium">
                        Street
                      </Label>
                      <Input id="street" className="h-10 rounded-lg border-gray-200" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="county" className="text-gray-700 font-medium">
                        County
                      </Label>
                      <Input id="county" className="h-10 rounded-lg border-gray-200" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="m-0 py-2 space-y-8">
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Branch Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system" className="text-gray-700">System</Label>
                      <Switch id="system" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="finance" className="text-gray-700">Finance</Label>
                      <Switch id="finance" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Care Plan</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="underReviewCarePlan" className="text-gray-700">Under Review Care Plan</Label>
                      <Switch id="underReviewCarePlan" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="confirmedCarePlan" className="text-gray-700">Confirmed Care Plan</Label>
                      <Switch id="confirmedCarePlan" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Reviews</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reviews" className="text-gray-700">Reviews</Label>
                      <Switch id="reviews" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Third Party</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="thirdParty" className="text-gray-700">Third Party</Label>
                      <Switch id="thirdParty" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Branch Report</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accounting" className="text-gray-700">Accounting</Label>
                      <Switch id="accounting" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="totalWorkingHours" className="text-gray-700">Total Working Hours</Label>
                      <Switch id="totalWorkingHours" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staff" className="text-gray-700">Staff</Label>
                      <Switch id="staff" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="client" className="text-gray-700">Client</Label>
                      <Switch id="client" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="service" className="text-gray-700">Service</Label>
                      <Switch id="service" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Accounting</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="extraTime" className="text-gray-700">Extra Time</Label>
                      <Switch id="extraTime" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expense" className="text-gray-700">Expense</Label>
                      <Switch id="expense" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="travel" className="text-gray-700">Travel</Label>
                      <Switch id="travel" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="invoices" className="text-gray-700">Invoices</Label>
                      <Switch id="invoices" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="grossPayslip" className="text-gray-700">Gross Payslip</Label>
                      <Switch id="grossPayslip" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="travelManagement" className="text-gray-700">Travel Management</Label>
                      <Switch id="travelManagement" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clientRate" className="text-gray-700">Client Rate</Label>
                      <Switch id="clientRate" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="authorityRate" className="text-gray-700">Authority Rate</Label>
                      <Switch id="authorityRate" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staffRate" className="text-gray-700">Staff Rate</Label>
                      <Switch id="staffRate" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rateManagement" className="text-gray-700">Rate Management</Label>
                      <Switch id="rateManagement" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staffBankDetail" className="text-gray-700">Staff's Bank Detail</Label>
                      <Switch id="staffBankDetail" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-gray-50/80">
              <div className="flex justify-end gap-2 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="border-gray-200 rounded-full"
                >
                  Cancel
                </Button>
                <CustomButton 
                  type="submit"
                  variant="pill"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium"
                >
                  <UserPlus className="h-4 w-4 mr-1" /> Add Admin
                </CustomButton>
              </div>
            </DialogFooter>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
