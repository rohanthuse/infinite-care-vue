import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Edit, FileText, Calendar, User, Target, Activity, Pill, Heart, Utensils, ShieldCheck, Clock, 
         Phone, MapPin, AlertTriangle, Briefcase, FileX, Settings, Info, 
         UserCheck, Stethoscope, Home, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCarePlanData, CarePlanWithDetails } from '@/hooks/useCarePlanData';

interface CarePlanViewDialogProps {
  carePlanId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CarePlanViewDialog({ carePlanId, open, onOpenChange }: CarePlanViewDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const { data: carePlan, isLoading } = useCarePlanData(carePlanId);
  
  // Type assertion to access extended properties
  const carePlanWithDetails = carePlan as CarePlanWithDetails;

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleExport = () => {
    // Export functionality - to be implemented
    console.log('Export care plan:', carePlanId);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!carePlan) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Care plan not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Care Plan - {carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : 'Unknown Client'}
              </DialogTitle>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(carePlan.status)}>
                  {carePlan.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {carePlan.display_id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant={isEditMode ? "destructive" : "default"} 
                size="sm" 
                onClick={handleEditToggle}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? "Cancel Edit" : "Edit Plan"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <div className="px-6 border-b">
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
                <TabsTrigger value="overview" className="text-xs">
                  <Info className="h-3 w-3 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="client" className="text-xs">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Client
                </TabsTrigger>
                <TabsTrigger value="medical" className="text-xs">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  Medical
                </TabsTrigger>
                <TabsTrigger value="personal-care" className="text-xs">
                  <Home className="h-3 w-3 mr-1" />
                  Personal Care
                </TabsTrigger>
                <TabsTrigger value="dietary" className="text-xs">
                  <UtensilsCrossed className="h-3 w-3 mr-1" />
                  Dietary
                </TabsTrigger>
                <TabsTrigger value="goals" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  Goals
                </TabsTrigger>
                <TabsTrigger value="activities" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Activities
                </TabsTrigger>
                <TabsTrigger value="medications" className="text-xs">
                  <Pill className="h-3 w-3 mr-1" />
                  Medications
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="equipment" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Equipment
                </TabsTrigger>
                <TabsTrigger value="risks" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Risks
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs">
                  <FileX className="h-3 w-3 mr-1" />
                  Documents
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Care Plan Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Provider</label>
                          <p className="text-sm">
                            {carePlan.provider_name || (carePlan.staff ? `${carePlan.staff.first_name} ${carePlan.staff.last_name}` : 'Not assigned')}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Provider Type</label>
                          <p className="text-sm capitalize">{carePlan.staff_id ? 'Internal Staff' : 'External Provider'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                          <p className="text-sm">
                            {carePlan.start_date ? format(new Date(carePlan.start_date), 'PPP') : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">End Date</label>
                          <p className="text-sm">
                            {carePlan.end_date ? format(new Date(carePlan.end_date), 'PPP') : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Review Date</label>
                          <p className="text-sm">
                            {carePlanWithDetails.review_date ? format(new Date(carePlanWithDetails.review_date), 'PPP') : 'Not scheduled'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Created</label>
                          <p className="text-sm">
                            {format(new Date(carePlan.created_at), 'PPP')}
                          </p>
                        </div>
                      </div>
                      
                      {carePlanWithDetails.notes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Notes</label>
                          <p className="text-sm mt-1 p-3 bg-muted rounded-md">{carePlanWithDetails.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Client Information Tab */}
                <TabsContent value="client" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {carePlanWithDetails.personal_info ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-sm">
                              {carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : 'Not available'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                            <p className="text-sm">
                              {carePlanWithDetails.personal_info.date_of_birth ? format(new Date(carePlanWithDetails.personal_info.date_of_birth), 'PPP') : 'Not available'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-sm">{carePlanWithDetails.personal_info.phone || 'Not available'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Address</label>
                            <p className="text-sm">{carePlanWithDetails.personal_info.address || 'Not available'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                            <p className="text-sm">{carePlanWithDetails.personal_info.emergency_contact_name || 'Not available'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Emergency Phone</label>
                            <p className="text-sm">{carePlanWithDetails.personal_info.emergency_contact_phone || 'Not available'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No client information available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Medical Information Tab */}
                <TabsContent value="medical" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Medical Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {carePlanWithDetails.medical_info ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">GP Name</label>
                              <p className="text-sm">{carePlanWithDetails.medical_info.gp_name || 'Not available'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">GP Phone</label>
                              <p className="text-sm">{carePlanWithDetails.medical_info.gp_phone || 'Not available'}</p>
                            </div>
                          </div>
                          
                          {carePlanWithDetails.medical_info.medical_conditions && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-2 block">Medical Conditions</label>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(carePlanWithDetails.medical_info.medical_conditions) ? 
                                  carePlanWithDetails.medical_info.medical_conditions.map((condition: string, index: number) => (
                                    <Badge key={index} variant="outline">{condition}</Badge>
                                  )) : 
                                  <Badge variant="outline">{carePlanWithDetails.medical_info.medical_conditions}</Badge>
                                }
                              </div>
                            </div>
                          )}
                          
                          {carePlanWithDetails.medical_info.allergies && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-2 block">Allergies</label>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(carePlanWithDetails.medical_info.allergies) ? 
                                  carePlanWithDetails.medical_info.allergies.map((allergy: string, index: number) => (
                                    <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">{allergy}</Badge>
                                  )) : 
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{carePlanWithDetails.medical_info.allergies}</Badge>
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No medical information available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Personal Care Tab */}
                <TabsContent value="personal-care" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Personal Care Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {carePlanWithDetails.personal_care ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Mobility Level</label>
                              <p className="text-sm">{carePlanWithDetails.personal_care.mobility_level || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Communication</label>
                              <p className="text-sm">{carePlanWithDetails.personal_care.communication || 'Not specified'}</p>
                            </div>
                          </div>
                          
                          {carePlanWithDetails.personal_care.care_needs && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-2 block">Care Needs</label>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(carePlanWithDetails.personal_care.care_needs) ? 
                                  carePlanWithDetails.personal_care.care_needs.map((need: string, index: number) => (
                                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{need}</Badge>
                                  )) : 
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{carePlanWithDetails.personal_care.care_needs}</Badge>
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No personal care information available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Dietary Requirements Tab */}
                <TabsContent value="dietary" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5" />
                        Dietary Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {carePlanWithDetails.dietary_requirements ? (
                        <div className="space-y-4">
                          {carePlanWithDetails.dietary_requirements.food_allergies && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-2 block">Food Allergies</label>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(carePlanWithDetails.dietary_requirements.food_allergies) ? 
                                  carePlanWithDetails.dietary_requirements.food_allergies.map((allergy: string, index: number) => (
                                    <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">{allergy}</Badge>
                                  )) : 
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{carePlanWithDetails.dietary_requirements.food_allergies}</Badge>
                                }
                              </div>
                            </div>
                          )}
                          
                          {carePlanWithDetails.dietary_requirements.dietary_restrictions && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-2 block">Dietary Restrictions</label>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(carePlanWithDetails.dietary_requirements.dietary_restrictions) ? 
                                  carePlanWithDetails.dietary_requirements.dietary_restrictions.map((restriction: string, index: number) => (
                                    <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{restriction}</Badge>
                                  )) : 
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{carePlanWithDetails.dietary_requirements.dietary_restrictions}</Badge>
                                }
                              </div>
                            </div>
                          )}
                          
                          {carePlanWithDetails.dietary_requirements.food_preferences && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-2 block">Food Preferences</label>
                              <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.dietary_requirements.food_preferences}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No dietary requirements available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Goals & Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {carePlanWithDetails.goals && carePlanWithDetails.goals.length > 0 ? (
                        <div className="space-y-4">
                          {carePlanWithDetails.goals.map((goal: any, index: number) => (
                            <Card key={index} className="border-l-4 border-l-primary">
                              <CardContent className="pt-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium">{goal.description || goal.title || `Goal ${index + 1}`}</h4>
                                    <Badge className={goal.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                      {goal.status || 'In Progress'}
                                    </Badge>
                                  </div>
                                  
                                  {goal.progress !== undefined && (
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{goal.progress}%</span>
                                      </div>
                                      <Progress value={goal.progress} className="h-2" />
                                    </div>
                                  )}
                                  
                                  {goal.notes && (
                                    <p className="text-sm text-muted-foreground">{goal.notes}</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No goals defined</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Activities Tab */}
                <TabsContent value="activities" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Daily Activities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {carePlanWithDetails.activities && carePlanWithDetails.activities.length > 0 ? (
                        <div className="space-y-4">
                          {carePlanWithDetails.activities.map((activity: any, index: number) => (
                            <Card key={index} className="border-l-4 border-l-blue-500">
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium">{activity.name || activity.title || `Activity ${index + 1}`}</h4>
                                    <Badge variant="outline">{activity.frequency || 'Daily'}</Badge>
                                  </div>
                                  
                                  {activity.description && (
                                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                                  )}
                                  
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className={`h-4 w-4 ${activity.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`} />
                                    <span className="text-sm capitalize">{activity.status || 'Planned'}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No activities defined</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Medications Tab */}
                <TabsContent value="medications" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        Medications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {carePlanWithDetails.medications && carePlanWithDetails.medications.length > 0 ? (
                        <div className="space-y-4">
                          {carePlanWithDetails.medications.map((medication: any, index: number) => (
                            <Card key={index} className="border-l-4 border-l-green-500">
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium">{medication.name || `Medication ${index + 1}`}</h4>
                                    <Badge className={medication.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                      {medication.status || 'Active'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">Dosage</label>
                                      <p className="font-medium">{medication.dosage || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Frequency</label>
                                      <p className="font-medium">{medication.frequency || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Duration</label>
                                      <p className="font-medium">
                                        {medication.start_date && medication.end_date ? 
                                          `${format(new Date(medication.start_date), 'MMM dd')} - ${format(new Date(medication.end_date), 'MMM dd')}` : 
                                          'Ongoing'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No medications prescribed</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Services Tab */}
                <TabsContent value="services" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Service Plans
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {carePlanWithDetails.service_plans && carePlanWithDetails.service_plans.length > 0 ? (
                        <div className="space-y-4">
                          {carePlanWithDetails.service_plans.map((service: any, index: number) => (
                            <Card key={index} className="border-l-4 border-l-purple-500">
                              <CardContent className="pt-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium">{service.service_name || `Service ${index + 1}`}</h4>
                                    <Badge variant="outline">{service.service_category || 'General'}</Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">Provider</label>
                                      <p className="font-medium">{service.provider_name || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Frequency</label>
                                      <p className="font-medium">{service.frequency || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Duration</label>
                                      <p className="font-medium">{service.duration || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Schedule</label>
                                      <p className="font-medium">
                                        {service.start_date ? format(new Date(service.start_date), 'MMM dd, yyyy') : 'Not scheduled'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {service.notes && (
                                    <p className="text-sm text-muted-foreground p-2 bg-muted rounded">{service.notes}</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No service plans defined</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Equipment Tab */}
                <TabsContent value="equipment" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Equipment & Maintenance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {carePlanWithDetails.equipment && carePlanWithDetails.equipment.length > 0 ? (
                        <div className="space-y-4">
                          {carePlanWithDetails.equipment.map((item: any, index: number) => (
                            <Card key={index} className="border-l-4 border-l-orange-500">
                              <CardContent className="pt-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium">{item.equipment_name || `Equipment ${index + 1}`}</h4>
                                    <Badge className={item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                      {item.status || 'Active'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">Type</label>
                                      <p className="font-medium">{item.equipment_type || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Location</label>
                                      <p className="font-medium">{item.location || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Manufacturer</label>
                                      <p className="font-medium">{item.manufacturer || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Serial Number</label>
                                      <p className="font-medium">{item.serial_number || 'Not specified'}</p>
                                    </div>
                                  </div>
                                  
                                  {item.next_maintenance && (
                                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                                      <p className="text-sm text-yellow-800">
                                        <strong>Next Maintenance:</strong> {format(new Date(item.next_maintenance), 'PPP')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No equipment registered</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Risk Assessments Tab */}
                <TabsContent value="risks" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Risk Assessments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {carePlanWithDetails.risk_assessments && carePlanWithDetails.risk_assessments.length > 0 ? (
                        <div className="space-y-4">
                          {carePlanWithDetails.risk_assessments.map((risk: any, index: number) => (
                            <Card key={index} className={`border-l-4 ${
                              risk.risk_level === 'high' ? 'border-l-red-500' : 
                              risk.risk_level === 'medium' ? 'border-l-yellow-500' : 
                              'border-l-green-500'
                            }`}>
                              <CardContent className="pt-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium">{risk.risk_type || `Risk Assessment ${index + 1}`}</h4>
                                    <Badge className={
                                      risk.risk_level === 'high' ? 'bg-red-100 text-red-800' : 
                                      risk.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-green-100 text-green-800'
                                    }>
                                      {risk.risk_level || 'Low'} Risk
                                    </Badge>
                                  </div>
                                  
                                  {risk.risk_factors && risk.risk_factors.length > 0 && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Risk Factors</label>
                                      <div className="flex flex-wrap gap-2">
                                        {risk.risk_factors.map((factor: string, factorIndex: number) => (
                                          <Badge key={factorIndex} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            {factor}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {risk.mitigation_strategies && risk.mitigation_strategies.length > 0 && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Mitigation Strategies</label>
                                      <div className="flex flex-wrap gap-2">
                                        {risk.mitigation_strategies.map((strategy: string, strategyIndex: number) => (
                                          <Badge key={strategyIndex} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            {strategy}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">Assessment Date</label>
                                      <p className="font-medium">
                                        {risk.assessment_date ? format(new Date(risk.assessment_date), 'PPP') : 'Not specified'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Next Review</label>
                                      <p className="font-medium">
                                        {risk.next_review_date ? format(new Date(risk.next_review_date), 'PPP') : 'Not scheduled'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No risk assessments available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileX className="h-5 w-5" />
                        Documents & Consents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {carePlanWithDetails.documents && carePlanWithDetails.documents.length > 0 ? (
                        <div className="space-y-4">
                          {carePlanWithDetails.documents.map((doc: any, index: number) => (
                            <Card key={index} className="border-l-4 border-l-indigo-500">
                              <CardContent className="pt-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium">{doc.document_name || doc.document_type || `Document ${index + 1}`}</h4>
                                    <Badge className={doc.consent_given ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                      {doc.consent_given ? 'Consented' : 'Pending'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">Document Type</label>
                                      <p className="font-medium">{doc.document_type || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">Consent Date</label>
                                      <p className="font-medium">
                                        {doc.consent_date ? format(new Date(doc.consent_date), 'PPP') : 'Not provided'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {doc.witness_name && (
                                    <div>
                                      <label className="text-muted-foreground">Witness</label>
                                      <p className="font-medium">{doc.witness_name}</p>
                                    </div>
                                  )}
                                  
                                  {doc.notes && (
                                    <p className="text-sm text-muted-foreground p-2 bg-muted rounded">{doc.notes}</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No documents available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {format(new Date(carePlan.updated_at), 'PPP')}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {isEditMode && (
                <Button>
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}