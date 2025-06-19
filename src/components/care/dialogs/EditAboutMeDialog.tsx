
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditAboutMeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  personalInfo?: any;
  personalCare?: any;
  isLoading?: boolean;
}

export const EditAboutMeDialog: React.FC<EditAboutMeDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  personalInfo,
  personalCare,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    // Personal Info
    cultural_preferences: "",
    language_preferences: "",
    religion: "",
    marital_status: "",
    preferred_communication: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_relationship: "",
    gp_name: "",
    gp_practice: "",
    gp_phone: "",
    // Personal Care
    personal_hygiene_needs: "",
    bathing_preferences: "",
    dressing_assistance_level: "",
    toileting_assistance_level: "",
    continence_status: "",
    sleep_patterns: "",
    behavioral_notes: "",
    comfort_measures: "",
    pain_management: "",
    skin_care_needs: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        // Personal Info
        cultural_preferences: personalInfo?.cultural_preferences || "",
        language_preferences: personalInfo?.language_preferences || "",
        religion: personalInfo?.religion || "",
        marital_status: personalInfo?.marital_status || "",
        preferred_communication: personalInfo?.preferred_communication || "",
        emergency_contact_name: personalInfo?.emergency_contact_name || "",
        emergency_contact_phone: personalInfo?.emergency_contact_phone || "",
        emergency_contact_relationship: personalInfo?.emergency_contact_relationship || "",
        next_of_kin_name: personalInfo?.next_of_kin_name || "",
        next_of_kin_phone: personalInfo?.next_of_kin_phone || "",
        next_of_kin_relationship: personalInfo?.next_of_kin_relationship || "",
        gp_name: personalInfo?.gp_name || "",
        gp_practice: personalInfo?.gp_practice || "",
        gp_phone: personalInfo?.gp_phone || "",
        // Personal Care
        personal_hygiene_needs: personalCare?.personal_hygiene_needs || "",
        bathing_preferences: personalCare?.bathing_preferences || "",
        dressing_assistance_level: personalCare?.dressing_assistance_level || "",
        toileting_assistance_level: personalCare?.toileting_assistance_level || "",
        continence_status: personalCare?.continence_status || "",
        sleep_patterns: personalCare?.sleep_patterns || "",
        behavioral_notes: personalCare?.behavioral_notes || "",
        comfort_measures: personalCare?.comfort_measures || "",
        pain_management: personalCare?.pain_management || "",
        skin_care_needs: personalCare?.skin_care_needs || "",
      });
    }
  }, [personalInfo, personalCare, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit About Me Information</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal & Cultural Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cultural_preferences">Cultural Preferences</Label>
                <Textarea
                  id="cultural_preferences"
                  value={formData.cultural_preferences}
                  onChange={(e) => handleChange('cultural_preferences', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language_preferences">Language Preferences</Label>
                <Input
                  id="language_preferences"
                  value={formData.language_preferences}
                  onChange={(e) => handleChange('language_preferences', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Input
                  id="religion"
                  value={formData.religion}
                  onChange={(e) => handleChange('religion', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select value={formData.marital_status} onValueChange={(value) => handleChange('marital_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                    <SelectItem value="civil-partnership">Civil Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_communication">Preferred Communication</Label>
                <Select value={formData.preferred_communication} onValueChange={(value) => handleChange('preferred_communication', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred communication" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="text">Text Message</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                <Input
                  id="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Next of Kin</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="next_of_kin_name">Next of Kin Name</Label>
                <Input
                  id="next_of_kin_name"
                  value={formData.next_of_kin_name}
                  onChange={(e) => handleChange('next_of_kin_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_of_kin_phone">Next of Kin Phone</Label>
                <Input
                  id="next_of_kin_phone"
                  value={formData.next_of_kin_phone}
                  onChange={(e) => handleChange('next_of_kin_phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_of_kin_relationship">Relationship</Label>
                <Input
                  id="next_of_kin_relationship"
                  value={formData.next_of_kin_relationship}
                  onChange={(e) => handleChange('next_of_kin_relationship', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">GP Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gp_name">GP Name</Label>
                <Input
                  id="gp_name"
                  value={formData.gp_name}
                  onChange={(e) => handleChange('gp_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gp_practice">GP Practice</Label>
                <Input
                  id="gp_practice"
                  value={formData.gp_practice}
                  onChange={(e) => handleChange('gp_practice', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gp_phone">GP Phone</Label>
                <Input
                  id="gp_phone"
                  value={formData.gp_phone}
                  onChange={(e) => handleChange('gp_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Care Needs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="personal_hygiene_needs">Personal Hygiene Needs</Label>
                <Textarea
                  id="personal_hygiene_needs"
                  value={formData.personal_hygiene_needs}
                  onChange={(e) => handleChange('personal_hygiene_needs', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathing_preferences">Bathing Preferences</Label>
                <Textarea
                  id="bathing_preferences"
                  value={formData.bathing_preferences}
                  onChange={(e) => handleChange('bathing_preferences', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dressing_assistance_level">Dressing Assistance Level</Label>
                <Select value={formData.dressing_assistance_level} onValueChange={(value) => handleChange('dressing_assistance_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistance level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent</SelectItem>
                    <SelectItem value="minimal-assistance">Minimal Assistance</SelectItem>
                    <SelectItem value="moderate-assistance">Moderate Assistance</SelectItem>
                    <SelectItem value="full-assistance">Full Assistance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toileting_assistance_level">Toileting Assistance Level</Label>
                <Select value={formData.toileting_assistance_level} onValueChange={(value) => handleChange('toileting_assistance_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistance level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent</SelectItem>
                    <SelectItem value="minimal-assistance">Minimal Assistance</SelectItem>
                    <SelectItem value="moderate-assistance">Moderate Assistance</SelectItem>
                    <SelectItem value="full-assistance">Full Assistance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="continence_status">Continence Status</Label>
                <Select value={formData.continence_status} onValueChange={(value) => handleChange('continence_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select continence status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="continent">Continent</SelectItem>
                    <SelectItem value="incontinent">Incontinent</SelectItem>
                    <SelectItem value="catheter">Catheter</SelectItem>
                    <SelectItem value="stoma">Stoma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleep_patterns">Sleep Patterns</Label>
                <Textarea
                  id="sleep_patterns"
                  value={formData.sleep_patterns}
                  onChange={(e) => handleChange('sleep_patterns', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="behavioral_notes">Behavioral Notes</Label>
                <Textarea
                  id="behavioral_notes"
                  value={formData.behavioral_notes}
                  onChange={(e) => handleChange('behavioral_notes', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comfort_measures">Comfort Measures</Label>
                <Textarea
                  id="comfort_measures"
                  value={formData.comfort_measures}
                  onChange={(e) => handleChange('comfort_measures', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pain_management">Pain Management</Label>
                <Textarea
                  id="pain_management"
                  value={formData.pain_management}
                  onChange={(e) => handleChange('pain_management', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skin_care_needs">Skin Care Needs</Label>
                <Textarea
                  id="skin_care_needs"
                  value={formData.skin_care_needs}
                  onChange={(e) => handleChange('skin_care_needs', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
