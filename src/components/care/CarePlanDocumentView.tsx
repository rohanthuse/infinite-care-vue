import React from "react";
import { format } from "date-fns";
import { 
  User, 
  Heart, 
  Target, 
  Activity, 
  FileText, 
  Shield, 
  Utensils, 
  Clock,
  Phone,
  MapPin,
  Calendar,
  Users,
  Stethoscope,
  Pill,
  AlertTriangle,
  Settings,
  UserCog,
  Eye,
  Edit
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { useCarePlanGoals } from "@/hooks/useCarePlanGoals";

interface CarePlanDocumentViewProps {
  carePlan: {
    id: string;
    patientName: string;
    patientId: string;
    dateCreated: Date;
    lastUpdated: Date;
    status: string;
    assignedTo: string;
    assignedToType: string;
    isStaffProvider: boolean;
    avatar: string;
  };
  clientProfile: any;
  personalInfo: any;
  medicalInfo: any;
  dietaryRequirements: any;
  personalCare: any;
  assessments: any[];
  equipment: any[];
  riskAssessments: any[];
  serviceActions: any[];
  onEditPersonalInfo: () => void;
  onEditMedicalInfo: () => void;
  onEditAboutMe: () => void;
  onEditDietaryRequirements: () => void;
  onEditPersonalCare: () => void;
  onAddGoal: () => void;
  onToggleViewMode?: () => void;
}

export const CarePlanDocumentView: React.FC<CarePlanDocumentViewProps> = ({
  carePlan,
  clientProfile,
  personalInfo,
  medicalInfo,
  dietaryRequirements,
  personalCare,
  assessments,
  equipment,
  riskAssessments,
  serviceActions,
  onEditPersonalInfo,
  onEditMedicalInfo,
  onEditAboutMe,
  onEditDietaryRequirements,
  onEditPersonalCare,
  onAddGoal,
  onToggleViewMode
}) => {
  const { data: goals = [] } = useCarePlanGoals(carePlan.id);

  // Quick navigation sections
  const sections = [
    { id: "overview", label: "Overview", icon: User },
    { id: "personal", label: "Personal Info", icon: User },
    { id: "medical", label: "Medical Info", icon: Stethoscope },
    { id: "goals", label: "Care Goals", icon: Target },
    { id: "dietary", label: "Dietary", icon: Utensils },
    { id: "personal-care", label: "Personal Care", icon: Heart },
    { id: "assessments", label: "Assessments", icon: FileText },
    { id: "equipment", label: "Equipment", icon: Settings },
    { id: "risks", label: "Risk Assessments", icon: Shield },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'on-hold': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-muted border-r border-border p-4 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Document View</h3>
            {onToggleViewMode && (
              <Button variant="ghost" size="sm" onClick={onToggleViewMode} className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Tab View
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-card hover:shadow-sm transition-all duration-200 flex items-center gap-2"
              >
                <section.icon className="h-4 w-4 text-muted-foreground" />
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Overview Section */}
        <section id="overview">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-full h-full flex items-center justify-center text-lg font-bold">
                      {carePlan.avatar}
                    </div>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{carePlan.patientName}</CardTitle>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="custom" className={getStatusColor(carePlan.status)}>
                        {carePlan.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">ID: {carePlan.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">{format(carePlan.dateCreated, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">{format(carePlan.lastUpdated, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Assigned To</p>
                    <p className="text-sm text-muted-foreground">{carePlan.assignedTo}</p>
                    <Badge variant={carePlan.isStaffProvider ? "default" : "outline"} className="text-xs mt-1">
                      {carePlan.assignedToType}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Personal Information */}
        <section id="personal">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle>Personal Information</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onEditPersonalInfo}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clientProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Date of Birth</p>
                    <p className="text-sm">{clientProfile.date_of_birth ? format(new Date(clientProfile.date_of_birth), 'MMM dd, yyyy') : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Gender</p>
                    <p className="text-sm">{clientProfile.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Phone</p>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {clientProfile.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm">{clientProfile.email || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-foreground">Address</p>
                    <p className="text-sm flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5" />
                      {clientProfile.address || 'Not provided'}
                    </p>
                  </div>
                  {clientProfile.emergency_contact_name && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-foreground">Emergency Contact</p>
                        <p className="text-sm">{clientProfile.emergency_contact_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Emergency Phone</p>
                        <p className="text-sm">{clientProfile.emergency_contact_phone}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Personal information not available</p>
              )}
              
              {/* Cultural & Personal Preferences */}
              {personalInfo && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Cultural & Personal Preferences</h4>
                    <Button variant="outline" size="sm" onClick={onEditAboutMe}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Language</p>
                      <p className="text-sm">{personalInfo.language || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Religion</p>
                      <p className="text-sm">{personalInfo.religion || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Cultural Background</p>
                      <p className="text-sm">{personalInfo.cultural_background || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Marital Status</p>
                      <p className="text-sm">{personalInfo.marital_status || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Medical Information */}
        <section id="medical">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-red-600" />
                  <CardTitle>Medical Information</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onEditMedicalInfo}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {medicalInfo ? (
                <div className="space-y-4">
                  {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Allergies</p>
                      <div className="flex flex-wrap gap-2">
                        {medicalInfo.allergies.map((allergy: string, index: number) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {medicalInfo.medications && medicalInfo.medications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Current Diagnosis</p>
                      <div className="space-y-2">
                        {medicalInfo.medications.map((medication: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                            <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <div>
                              <p className="text-sm font-medium">{medication.name}</p>
                              <p className="text-xs text-muted-foreground">{medication.dosage} - {medication.frequency}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {medicalInfo.conditions && medicalInfo.conditions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Medical Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {medicalInfo.conditions.map((condition: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {medicalInfo.medical_history && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Medical History</p>
                      <p className="text-sm bg-muted p-3 rounded">{medicalInfo.medical_history}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Medical information not available</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Care Goals */}
        <section id="goals">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <CardTitle>Care Goals</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onAddGoal}>
                  <Target className="h-4 w-4 mr-1" />
                  Add Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">{goal.description}</h4>
                        <Badge variant="custom" className={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                      </div>
                      {goal.progress !== null && goal.progress !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      )}
                      {goal.notes && (
                        <div className="mt-3 text-sm text-muted-foreground bg-muted p-3 rounded">
                          <strong>Notes:</strong> {goal.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No care goals have been set for this care plan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Dietary Requirements */}
        <section id="dietary">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-600" />
                  <CardTitle>Dietary Requirements</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onEditDietaryRequirements}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dietaryRequirements ? (
                <div className="space-y-4">
                  {dietaryRequirements.allergies && dietaryRequirements.allergies.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Food Allergies</p>
                      <div className="flex flex-wrap gap-2">
                        {dietaryRequirements.allergies.map((allergy: string, index: number) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {dietaryRequirements.restrictions && dietaryRequirements.restrictions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Dietary Restrictions</p>
                      <div className="flex flex-wrap gap-2">
                        {dietaryRequirements.restrictions.map((restriction: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {dietaryRequirements.preferences && dietaryRequirements.preferences.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Food Preferences</p>
                      <div className="flex flex-wrap gap-2">
                        {dietaryRequirements.preferences.map((preference: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {preference}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {dietaryRequirements.special_considerations && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Special Considerations</p>
                      <p className="text-sm bg-muted p-3 rounded">{dietaryRequirements.special_considerations}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No dietary requirements specified</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Personal Care */}
        <section id="personal-care">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  <CardTitle>Personal Care</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onEditPersonalCare}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {personalCare ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Mobility</p>
                    <p className="text-sm">{personalCare.mobility || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Hygiene Assistance</p>
                    <Badge variant="outline" className="text-xs">
                      {personalCare.hygiene_assistance || 'Not specified'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Bathing Assistance</p>
                    <Badge variant="outline" className="text-xs">
                      {personalCare.bathing_assistance || 'Not specified'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Dressing Assistance</p>
                    <Badge variant="outline" className="text-xs">
                      {personalCare.dressing_assistance || 'Not specified'}
                    </Badge>
                  </div>
                  {personalCare.behavioral_notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-foreground mb-2">Behavioral Notes</p>
                      <p className="text-sm bg-muted p-3 rounded">{personalCare.behavioral_notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No personal care information available</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Additional sections can be added here following the same pattern */}
        {/* Assessments, Equipment, Risk Assessments, etc. */}
        
        {/* Summary Statistics */}
        <section id="summary" className="mt-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">Care Plan Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{goals.length}</div>
                  <div className="text-sm text-muted-foreground">Active Goals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{assessments.length}</div>
                  <div className="text-sm text-muted-foreground">Assessments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{equipment.length}</div>
                  <div className="text-sm text-muted-foreground">Equipment Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{riskAssessments.length}</div>
                  <div className="text-sm text-muted-foreground">Risk Assessments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};