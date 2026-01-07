import React, { useState } from "react";
import { Edit, Droplets, ClipboardList, AlertTriangle, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FluidBalanceRecordDialog } from "@/components/fluid-balance/FluidBalanceRecordDialog";
import { useFluidIntakeSummary } from "@/hooks/useFluidIntakeRecords";
import { useFluidOutputSummary } from "@/hooks/useFluidOutputRecords";
import { useFluidBalanceTarget } from "@/hooks/useFluidBalanceTargets";
import { useClientDietaryRequirements } from "@/hooks/useClientDietaryRequirements";
import { format } from 'date-fns';

interface DietaryTabProps {
  dietaryRequirements: any;
  carePlanData?: any;
  clientId?: string;
  clientName?: string;
  visitRecordId?: string;
  onEditDietaryRequirements?: () => void;
  validateSession?: () => Promise<boolean>;
}

export const DietaryTab: React.FC<DietaryTabProps> = ({ 
  dietaryRequirements, 
  carePlanData,
  clientId,
  clientName,
  visitRecordId,
  onEditDietaryRequirements,
  validateSession,
}) => {
  const [fluidBalanceDialogOpen, setFluidBalanceDialogOpen] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayIntake } = useFluidIntakeSummary(clientId || '', today);
  const { data: todayOutput } = useFluidOutputSummary(clientId || '', today);
  const { data: fluidTarget } = useFluidBalanceTarget(clientId || '');
  const { data: dietaryReqsFromDb } = useClientDietaryRequirements(clientId || '');
  
  // Normalize dietary data - map wizard field names to expected display names
  const rawDietary = carePlanData?.auto_save_data?.dietary || dietaryRequirements || {};
  const dietaryInfo = {
    // Map allergies - wizard saves as food_allergies
    allergies: rawDietary.allergies || rawDietary.food_allergies || dietaryReqsFromDb?.food_allergies || [],
    
    // Dietary Restrictions
    dietary_restrictions: rawDietary.dietary_restrictions || dietaryReqsFromDb?.dietary_restrictions || [],
    
    // Food Preferences
    food_preferences: rawDietary.food_preferences || dietaryReqsFromDb?.food_preferences || [],
    
    // Meal Schedule
    meal_schedule: rawDietary.meal_schedule || dietaryReqsFromDb?.meal_schedule || null,
    
    // Map malnutrition risk - wizard saves as boolean at_risk_malnutrition
    malnutrition_risk_level: rawDietary.malnutrition_risk_level || 
      (rawDietary.at_risk_malnutrition ? 'At Risk' : null),
    
    // Map dehydration risk - wizard saves as boolean
    dehydration_risk: rawDietary.at_risk_dehydration || false,
    
    // Fields captured in wizard
    nutritional_needs: rawDietary.nutritional_needs || dietaryReqsFromDb?.nutritional_needs || '',
    weight_monitoring: rawDietary.weight_monitoring || dietaryReqsFromDb?.weight_monitoring || false,
    feeding_assistance_required: rawDietary.feeding_assistance_required || dietaryReqsFromDb?.feeding_assistance_required || false,
    
    // Cooking & Meal Assistance fields from wizard
    check_fridge_expiry: rawDietary.check_fridge_expiry || false,
    do_you_cook: rawDietary.do_you_cook || false,
    help_with_cooking: rawDietary.help_with_cooking || false,
    preparation_instructions: rawDietary.preparation_instructions || '',
    avoid_medical_reasons: rawDietary.avoid_medical_reasons || false,
    avoid_religious_reasons: rawDietary.avoid_religious_reasons || false,
    
    // Nutritional & Hydration Needs
    hydration_needs: rawDietary.hydration_needs || '',
    meal_preparation_needs: rawDietary.meal_preparation_needs || '',
    eating_assistance: rawDietary.eating_assistance || '',
    supplements: rawDietary.supplements || dietaryReqsFromDb?.supplements || [],
    
    // Special Requirements & Modifications
    special_equipment_needed: rawDietary.special_equipment_needed || dietaryReqsFromDb?.special_equipment_needed || '',
    texture_modifications: rawDietary.texture_modifications || dietaryReqsFromDb?.texture_modifications || '',
    fluid_restrictions: rawDietary.fluid_restrictions || dietaryReqsFromDb?.fluid_restrictions || '',
  };

  // Calculate intake progress percentage
  const intakeProgress = fluidTarget?.daily_intake_target_ml 
    ? Math.round(((todayIntake?.total || 0) / fluidTarget.daily_intake_target_ml) * 100)
    : null;
  
  // Check if below alert threshold
  const isBelowThreshold = intakeProgress !== null && 
    fluidTarget?.alert_threshold_percentage && 
    intakeProgress < fluidTarget.alert_threshold_percentage;
  
  return (
    <>
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-xl font-semibold">Dietary Requirements</h2>
            <Button variant="outline" onClick={onEditDietaryRequirements} className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>

          <div className="space-y-8">
            {/* Dietary Requirements Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dietary Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Food Allergies */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Food Allergies</h4>
                  {dietaryInfo.allergies?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dietaryInfo.allergies.map((allergy: string, index: number) => (
                        <Badge key={index} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No allergies recorded</p>
                  )}
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Dietary Restrictions</h4>
                  {dietaryInfo.dietary_restrictions?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dietaryInfo.dietary_restrictions.map((restriction: string, index: number) => (
                        <Badge key={index} variant="secondary">{restriction}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No dietary restrictions</p>
                  )}
                </div>

                {/* Food Preferences */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Food Preferences</h4>
                  {dietaryInfo.food_preferences?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dietaryInfo.food_preferences.map((pref: string, index: number) => (
                        <Badge key={index} variant="outline">{pref}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No preferences recorded</p>
                  )}
                </div>

                {/* Meal Schedule */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Meal Schedule</h4>
                  <p className="text-sm">
                    {typeof dietaryInfo.meal_schedule === 'object' && dietaryInfo.meal_schedule 
                      ? JSON.stringify(dietaryInfo.meal_schedule) 
                      : dietaryInfo.meal_schedule || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Factors & Monitoring */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Risk Factors & Monitoring</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Malnutrition Risk</h4>
                  {dietaryInfo.malnutrition_risk_level ? (
                    <Badge variant={
                      dietaryInfo.malnutrition_risk_level === 'High' || dietaryInfo.malnutrition_risk_level === 'At Risk' 
                        ? 'destructive' 
                        : dietaryInfo.malnutrition_risk_level === 'Medium' ? 'default' : 'secondary'
                    }>
                      {dietaryInfo.malnutrition_risk_level}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Assessed</Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Dehydration Risk</h4>
                  <Badge variant={dietaryInfo.dehydration_risk ? 'destructive' : 'outline'}>
                    {dietaryInfo.dehydration_risk ? 'At Risk' : 'No Risk'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Weight Monitoring</h4>
                  <Badge variant={dietaryInfo.weight_monitoring ? 'default' : 'outline'}>
                    {dietaryInfo.weight_monitoring ? 'Required' : 'Not Required'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Feeding Assistance</h4>
                  <Badge variant={dietaryInfo.feeding_assistance_required ? 'default' : 'outline'}>
                    {dietaryInfo.feeding_assistance_required ? 'Required' : 'Not Required'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Cooking & Meal Assistance */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Cooking & Meal Assistance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Check Fridge Expiry</h4>
                  <Badge variant={dietaryInfo.check_fridge_expiry ? 'default' : 'outline'}>
                    {dietaryInfo.check_fridge_expiry ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Client Cooks</h4>
                  <Badge variant={dietaryInfo.do_you_cook ? 'default' : 'outline'}>
                    {dietaryInfo.do_you_cook ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Needs Help With Cooking</h4>
                  <Badge variant={dietaryInfo.help_with_cooking ? 'default' : 'outline'}>
                    {dietaryInfo.help_with_cooking ? 'Yes' : 'No'}
                  </Badge>
                </div>

                {(dietaryInfo.avoid_medical_reasons || dietaryInfo.avoid_religious_reasons) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Food Avoidance</h4>
                    <div className="flex gap-2">
                      {dietaryInfo.avoid_medical_reasons && (
                        <Badge variant="secondary">Medical Reasons</Badge>
                      )}
                      {dietaryInfo.avoid_religious_reasons && (
                        <Badge variant="secondary">Religious Reasons</Badge>
                      )}
                    </div>
                  </div>
                )}

                {dietaryInfo.preparation_instructions && (
                  <div className="space-y-3 md:col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Preparation Instructions</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{dietaryInfo.preparation_instructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Nutritional & Hydration Needs */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Nutritional & Hydration Needs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Nutritional Needs</h4>
                  <p className="text-sm">{dietaryInfo.nutritional_needs || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Hydration Needs</h4>
                  <p className="text-sm">{dietaryInfo.hydration_needs || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Meal Preparation Needs</h4>
                  <p className="text-sm">{dietaryInfo.meal_preparation_needs || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Eating Assistance</h4>
                  <p className="text-sm">{dietaryInfo.eating_assistance || 'Not specified'}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Supplements</h4>
                  {dietaryInfo.supplements?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dietaryInfo.supplements.map((supplement: string, index: number) => (
                        <Badge key={index} variant="outline">{supplement}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No supplements</p>
                  )}
                </div>
              </div>
            </div>

            {/* Special Requirements & Modifications */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Special Requirements & Modifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Special Equipment</h4>
                  <p className="text-sm">{dietaryInfo.special_equipment_needed || 'None specified'}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Texture Modifications</h4>
                  <p className="text-sm">{dietaryInfo.texture_modifications || 'None specified'}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Fluid Restrictions</h4>
                  <p className="text-sm">{dietaryInfo.fluid_restrictions || 'None specified'}</p>
                </div>
              </div>
            </div>
            
            {/* Fluid Balance Section */}
            {clientId && clientName && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Fluid Intake & Output Monitoring
                  </h3>
                  <Button 
                    variant="outline" 
                    onClick={() => setFluidBalanceDialogOpen(true)}
                    className="w-full sm:w-auto flex-shrink-0"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Record Fluid Balance
                  </Button>
                </div>

                {/* Fluid Balance Targets */}
                {(fluidTarget?.daily_intake_target_ml || fluidTarget?.daily_output_target_ml) && (
                  <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Daily Targets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                        {fluidTarget?.daily_intake_target_ml && (
                          <div className="space-y-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">Intake Target</span>
                            <p className="font-semibold text-base sm:text-lg">{fluidTarget.daily_intake_target_ml} ml</p>
                          </div>
                        )}
                        {fluidTarget?.daily_output_target_ml && (
                          <div className="space-y-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">Output Target</span>
                            <p className="font-semibold text-base sm:text-lg">{fluidTarget.daily_output_target_ml} ml</p>
                          </div>
                        )}
                        {fluidTarget?.alert_threshold_percentage && (
                          <div className="space-y-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">Alert Below</span>
                            <p className="font-semibold text-base sm:text-lg text-amber-600">{fluidTarget.alert_threshold_percentage}%</p>
                          </div>
                        )}
                      </div>
                      {fluidTarget?.notes && (
                        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                          <span className="text-sm text-muted-foreground">Notes:</span>
                          <p className="mt-1 text-sm">{fluidTarget.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Today's Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Today's Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isBelowThreshold && (
                      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-700 dark:text-amber-400">
                          Intake is below {fluidTarget?.alert_threshold_percentage}% of daily target
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-primary/10 rounded-lg">
                        <div className="text-xs sm:text-sm text-muted-foreground">Intake</div>
                        <div className="text-xl sm:text-2xl font-bold text-primary">{todayIntake?.total || 0} ml</div>
                        {fluidTarget?.daily_intake_target_ml && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {intakeProgress}% of {fluidTarget.daily_intake_target_ml} ml
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 bg-secondary/10 rounded-lg">
                        <div className="text-xs sm:text-sm text-muted-foreground">Output</div>
                        <div className="text-xl sm:text-2xl font-bold text-secondary-foreground">{todayOutput?.total || 0} ml</div>
                        {fluidTarget?.daily_output_target_ml && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Target: {fluidTarget.daily_output_target_ml} ml
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 bg-accent/10 rounded-lg">
                        <div className="text-xs sm:text-sm text-muted-foreground">Balance</div>
                        <div className="text-xl sm:text-2xl font-bold">{(todayIntake?.total || 0) - (todayOutput?.total || 0)} ml</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {clientId && clientName && (
        <FluidBalanceRecordDialog
          open={fluidBalanceDialogOpen}
          onOpenChange={setFluidBalanceDialogOpen}
          clientId={clientId}
          clientName={clientName}
          visitRecordId={visitRecordId}
          validateSession={validateSession}
        />
      )}
    </>
  );
};