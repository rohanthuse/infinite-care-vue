
import React from "react";
import { User, Phone, Mail, Calendar, MapPin, Heart, Edit, Building, Stethoscope } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PersonalInfoTabProps {
  client?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    gender?: string;
    preferred_name?: string;
    status?: string;
  };
  personalInfo?: {
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    preferred_communication?: string;
    gp_name?: string;
    gp_practice?: string;
    gp_phone?: string;
    gp_email?: string;
    gp_address?: string;
    nhs_number?: string;
    pharmacy_name?: string;
    pharmacy_address?: string;
    pharmacy_phone?: string;
    pharmacy_email?: string;
  };
  carePlanData?: any;
  medicalInfo?: {
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
  carePlanData,
  medicalInfo,
  onEditPersonalInfo,
  onEditMedicalInfo 
}) => {
  // Get GP and pharmacy info from care plan auto_save_data if available
  const gpInfo = carePlanData?.auto_save_data?.gp_info || personalInfo || {};
  const pharmacyInfo = carePlanData?.auto_save_data?.pharmacy_info || {};

  // Handle loading state if client data is not available
  if (!client) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GP Information Section */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white dark:from-green-950/30 dark:to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">GP Information</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={onEditPersonalInfo}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <CardDescription>General Practitioner and NHS details</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">GP Name</h3>
                <p className="text-base">{gpInfo.gp_name || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">GP Phone Number</h3>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{gpInfo.gp_phone || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">GP Email</h3>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{gpInfo.gp_email || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">GP Address</h3>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{gpInfo.gp_address || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">NHS Number</h3>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 font-mono">
                  {gpInfo.nhs_number || 'Not provided'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pharmacy Contact Section */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/30 dark:to-background">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Pharmacy Contact</CardTitle>
          </div>
          <CardDescription>Pharmacy details for prescriptions and medication</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Pharmacy Name</h3>
                <p className="text-base">{pharmacyInfo.pharmacy_name || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone Number</h3>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{pharmacyInfo.pharmacy_phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Pharmacy Address</h3>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{pharmacyInfo.pharmacy_address || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{pharmacyInfo.pharmacy_email || 'Not provided'}</p>
                </div>
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
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Name</h3>
              <p className="text-base">{personalInfo?.emergency_contact_name || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Phone</h3>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-base">{personalInfo?.emergency_contact_phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Basic Information */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Client Information</CardTitle>
          </div>
          <CardDescription>Basic client details</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h3>
                <p className="text-base">{client.first_name || ''} {client.last_name || ''}</p>
              </div>
              {client.preferred_name && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Preferred Name</h3>
                  <p className="text-base">{client.preferred_name}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">
                    {client.date_of_birth ? format(new Date(client.date_of_birth), 'MMM dd, yyyy') : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{client.email || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone</h3>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{client.phone || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                  {client.status || 'Active'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
