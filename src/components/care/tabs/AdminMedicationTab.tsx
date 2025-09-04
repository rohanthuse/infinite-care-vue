import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, Upload, Calendar, Clock } from "lucide-react";

interface AdminMedicationTabProps {
  clientId: string;
}

export const AdminMedicationTab: React.FC<AdminMedicationTabProps> = ({ 
  clientId 
}) => {
  const [formData, setFormData] = useState({
    // Medication Overview
    medication_use: "",
    medication_use_other: "",
    allergies: "",
    allergies_other: "",
    has_medicines_box: "",
    access_to_medicines: "",
    use_dosette_box: "",
    
    // Assistance Required
    assistance_needed: "",
    assistance_other: "",
    help_inhalers: "",
    
    // Storage & Administration
    storage_location: "",
    storage_other: "",
    administration_methods: [],
    administration_other: "",
    prescribed_by: "",
    
    // Pharmacy & GP Details
    pharmacy_name: "",
    pharmacy_address: "",
    pharmacy_phone: "",
    gp_name: "",
    gp_practice: "",
    gp_address: "",
    gp_phone: "",
    
    // PRN & Protocols
    prn_medications: "",
    protocols_followed: "",
    
    // Repeat Prescription
    repeat_frequency: "",
    repeat_other: "",
    
    // Additional Notes
    additional_notes: ""
  });

  const handleInputChange = (field: string, value: string | any[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving admin medication data:", formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Pill className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Admin Medication</h2>
      </div>

      {/* Medication Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medication Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Does the service user use medication?</Label>
            <RadioGroup
              value={formData.medication_use}
              onValueChange={(value) => handleInputChange("medication_use", value)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="med-yes" />
                <Label htmlFor="med-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="med-no" />
                <Label htmlFor="med-no">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="others" id="med-others" />
                <Label htmlFor="med-others">Others</Label>
              </div>
            </RadioGroup>
            {formData.medication_use === "others" && (
              <Input
                placeholder="Please specify..."
                value={formData.medication_use_other}
                onChange={(e) => handleInputChange("medication_use_other", e.target.value)}
              />
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Does the service user have any known allergies?</Label>
            <RadioGroup
              value={formData.allergies}
              onValueChange={(value) => handleInputChange("allergies", value)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="allergy-yes" />
                <Label htmlFor="allergy-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="allergy-no" />
                <Label htmlFor="allergy-no">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="others" id="allergy-others" />
                <Label htmlFor="allergy-others">Others</Label>
              </div>
            </RadioGroup>
            {formData.allergies === "others" && (
              <Input
                placeholder="Please specify allergies..."
                value={formData.allergies_other}
                onChange={(e) => handleInputChange("allergies_other", e.target.value)}
              />
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Does the service user have a medicines box?</Label>
            <RadioGroup
              value={formData.has_medicines_box}
              onValueChange={(value) => handleInputChange("has_medicines_box", value)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="box-yes" />
                <Label htmlFor="box-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="box-no" />
                <Label htmlFor="box-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Does the service user have access to their own medicines?</Label>
            <RadioGroup
              value={formData.access_to_medicines}
              onValueChange={(value) => handleInputChange("access_to_medicines", value)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="access-yes" />
                <Label htmlFor="access-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="access-no" />
                <Label htmlFor="access-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Does the service user use a dosette box?</Label>
            <RadioGroup
              value={formData.use_dosette_box}
              onValueChange={(value) => handleInputChange("use_dosette_box", value)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="dosette-yes" />
                <Label htmlFor="dosette-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="dosette-no" />
                <Label htmlFor="dosette-no">No</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Assistance Required Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assistance Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">What assistance is required?</Label>
            <RadioGroup
              value={formData.assistance_needed}
              onValueChange={(value) => handleInputChange("assistance_needed", value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full_administration" id="assist-full" />
                <Label htmlFor="assist-full">Full administration by carer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prompting_supervision" id="assist-prompt" />
                <Label htmlFor="assist-prompt">Prompting and supervision</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="independent" id="assist-independent" />
                <Label htmlFor="assist-independent">Service user is independent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="others" id="assist-others" />
                <Label htmlFor="assist-others">Others</Label>
              </div>
            </RadioGroup>
            {formData.assistance_needed === "others" && (
              <Input
                placeholder="Please specify assistance required..."
                value={formData.assistance_other}
                onChange={(e) => handleInputChange("assistance_other", e.target.value)}
              />
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Does the service user need help with inhalers?</Label>
            <RadioGroup
              value={formData.help_inhalers}
              onValueChange={(value) => handleInputChange("help_inhalers", value)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="inhaler-help-yes" />
                <Label htmlFor="inhaler-help-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="inhaler-help-no" />
                <Label htmlFor="inhaler-help-no">No</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Storage & Administration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Storage & Administration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Where is medication stored?</Label>
            <RadioGroup
              value={formData.storage_location}
              onValueChange={(value) => handleInputChange("storage_location", value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="locked_cabinet" id="storage-cabinet" />
                <Label htmlFor="storage-cabinet">Locked medicine cabinet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dosette_box" id="storage-dosette" />
                <Label htmlFor="storage-dosette">Dosette box</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fridge" id="storage-fridge" />
                <Label htmlFor="storage-fridge">Fridge (for temperature sensitive)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="others" id="storage-others" />
                <Label htmlFor="storage-others">Others</Label>
              </div>
            </RadioGroup>
            {formData.storage_location === "others" && (
              <Input
                placeholder="Please specify storage location..."
                value={formData.storage_other}
                onChange={(e) => handleInputChange("storage_other", e.target.value)}
              />
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Administration & Handling methods</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "Oral",
                "Topical", 
                "Injection",
                "Eye Drops",
                "Ear Drops",
                "Suppository",
                "Inhaler",
                "Other"
              ].map((method) => (
                <div key={method} className="flex items-center space-x-2">
                  <Checkbox
                    id={`admin-${method.toLowerCase().replace(' ', '-')}`}
                    checked={formData.administration_methods?.includes(method) || false}
                    onCheckedChange={(checked) => {
                      const current = formData.administration_methods || [];
                      if (checked) {
                        handleInputChange("administration_methods", [...current, method]);
                      } else {
                        handleInputChange("administration_methods", current.filter(m => m !== method));
                      }
                    }}
                  />
                  <Label htmlFor={`admin-${method.toLowerCase().replace(' ', '-')}`}>{method}</Label>
                </div>
              ))}
            </div>
            {formData.administration_methods?.includes("Other") && (
              <Input
                placeholder="Please specify other administration method..."
                value={formData.administration_other}
                onChange={(e) => handleInputChange("administration_other", e.target.value)}
              />
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="prescribed-by" className="text-sm font-medium">Prescribed by</Label>
            <Input
              id="prescribed-by"
              placeholder="Enter prescribing doctor or healthcare provider"
              value={formData.prescribed_by}
              onChange={(e) => handleInputChange("prescribed_by", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pharmacy & GP Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pharmacy & GP Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Pharmacy Details</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Pharmacy Name"
                  value={formData.pharmacy_name}
                  onChange={(e) => handleInputChange("pharmacy_name", e.target.value)}
                />
                <Textarea
                  placeholder="Pharmacy Address"
                  value={formData.pharmacy_address}
                  onChange={(e) => handleInputChange("pharmacy_address", e.target.value)}
                  rows={3}
                />
                <Input
                  placeholder="Pharmacy Phone"
                  value={formData.pharmacy_phone}
                  onChange={(e) => handleInputChange("pharmacy_phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">GP Details</Label>
              <div className="space-y-2">
                <Input
                  placeholder="GP Name"
                  value={formData.gp_name}
                  onChange={(e) => handleInputChange("gp_name", e.target.value)}
                />
                <Input
                  placeholder="GP Practice"
                  value={formData.gp_practice}
                  onChange={(e) => handleInputChange("gp_practice", e.target.value)}
                />
                <Textarea
                  placeholder="GP Practice Address"
                  value={formData.gp_address}
                  onChange={(e) => handleInputChange("gp_address", e.target.value)}
                  rows={3}
                />
                <Input
                  placeholder="GP Phone"
                  value={formData.gp_phone}
                  onChange={(e) => handleInputChange("gp_phone", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRN & Protocols Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PRN & Protocols</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="prn-medications" className="text-sm font-medium">
              PRN (As Required) Medications
            </Label>
            <Textarea
              id="prn-medications"
              placeholder="List any PRN medications and their indications..."
              value={formData.prn_medications}
              onChange={(e) => handleInputChange("prn_medications", e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="protocols" className="text-sm font-medium">
              Protocols to be followed
            </Label>
            <Textarea
              id="protocols"
              placeholder="Describe any specific protocols or procedures..."
              value={formData.protocols_followed}
              onChange={(e) => handleInputChange("protocols_followed", e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Repeat Prescription Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Repeat Prescription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">How often are repeat prescriptions required?</Label>
            <RadioGroup
              value={formData.repeat_frequency}
              onValueChange={(value) => handleInputChange("repeat_frequency", value)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="repeat-weekly" />
                <Label htmlFor="repeat-weekly">Weekly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fortnightly" id="repeat-fortnightly" />
                <Label htmlFor="repeat-fortnightly">Fortnightly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="repeat-monthly" />
                <Label htmlFor="repeat-monthly">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="others" id="repeat-others" />
                <Label htmlFor="repeat-others">Others</Label>
              </div>
            </RadioGroup>
            {formData.repeat_frequency === "others" && (
              <Input
                placeholder="Please specify frequency..."
                value={formData.repeat_other}
                onChange={(e) => handleInputChange("repeat_other", e.target.value)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 mb-2">
              Upload medication charts, MAR sheets, or other relevant documents
            </p>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Attachment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional information or special instructions regarding medication administration..."
            value={formData.additional_notes}
            onChange={(e) => handleInputChange("additional_notes", e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave}>
          Save Admin Medication
        </Button>
      </div>
    </div>
  );
};