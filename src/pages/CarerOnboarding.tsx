
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, User, CheckCircle } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useUpdateCarer } from "@/data/hooks/useBranchCarers";
import { toast } from "sonner";

export default function CarerOnboarding() {
  const [profileData, setProfileData] = useState({
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    specialization: "",
    availability: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { carerProfile } = useCarerAuth();
  const updateCarerMutation = useUpdateCarer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!carerProfile?.id) {
        throw new Error("No carer profile found");
      }

      // Update the carer profile with onboarding data
      await updateCarerMutation.mutateAsync({
        id: carerProfile.id,
        phone: profileData.phone || carerProfile.phone,
        emergency_contact_name: profileData.emergency_contact_name,
        emergency_contact_phone: profileData.emergency_contact_phone,
        specialization: profileData.specialization || carerProfile.specialization,
        availability: profileData.availability || carerProfile.availability,
        first_login_completed: true,
        profile_completed: true
      });
      
      toast.success("Profile completed successfully!");
      navigate("/carer-dashboard");
    } catch (error: any) {
      console.error("Profile completion error:", error);
      toast.error(error.message || "Failed to complete profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 text-2xl font-semibold mb-4">
            <Heart className="h-7 w-7 text-blue-600" />
            <span>CarePortal</span>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <User className="h-12 w-12 text-blue-600 bg-blue-100 rounded-full p-2" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {carerProfile?.first_name}!
          </h1>
          <p className="text-gray-600">
            Let's complete your profile to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={carerProfile?.phone || "Enter your phone number"}
              value={profileData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
            <Input
              id="emergency_contact_name"
              type="text"
              placeholder={carerProfile?.emergency_contact_name || "Emergency contact name"}
              value={profileData.emergency_contact_name}
              onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              placeholder={carerProfile?.emergency_contact_phone || "Emergency contact phone"}
              value={profileData.emergency_contact_phone}
              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              type="text"
              placeholder={carerProfile?.specialization || "e.g., Elderly care, Mental health, Mobility assistance"}
              value={profileData.specialization}
              onChange={(e) => handleInputChange('specialization', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="availability">Availability</Label>
            <Textarea
              id="availability"
              placeholder={carerProfile?.availability || "Your availability preferences"}
              value={profileData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              rows={2}
            />
          </div>

          <div className="pt-4">
            <CustomButton
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || updateCarerMutation.isPending}
            >
              {loading || updateCarerMutation.isPending ? "Completing Profile..." : "Complete Profile"}
              <CheckCircle className="ml-2 h-4 w-4" />
            </CustomButton>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            You can update this information later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}
