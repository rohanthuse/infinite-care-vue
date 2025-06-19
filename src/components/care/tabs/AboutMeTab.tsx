
import React from "react";
import { User, Heart, Phone, FileText, Edit2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AboutMeTabProps {
  personalInfo?: any;
  personalCare?: any;
  onEditAboutMe?: () => void;
}

export const AboutMeTab: React.FC<AboutMeTabProps> = ({ 
  personalInfo, 
  personalCare,
  onEditAboutMe 
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">About Me</CardTitle>
            </div>
            {onEditAboutMe && (
              <Button variant="outline" size="sm" onClick={onEditAboutMe}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <CardDescription>Personal preferences and care information</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal & Cultural Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2 text-blue-600" />
                Personal & Cultural
              </h3>
              
              <div className="space-y-3">
                <InfoItem 
                  label="Cultural Preferences" 
                  value={personalInfo?.cultural_preferences || "Not specified"} 
                />
                <InfoItem 
                  label="Language Preferences" 
                  value={personalInfo?.language_preferences || "Not specified"} 
                />
                <InfoItem 
                  label="Religion" 
                  value={personalInfo?.religion || "Not specified"} 
                />
                <InfoItem 
                  label="Marital Status" 
                  value={personalInfo?.marital_status || "Not specified"} 
                />
                <InfoItem 
                  label="Preferred Communication" 
                  value={personalInfo?.preferred_communication || "Not specified"} 
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-red-600" />
                Emergency Contact
              </h3>
              
              <div className="space-y-3">
                <InfoItem 
                  label="Name" 
                  value={personalInfo?.emergency_contact_name || "Not specified"} 
                />
                <InfoItem 
                  label="Phone" 
                  value={personalInfo?.emergency_contact_phone || "Not specified"} 
                />
                <InfoItem 
                  label="Relationship" 
                  value={personalInfo?.emergency_contact_relationship || "Not specified"} 
                />
              </div>
            </div>

            {/* Next of Kin */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Heart className="h-4 w-4 mr-2 text-green-600" />
                Next of Kin
              </h3>
              
              <div className="space-y-3">
                <InfoItem 
                  label="Name" 
                  value={personalInfo?.next_of_kin_name || "Not specified"} 
                />
                <InfoItem 
                  label="Phone" 
                  value={personalInfo?.next_of_kin_phone || "Not specified"} 
                />
                <InfoItem 
                  label="Relationship" 
                  value={personalInfo?.next_of_kin_relationship || "Not specified"} 
                />
              </div>
            </div>

            {/* GP Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-purple-600" />
                GP Information
              </h3>
              
              <div className="space-y-3">
                <InfoItem 
                  label="GP Name" 
                  value={personalInfo?.gp_name || "Not specified"} 
                />
                <InfoItem 
                  label="GP Practice" 
                  value={personalInfo?.gp_practice || "Not specified"} 
                />
                <InfoItem 
                  label="GP Phone" 
                  value={personalInfo?.gp_phone || "Not specified"} 
                />
              </div>
            </div>
          </div>

          {/* Personal Care Needs */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <Heart className="h-4 w-4 mr-2 text-blue-600" />
              Personal Care Needs
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <InfoItem 
                  label="Personal Hygiene Needs" 
                  value={personalCare?.personal_hygiene_needs || "Not specified"} 
                />
                <InfoItem 
                  label="Bathing Preferences" 
                  value={personalCare?.bathing_preferences || "Not specified"} 
                />
                <InfoItem 
                  label="Dressing Assistance Level" 
                  value={personalCare?.dressing_assistance_level || "Not specified"} 
                />
                <InfoItem 
                  label="Toileting Assistance Level" 
                  value={personalCare?.toileting_assistance_level || "Not specified"} 
                />
                <InfoItem 
                  label="Continence Status" 
                  value={personalCare?.continence_status || "Not specified"} 
                />
              </div>
              
              <div className="space-y-3">
                <InfoItem 
                  label="Sleep Patterns" 
                  value={personalCare?.sleep_patterns || "Not specified"} 
                />
                <InfoItem 
                  label="Behavioral Notes" 
                  value={personalCare?.behavioral_notes || "Not specified"} 
                />
                <InfoItem 
                  label="Comfort Measures" 
                  value={personalCare?.comfort_measures || "Not specified"} 
                />
                <InfoItem 
                  label="Pain Management" 
                  value={personalCare?.pain_management || "Not specified"} 
                />
                <InfoItem 
                  label="Skin Care Needs" 
                  value={personalCare?.skin_care_needs || "Not specified"} 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => {
  return (
    <div className="border-l-4 border-blue-200 pl-3 py-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-700 mt-1">{value}</p>
    </div>
  );
};
