import React, { useState, useEffect, useRef } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Building2, Save, XCircle, Loader2, Lock, Eye, EyeOff, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomButton } from "@/components/ui/CustomButton";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserOrganization } from "@/hooks/useUserOrganization";
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
  logo_url?: string;
};

const fetchCompanySettings = async (organizationId: string | undefined): Promise<CompanySettings | null> => {
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  
  if (!data) return null;

  // Map organization fields to CompanySettings format
  return {
    id: data.id,
    company_name: data.name || '',
    registration_number: (data as any).registration_number || '',
    director: (data as any).director || '',
    country: (data as any).country || '',
    mobile_number: data.contact_phone || '',
    telephone: data.contact_phone || '',
    address: data.address || '',
    website: (data as any).website || '',
    email: data.contact_email || '',
    logo_url: data.logo_url || '',
  };
};

const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
  if (!settings.id) throw new Error("Organization ID is missing.");
  const { id, ...updateData } = settings;

  // Map CompanySettings fields to organizations table columns
  const updatePayload: any = {
    name: updateData.company_name,
    contact_email: updateData.email,
    contact_phone: updateData.mobile_number || updateData.telephone,
    address: updateData.address,
    country: updateData.country,
  };

  // Add new columns if they exist in the form data
  if (updateData.registration_number !== undefined) {
    updatePayload.registration_number = updateData.registration_number;
  }
  if (updateData.director !== undefined) {
    updatePayload.director = updateData.director;
  }
  if (updateData.website !== undefined) {
    updatePayload.website = updateData.website;
  }
  if (updateData.logo_url !== undefined) {
    updatePayload.logo_url = updateData.logo_url;
  }

  const { error } = await supabase
    .from('organizations')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw new Error(error.message);
};

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
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
  
  // Get user's organization
  const { data: userOrg } = useUserOrganization();

  const { data: settings, isLoading, isError, error } = useQuery({
    queryKey: ['companySettings', userOrg?.id],
    queryFn: () => fetchCompanySettings(userOrg?.id),
    enabled: !!userOrg?.id,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setInitialData(settings);
    }
  }, [settings]);

  // Sync logoPreview with fetched logo_url
  useEffect(() => {
    if (settings?.logo_url) {
      setLogoPreview(settings.logo_url);
    }
  }, [settings?.logo_url]);

  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ['companySettings', userOrg?.id] });
    },
    onError: (error: any) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData.logo_url || null
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      toast.error("Unable to verify user. Please log in again.");
      setIsUpdatingPassword(false);
      return;
    }

    // Verify current password by attempting to sign in.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: values.currentPassword,
    });

    if (signInError) {
      toast.error("Incorrect current password. Please try again.");
      setIsUpdatingPassword(false);
      return;
    }

    // If current password is correct, proceed to update to the new password.
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

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    
    // Add feedback for logo change
    if (logoPreview) {
      toast.info('New logo selected. Click "Save Changes" to update.');
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    handleChange('logo_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadLogo = async (organizationId: string): Promise<string | null> => {
    if (!logoFile) return null;

    setUploadingLogo(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${organizationId}/logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast.error(`Failed to upload logo: ${error.message}`);
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let updatedFormData = { ...formData };
    
    // Upload logo if a new file is selected
    if (logoFile && formData.id) {
      const logoUrl = await uploadLogo(formData.id);
      if (logoUrl) {
        updatedFormData.logo_url = logoUrl;
      }
    }
    
    updateSettings(updatedFormData);
  };

  const handleCancel = () => {
    setFormData(initialData);
    toast.info("Changes discarded");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DashboardHeader />
        <DashboardNavbar />
        <motion.main 
          className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        >
          <div className="bg-muted/50 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-card rounded-xl shadow-sm"><SettingsIcon className="h-7 w-7 text-primary" /></div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-sm md:text-base">Manage your company profile and settings</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
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
      <div className="min-h-screen flex flex-col bg-background">
        <DashboardHeader />
        <DashboardNavbar />
        <div className="flex-1 flex items-center justify-center text-destructive">
          Error fetching settings: {error.message}
        </div>
      </div>
    );
  }

  // Logo Preview Modal Component
  const LogoViewModal = () => {
    if (!showLogoModal || !logoPreview) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={() => setShowLogoModal(false)}
      >
        <div 
          className="relative bg-card rounded-xl max-w-4xl max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowLogoModal(false)}
            className="absolute top-4 right-4 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-4">Company Logo Preview</h3>
            <img
              src={logoPreview}
              alt="Company Logo Full View"
              className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-muted/50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl shadow-sm">
              <SettingsIcon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Settings</h1>
              <p className="text-muted-foreground text-sm md:text-base">Manage your company profile and settings</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Company Profile</h2>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6">
            {/* Company Logo Upload Section */}
            <div className="space-y-4 pb-6 border-b border-border">
              <Label className="text-foreground font-medium">
                Company Logo
              </Label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Logo Preview */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <>
                        <img
                          src={logoPreview}
                          alt="Company Logo"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                          disabled={isUpdating || uploadingLogo}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No logo</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoSelect}
                    className="hidden"
                    disabled={isUpdating || uploadingLogo}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Upload/Change Logo Button */}
                    <CustomButton
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUpdating || uploadingLogo}
                      className="flex-1 sm:flex-none"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </CustomButton>
                    
                    {/* View Logo Button - Only show if logo exists */}
                    {logoPreview && (
                      <CustomButton
                        type="button"
                        variant="outline"
                        onClick={() => setShowLogoModal(true)}
                        disabled={isUpdating || uploadingLogo}
                        className="flex-1 sm:flex-none"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Logo
                      </CustomButton>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, max 5MB (JPEG, PNG, WebP)
                  </p>
                  {uploadingLogo && (
                    <p className="text-xs text-primary">Uploading logo...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-foreground font-medium">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.company_name || ''}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="border-border focus:border-primary"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registrationNumber" className="text-foreground font-medium">
                  Registration Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="registrationNumber"
                  value={formData.registration_number || ''}
                  onChange={(e) => handleChange("registration_number", e.target.value)}
                  className="border-border focus:border-primary"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="director" className="text-foreground font-medium">
                  Director <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="director"
                  value={formData.director || ''}
                  onChange={(e) => handleChange("director", e.target.value)}
                  className="border-border focus:border-primary"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country" className="text-foreground font-medium">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.country || ''}
                  onValueChange={(value) => handleChange("country", value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="border-border focus:border-primary">
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
                <Label htmlFor="mobileNumber" className="text-foreground font-medium">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mobileNumber"
                  value={formData.mobile_number || ''}
                  onChange={(e) => handleChange("mobile_number", e.target.value)}
                  className="border-border focus:border-primary"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-foreground font-medium">
                  Telephone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telephone"
                  value={formData.telephone || ''}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  className="border-border focus:border-primary"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-foreground font-medium">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="border-border focus:border-primary"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website" className="text-foreground font-medium">
                  Website <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className="border-border focus:border-primary"
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="border-border focus:border-primary"
                  required
                  disabled={isUpdating}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <CustomButton
                type="button"
                variant="outline"
                className="text-foreground border-border"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2" /> Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </CustomButton>
            </div>
          </form>
        </div>
        
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
            </div>
          </div>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="p-5 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="md:col-span-2">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              className="border-border focus:border-primary pr-10"
                              disabled={isUpdatingPassword}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                            >
                              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="border-border focus:border-primary pr-10"
                            disabled={isUpdatingPassword}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
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
                      <FormLabel className="text-foreground font-medium">Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Input
                            type={showConfirmPassword ? "text" : "password"}
                            className="border-border focus:border-primary pr-10"
                            disabled={isUpdatingPassword}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
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
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <CustomButton
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </CustomButton>
              </div>
            </form>
          </Form>
        </div>
      </motion.main>
      
      {/* Logo View Modal */}
      <LogoViewModal />
    </div>
  );
};

export default Settings;
