
import React from "react";
import { User, Phone, Mail, Calendar, MapPin, Heart, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PersonalInfoTabProps {
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    gender?: string;
    preferred_name?: string;
    status?: string;
  };
  personalInfo: {
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    preferred_communication?: string;
    gp_name?: string;
    gp_practice?: string;
    gp_phone?: string;
  };
  medicalInfo: {
    allergies?: string[];
    current_medications?: string[];
    medical_conditions?: string[];
    medical_history?: string;
  };
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
  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={onEditPersonalInfo}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <CardDescription>Basic demographic and contact information</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                <p className="text-base">{client.first_name} {client.last_name}</p>
              </div>
              {client.preferred_name && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Preferred Name</h3>
                  <p className="text-base">{client.preferred_name}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Gender</h3>
                <p className="text-base">{client.gender || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-base">
                    {client.date_of_birth ? format(new Date(client.date_of_birth), 'MMM dd, yyyy') : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-base">{client.email || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-base">{client.phone || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-base">{client.address || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {client.status || 'Active'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Name</h3>
              <p className="text-base">{personalInfo.emergency_contact_name || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Phone</h3>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-base">{personalInfo.emergency_contact_phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information Section */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Medical Information</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={onEditMedicalInfo}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <CardDescription>Medical conditions, allergies, and medications</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Allergies</h3>
              {medicalInfo.allergies && medicalInfo.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.allergies.map((allergy, index) => (
                    <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">None recorded</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Current Medications</h3>
              {medicalInfo.current_medications && medicalInfo.current_medications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.current_medications.map((medication, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {medication}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">None recorded</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Medical Conditions</h3>
              {medicalInfo.medical_conditions && medicalInfo.medical_conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.medical_conditions.map((condition, index) => (
                    <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {condition}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">None recorded</p>
              )}
            </div>
            
            {medicalInfo.medical_history && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Medical History</h3>
                <p className="text-sm text-gray-700">{medicalInfo.medical_history}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GP Information Section */}
      {(personalInfo.gp_name || personalInfo.gp_practice || personalInfo.gp_phone) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">GP Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">GP Name</h3>
                <p className="text-base">{personalInfo.gp_name || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Practice</h3>
                <p className="text-base">{personalInfo.gp_practice || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-base">{personalInfo.gp_phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
