
import React from "react";
import { format } from "date-fns";
import { ChevronRight, User, Phone, Mail, MapPin, Heart, Shield, Pill, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PersonalInfoTabProps {
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
  };
  personalInfo?: {
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    preferred_communication?: string;
    cultural_preferences?: string;
    language_preferences?: string;
    religion?: string;
    marital_status?: string;
    next_of_kin_name?: string;
    next_of_kin_phone?: string;
    next_of_kin_relationship?: string;
    gp_name?: string;
    gp_practice?: string;
    gp_phone?: string;
  };
  medicalInfo?: {
    allergies?: string[];
    current_medications?: string[];
    medical_conditions?: string[];
    medical_history?: string;
    mobility_status?: string;
    cognitive_status?: string;
    communication_needs?: string;
    sensory_impairments?: string[];
    mental_health_status?: string;
  };
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ 
  client, 
  personalInfo, 
  medicalInfo 
}) => {
  if (!client) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No client information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return "Unknown";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-sm">{client.first_name} {client.last_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="text-sm">{client.gender || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="text-sm">
                {client.date_of_birth 
                  ? `${format(new Date(client.date_of_birth), 'MMM dd, yyyy')} (Age: ${getAge(client.date_of_birth)})`
                  : "Not specified"
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-sm">{client.address || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-sm flex items-center">
                <Phone className="h-4 w-4 mr-1 text-gray-400" />
                {client.phone || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm flex items-center">
                <Mail className="h-4 w-4 mr-1 text-gray-400" />
                {client.email || "Not specified"}
              </p>
            </div>
            {personalInfo?.preferred_communication && (
              <div>
                <p className="text-sm font-medium text-gray-500">Preferred Communication</p>
                <p className="text-sm">{personalInfo.preferred_communication}</p>
              </div>
            )}
            {personalInfo?.language_preferences && (
              <div>
                <p className="text-sm font-medium text-gray-500">Language Preferences</p>
                <p className="text-sm">{personalInfo.language_preferences}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts Card */}
      {personalInfo && (personalInfo.emergency_contact_name || personalInfo.next_of_kin_name) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {personalInfo.emergency_contact_name && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Emergency Contact</h4>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="font-medium">{personalInfo.emergency_contact_name}</p>
                    {personalInfo.emergency_contact_phone && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {personalInfo.emergency_contact_phone}
                      </p>
                    )}
                    {personalInfo.emergency_contact_relationship && (
                      <p className="text-sm text-gray-600">{personalInfo.emergency_contact_relationship}</p>
                    )}
                  </div>
                </div>
              )}
              
              {personalInfo.next_of_kin_name && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Next of Kin</h4>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="font-medium">{personalInfo.next_of_kin_name}</p>
                    {personalInfo.next_of_kin_phone && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {personalInfo.next_of_kin_phone}
                      </p>
                    )}
                    {personalInfo.next_of_kin_relationship && (
                      <p className="text-sm text-gray-600">{personalInfo.next_of_kin_relationship}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical Information Card */}
      {medicalInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-green-600" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {medicalInfo.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="text-red-600 bg-red-50 border-red-200">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {medicalInfo.medical_conditions && medicalInfo.medical_conditions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Medical Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {medicalInfo.medical_conditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {medicalInfo.current_medications && medicalInfo.current_medications.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Current Medications</p>
                  <div className="grid grid-cols-1 gap-2">
                    {medicalInfo.current_medications.map((medication, index) => (
                      <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-gray-50">
                        <div className="flex items-center">
                          <Pill className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="font-medium text-sm">{medication}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {medicalInfo.mobility_status && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mobility Status</p>
                  <p className="text-sm">{medicalInfo.mobility_status}</p>
                </div>
              )}

              {medicalInfo.cognitive_status && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Cognitive Status</p>
                  <p className="text-sm">{medicalInfo.cognitive_status}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GP Information Card */}
      {personalInfo && (personalInfo.gp_name || personalInfo.gp_practice) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              GP Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalInfo.gp_name && (
                <div>
                  <p className="text-sm font-medium text-gray-500">GP Name</p>
                  <p className="text-sm">{personalInfo.gp_name}</p>
                </div>
              )}
              {personalInfo.gp_practice && (
                <div>
                  <p className="text-sm font-medium text-gray-500">GP Practice</p>
                  <p className="text-sm">{personalInfo.gp_practice}</p>
                </div>
              )}
              {personalInfo.gp_phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">GP Phone</p>
                  <p className="text-sm flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    {personalInfo.gp_phone}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
