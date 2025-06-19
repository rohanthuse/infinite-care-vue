import React from "react";
import { Edit2, Plus } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Personal Information</h3>
          {onEditPersonalInfo && (
            <Button variant="outline" size="sm" onClick={onEditPersonalInfo}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Title</h4>
            <p className="mt-1">{client?.title || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">First Name</h4>
            <p className="mt-1">{client?.first_name || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Middle Name</h4>
            <p className="mt-1">{client?.middle_name || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Last Name</h4>
            <p className="mt-1">{client?.last_name || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Preferred Name</h4>
            <p className="mt-1">{client?.preferred_name || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Pronouns</h4>
            <p className="mt-1">{client?.pronouns || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
            <p className="mt-1">{client?.date_of_birth ? 
              `${format(new Date(client.date_of_birth), 'PPP')} (Age: ${new Date().getFullYear() - new Date(client.date_of_birth).getFullYear()})` : 
              'Not specified'
            }</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Gender</h4>
            <p className="mt-1">{client?.gender || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Client ID</h4>
            <p className="mt-1">{client?.id}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Other Identifier</h4>
            <p className="mt-1">{client?.other_identifier || 'Not specified'}</p>
          </div>
        </div>
      </Card>

      {/* Contact Information Card */}
      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Email</h4>
            <p className="mt-1">{client?.email || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Phone</h4>
            <p className="mt-1">{client?.phone || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Mobile Number</h4>
            <p className="mt-1">{client?.mobile_number || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Address</h4>
            <p className="mt-1">{client?.address || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Region</h4>
            <p className="mt-1">{client?.region || 'Not specified'}</p>
          </div>
        </div>
      </Card>

      {/* Additional Information Card */}
      {client?.additional_information && (
        <Card className="p-4 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium mb-4">Additional Information</h3>
          <p className="whitespace-pre-wrap">{client.additional_information}</p>
        </Card>
      )}

      {/* Medical Information Card */}
      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Medical Information</h3>
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

        {!hasMedicalInfo ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              No medical information available. Add medical information including allergies, conditions, medications, and health status.
            </p>
            {onEditMedicalInfo && (
              <Button onClick={onEditMedicalInfo} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Medical Information
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Allergies */}
            {medicalInfo?.allergies && medicalInfo.allergies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Allergies</h4>
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.allergies.map((allergy: string, index: number) => (
                    <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Conditions */}
            {medicalInfo?.medical_conditions && medicalInfo.medical_conditions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Medical Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.medical_conditions.map((condition: string, index: number) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Current Medications */}
            {medicalInfo?.current_medications && medicalInfo.current_medications.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Current Medications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {medicalInfo.current_medications.map((medication: string, index: number) => (
                    <div key={index} className="p-2 border border-gray-200 rounded">
                      <p className="text-sm">{medication}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical History */}
            {medicalInfo?.medical_history && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Medical History</h4>
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-sm">{medicalInfo.medical_history}</p>
                </div>
              </div>
            )}

            {/* Other Medical Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalInfo?.mobility_status && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Mobility Status</h4>
                  <p className="mt-1">{medicalInfo.mobility_status}</p>
                </div>
              )}
              
              {medicalInfo?.cognitive_status && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Cognitive Status</h4>
                  <p className="mt-1">{medicalInfo.cognitive_status}</p>
                </div>
              )}
              
              {medicalInfo?.communication_needs && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Communication Needs</h4>
                  <p className="mt-1">{medicalInfo.communication_needs}</p>
                </div>
              )}
              
              {medicalInfo?.mental_health_status && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Mental Health Status</h4>
                  <p className="mt-1">{medicalInfo.mental_health_status}</p>
                </div>
              )}
            </div>

            {/* Sensory Impairments */}
            {medicalInfo?.sensory_impairments && medicalInfo.sensory_impairments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Sensory Impairments</h4>
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.sensory_impairments.map((impairment: string, index: number) => (
                    <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      {impairment}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
