import React from "react";
import { User, Phone, Heart, Edit2, Plus } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PersonalInfoTabProps {
  client?: any;
  personalInfo?: any;
  medicalInfo?: any;
  onEditPersonalInfo?: () => void;
  onEditMedicalInfo?: () => void;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ 
  client, 
  personalInfo, 
  medicalInfo,
  onEditPersonalInfo,
  onEditMedicalInfo
}) => {
  // Check if medical info exists and has any data
  const hasMedicalInfo = medicalInfo && (
    (medicalInfo.allergies && medicalInfo.allergies.length > 0) ||
    (medicalInfo.medical_conditions && medicalInfo.medical_conditions.length > 0) ||
    (medicalInfo.current_medications && medicalInfo.current_medications.length > 0) ||
    medicalInfo.medical_history ||
    medicalInfo.mobility_status ||
    medicalInfo.cognitive_status ||
    medicalInfo.communication_needs ||
    (medicalInfo.sensory_impairments && medicalInfo.sensory_impairments.length > 0) ||
    medicalInfo.mental_health_status
  );

  return (
    <div className="space-y-4">
      {/* Personal Information Card - Keep existing code */}
      <Card className="overflow-hidden border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3 bg-gradient-to-r from-med-50 to-white border-b border-med-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-med-600" />
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </div>
            {onEditPersonalInfo && (
              <Button variant="outline" size="sm" onClick={onEditPersonalInfo}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <CardDescription>Patient demographic and contact details</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard 
              icon={<User className="h-5 w-5 text-med-500" />}
              title="Basic Information"
              items={[
                { label: "Full Name", value: `${client?.first_name || ''} ${client?.last_name || ''}`.trim() || "Not specified" },
                { label: "Preferred Name", value: client?.preferred_name || "Not specified" },
                { label: "Title", value: client?.title || "Not specified" },
                { label: "Gender", value: client?.gender || "Not specified" },
                { label: "Pronouns", value: client?.pronouns || "Not specified" },
                { label: "Date of Birth", value: client?.date_of_birth ? 
                  `${format(new Date(client.date_of_birth), 'MMM dd, yyyy')} (Age: ${new Date().getFullYear() - new Date(client.date_of_birth).getFullYear()})` : 
                  "Not specified"
                }
              ]}
            />
            
            <InfoCard 
              icon={<Phone className="h-5 w-5 text-med-500" />}
              title="Contact Information"
              items={[
                { label: "Address", value: client?.address || "Not specified" },
                { label: "Phone", value: client?.phone || "Not specified" },
                { label: "Mobile", value: client?.mobile_number || "Not specified" },
                { label: "Email", value: client?.email || "Not specified" },
                { label: "Region", value: client?.region || "Not specified" },
                { label: "Other ID", value: client?.other_identifier || "Not specified" }
              ]}
            />
          </div>

          {client?.additional_information && (
            <div className="mt-6">
              <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                  <User className="h-5 w-5 mr-2 text-med-600" />
                  Additional Information
                </h3>
                <div className="p-4 rounded-lg bg-med-50 border border-med-100">
                  <p className="text-gray-700">{client.additional_information}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Medical Information Card - Updated to handle empty state */}
      <Card className="overflow-hidden border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3 bg-gradient-to-r from-med-50 to-white border-b border-med-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-med-600" />
              <CardTitle className="text-lg">Medical Information</CardTitle>
            </div>
            {onEditMedicalInfo && (
              <Button variant="outline" size="sm" onClick={onEditMedicalInfo}>
                {hasMedicalInfo ? (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medical Information
                  </>
                )}
              </Button>
            )}
          </div>
          <CardDescription>Allergies, conditions, and current medications</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!hasMedicalInfo ? (
            // Empty state
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Medical Information Available</h3>
              <p className="text-gray-500 mb-4">
                Add medical information including allergies, conditions, medications, and health status.
              </p>
              {onEditMedicalInfo && (
                <Button onClick={onEditMedicalInfo} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Medical Information
                </Button>
              )}
            </div>
          ) : (
            // Existing medical information display
            <div className="space-y-6">
              {medicalInfo?.allergies && medicalInfo.allergies.length > 0 && (
                <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    Allergies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {medicalInfo.allergies.map((allergy: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1 hover:bg-red-100 transition-colors">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {medicalInfo?.medical_conditions && medicalInfo.medical_conditions.length > 0 && (
                <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                    <Heart className="h-5 w-5 mr-2 text-med-600" />
                    Medical Conditions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {medicalInfo.medical_conditions.map((condition: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-med-50 text-med-700 border-med-200 px-3 py-1 hover:bg-med-100 transition-colors">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {medicalInfo?.current_medications && medicalInfo.current_medications.length > 0 && (
                <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                    <Heart className="h-5 w-5 mr-2 text-med-600" />
                    Current Medications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {medicalInfo.current_medications.map((medication: string, index: number) => (
                      <div key={index} className="p-4 rounded-lg bg-white border border-med-100 hover:border-med-300 shadow-sm hover:shadow-md transition-all">
                        <p className="font-medium text-med-700">{medication}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {medicalInfo?.medical_history && (
                <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                    <Heart className="h-5 w-5 mr-2 text-med-600" />
                    Medical History
                  </h3>
                  <div className="p-4 rounded-lg bg-med-50 border border-med-100">
                    <p className="text-gray-700">{medicalInfo.medical_history}</p>
                  </div>
                </div>
              )}

              {/* Additional medical info fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {medicalInfo?.mobility_status && (
                  <InfoCard 
                    icon={<Heart className="h-5 w-5 text-med-500" />}
                    title="Mobility Status"
                    items={[
                      { label: "Status", value: medicalInfo.mobility_status }
                    ]}
                  />
                )}
                
                {medicalInfo?.cognitive_status && (
                  <InfoCard 
                    icon={<Heart className="h-5 w-5 text-med-500" />}
                    title="Cognitive Status"
                    items={[
                      { label: "Status", value: medicalInfo.cognitive_status }
                    ]}
                  />
                )}
                
                {medicalInfo?.communication_needs && (
                  <InfoCard 
                    icon={<Heart className="h-5 w-5 text-med-500" />}
                    title="Communication Needs"
                    items={[
                      { label: "Needs", value: medicalInfo.communication_needs }
                    ]}
                  />
                )}
                
                {medicalInfo?.mental_health_status && (
                  <InfoCard 
                    icon={<Heart className="h-5 w-5 text-med-500" />}
                    title="Mental Health"
                    items={[
                      { label: "Status", value: medicalInfo.mental_health_status }
                    ]}
                  />
                )}
              </div>

              {medicalInfo?.sensory_impairments && medicalInfo.sensory_impairments.length > 0 && (
                <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
                    <Heart className="h-5 w-5 mr-2 text-med-600" />
                    Sensory Impairments
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {medicalInfo.sensory_impairments.map((impairment: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 hover:bg-purple-100 transition-colors">
                        {impairment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  items: { label: string; value: string }[];
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, items }) => {
  return (
    <div className="bg-white rounded-lg p-5 border border-med-100 shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-md font-medium mb-4 flex items-center text-med-700">
        {icon}
        <span className="ml-2">{title}</span>
      </h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-2 gap-2">
            <p className="text-sm font-medium text-gray-500">{item.label}</p>
            <p className="text-sm text-gray-700">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
