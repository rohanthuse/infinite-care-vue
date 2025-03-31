
import React from "react";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PersonalInfoTabProps {
  carePlan: {
    patientName: string;
    patientId: string;
  };
  mockPatientData: any;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ carePlan, mockPatientData }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-sm">{carePlan.patientName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Patient ID</p>
              <p className="text-sm">{carePlan.patientId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="text-sm">{mockPatientData.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="text-sm">{format(mockPatientData.dateOfBirth, 'MMM dd, yyyy')} (Age: {new Date().getFullYear() - mockPatientData.dateOfBirth.getFullYear()})</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-sm">{mockPatientData.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-sm">{mockPatientData.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm">{mockPatientData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Preferred Language</p>
              <p className="text-sm">{mockPatientData.preferredLanguage}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Emergency Contact</p>
              <p className="text-sm">{mockPatientData.emergencyContact}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Medical Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Allergies</p>
              <div className="flex flex-wrap gap-1">
                {mockPatientData.allergies.map((allergy: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-red-600 bg-red-50 border-red-200">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Medical Conditions</p>
              <div className="flex flex-wrap gap-1">
                {mockPatientData.medicalConditions.map((condition: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Medications</p>
              <div className="grid grid-cols-1 gap-2">
                {mockPatientData.medications.map((medication: any, index: number) => (
                  <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{medication.name} ({medication.dosage})</p>
                      <p className="text-xs text-gray-500">{medication.frequency} - {medication.purpose}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
