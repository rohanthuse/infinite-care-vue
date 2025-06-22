
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, User, CheckCircle } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { toast } from "sonner";

export default function CarerOnboarding() {
  const [profileData, setProfileData] = useState({
    phone: "",
    emergency_contact: "",
    bio: "",
    specializations: "",
    availability_notes: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { carerProfile } = useCarerAuthSafe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, we'll just simulate completion and redirect
      // In the future, this could call an API to update the profile
      console.log("Profile completion data:", profileData);
      
      toast.success("Profile completed successfully!");
      navigate("/carer-dashboard");
    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setLoading(false);
    }
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
              placeholder="Enter your phone number"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="emergency_contact">Emergency Contact</Label>
            <Input
              id="emergency_contact"
              type="text"
              placeholder="Emergency contact name and number"
              value={profileData.emergency_contact}
              onChange={(e) => setProfileData(prev => ({ ...prev, emergency_contact: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="bio">Brief Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about yourself and your experience"
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="specializations">Specializations</Label>
            <Input
              id="specializations"
              type="text"
              placeholder="e.g., Elderly care, Mental health, Mobility assistance"
              value={profileData.specializations}
              onChange={(e) => setProfileData(prev => ({ ...prev, specializations: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="availability_notes">Availability Notes</Label>
            <Textarea
              id="availability_notes"
              placeholder="Any specific availability preferences or restrictions"
              value={profileData.availability_notes}
              onChange={(e) => setProfileData(prev => ({ ...prev, availability_notes: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="pt-4">
            <CustomButton
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Completing Profile..." : "Complete Profile"}
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
