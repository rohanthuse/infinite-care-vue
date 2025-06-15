import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Building2, Save, XCircle, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomButton } from "@/components/ui/CustomButton";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type CompanySettings = {
  id: string;
  company_name: string;
  registration_number: string;
  director: string;
  country: string;
  mobile_number: string;
  telephone: string;
  address: string;
  website: string;
  email: string;
};

const fetchCompanySettings = async (): Promise<CompanySettings | null> => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
  if (!settings.id) throw new Error("Settings ID is missing.");
  const { id, ...updateData } = settings;

  const { error } = await supabase
    .from('company_settings')
    .update(updateData)
    .eq('id', id);

  if (error) throw new Error(error.message);
};

const passwordFormSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const Settings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CompanySettings>>({});
  const [initialData, setInitialData] = useState<Partial<CompanySettings>>({});

  const { data: settings, isLoading, isError, error } = useQuery({
    queryKey: ['companySettings'],
    queryFn: fetchCompanySettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setInitialData(settings);
    }
  }, [settings]);

  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      toast.error(`Failed to update password: ${error.message}`);
    } else {
      toast.success("Password updated successfully!");
      passwordForm.reset();
    }
    setIsUpdatingPassword(false);
  };

  const handleChange = (field: keyof Omit<CompanySettings, 'id'>, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleCancel = () => {
    setFormData(initialData);
    toast.info("Changes discarded");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <motion.main 
          className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        >
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm"><SettingsIcon className="h-7 w-7 text-blue-600" /></div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Settings</h1>
                <p className="text-gray-500 text-sm md:text-base">Manage your company profile and settings</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`space-y-2 ${i === 6 ? 'md:col-span-2' : ''}`}>
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </motion.main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <div className="flex-1 flex items-center justify-center text-red-500">
          Error fetching settings: {error.message}
        </div>
      </div>
    );
  }

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
                  value={formData.company_name || ''}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registrationNumber" className="text-gray-700 font-medium">
                  Registration Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="registrationNumber"
                  value={formData.registration_number || ''}
                  onChange={(e) => handleChange("registration_number", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="director" className="text-gray-700 font-medium">
                  Director <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="director"
                  value={formData.director || ''}
                  onChange={(e) => handleChange("director", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country" className="text-gray-700 font-medium">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.country || ''}
                  onValueChange={(value) => handleChange("country", value)}
                  disabled={isUpdating}
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
                  value={formData.mobile_number || ''}
                  onChange={(e) => handleChange("mobile_number", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-gray-700 font-medium">
                  Telephone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telephone"
                  value={formData.telephone || ''}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-gray-700 font-medium">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-700 font-medium">
                  Website <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="border-gray-200 focus:border-blue-300"
                  required
                  disabled={isUpdating}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <CustomButton
                type="button"
                variant="outline"
                className="text-gray-700 border-gray-200"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2" /> Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </CustomButton>
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
          <div className="border-b border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
            </div>
          </div>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="p-5 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="border-gray-200 focus:border-blue-300 pr-10"
                            disabled={isUpdatingPassword}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Input
                            type={showConfirmPassword ? "text" : "password"}
                            className="border-gray-200 focus:border-blue-300 pr-10"
                            disabled={isUpdatingPassword}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <CustomButton
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isUpdatingPassword ? 'Saving...' : 'Update Password'}
                </CustomButton>
              </div>
            </form>
          </Form>
        </div>
      </motion.main>
    </div>
  );
};

export default Settings;
