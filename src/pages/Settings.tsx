
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Building2, Save, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomButton } from "@/components/ui/CustomButton";
import { toast } from "sonner";

const Settings = () => {
  const [formData, setFormData] = useState({
    companyName: "Med-Infinite Healthcare Services LTD",
    registrationNumber: "15038324",
    director: "Aderinsola Thomas",
    country: "England",
    mobileNumber: "1908018596",
    telephone: "1908018596",
    address: "Exchange House, 314 Midsummer Blvd MK9 2UB",
    website: "www.medinfinitehealthcareservices.com",
    email: "admin@medinfinitehealthcareservices.com",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved successfully!");
  };

  const handleCancel = () => {
    toast.info("Changes discarded");
    // Reset form to original values if needed
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <SettingsIcon className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Settings</h1>
              <p className="text-gray-500 text-sm md:text-base">Manage your company profile and settings</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
          <div className="border-b border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Company Profile</h2>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700 font-medium">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registrationNumber" className="text-gray-700 font-medium">
                  Registration Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => handleChange("registrationNumber", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="director" className="text-gray-700 font-medium">
                  Director <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="director"
                  value={formData.director}
                  onChange={(e) => handleChange("director", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country" className="text-gray-700 font-medium">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleChange("country", value)}
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-300">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="England">England</SelectItem>
                    <SelectItem value="Scotland">Scotland</SelectItem>
                    <SelectItem value="Wales">Wales</SelectItem>
                    <SelectItem value="Northern Ireland">Northern Ireland</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-gray-700 font-medium">
                  Mobile Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={(e) => handleChange("mobileNumber", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-gray-700 font-medium">
                  Telephone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-gray-700 font-medium">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-700 font-medium">
                  Website <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <CustomButton
                type="button"
                variant="outline"
                className="text-gray-700 border-gray-200"
                onClick={handleCancel}
              >
                <XCircle className="h-4 w-4 mr-2" /> Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </CustomButton>
            </div>
          </form>
        </div>
      </motion.main>
    </div>
  );
};

export default Settings;
