import React, { useState } from "react";
import { Edit, Droplets, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FluidBalanceRecordDialog } from "@/components/fluid-balance/FluidBalanceRecordDialog";
import { useFluidIntakeSummary } from "@/hooks/useFluidIntakeRecords";
import { useFluidOutputSummary } from "@/hooks/useFluidOutputRecords";
import { format } from 'date-fns';

interface DietaryTabProps {
  dietaryRequirements: any;
  carePlanData?: any;
  clientId?: string;
  clientName?: string;
  onEditDietaryRequirements?: () => void;
}

export const DietaryTab: React.FC<DietaryTabProps> = ({ 
  dietaryRequirements, 
  carePlanData,
  clientId,
  clientName,
  onEditDietaryRequirements 
}) => {
  const [fluidBalanceDialogOpen, setFluidBalanceDialogOpen] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayIntake } = useFluidIntakeSummary(clientId || '', today);
  const { data: todayOutput } = useFluidOutputSummary(clientId || '', today);
  
  // Normalize dietary data - map wizard field names to expected display names
  const rawDietary = carePlanData?.auto_save_data?.dietary || dietaryRequirements || {};
  const dietaryInfo = {
    // Map allergies - wizard saves as food_allergies
    allergies: rawDietary.allergies || rawDietary.food_allergies || [],
    
    // Map malnutrition risk - wizard saves as boolean at_risk_malnutrition
    malnutrition_risk_level: rawDietary.malnutrition_risk_level || 
      (rawDietary.at_risk_malnutrition ? 'At Risk' : null),
    
    // Map dehydration risk - wizard saves as boolean
    dehydration_risk: rawDietary.at_risk_dehydration || false,
    
    // Preserved fields that match
    dietary_restrictions: rawDietary.dietary_restrictions || [],
    food_preferences: rawDietary.food_preferences || [],
    dislikes: rawDietary.dislikes || [],
    meal_schedule: rawDietary.meal_schedule || null,
    nutritional_needs: rawDietary.nutritional_needs || '',
    weight_monitoring: rawDietary.weight_monitoring || false,
    feeding_assistance_required: rawDietary.feeding_assistance_required || false,
    supplements: rawDietary.supplements || [],
    special_equipment_needed: rawDietary.special_equipment_needed || '',
    texture_modifications: rawDietary.texture_modifications || '',
    fluid_restrictions: rawDietary.fluid_restrictions || '',
    swallowing_difficulties: rawDietary.swallowing_difficulties || '',
    choking_risk: rawDietary.choking_risk || false,
    hydration_needs: rawDietary.hydration_needs || '',
    meal_preparation_needs: rawDietary.meal_preparation_needs || '',
    eating_assistance: rawDietary.eating_assistance || '',
    cultural_religious_requirements: rawDietary.cultural_religious_requirements || '',
    
    // Additional wizard fields
    check_fridge_expiry: rawDietary.check_fridge_expiry || false,
    do_you_cook: rawDietary.do_you_cook || false,
    help_with_cooking: rawDietary.help_with_cooking || false,
    preparation_instructions: rawDietary.preparation_instructions || '',
    avoid_medical_reasons: rawDietary.avoid_medical_reasons || false,
    avoid_religious_reasons: rawDietary.avoid_religious_reasons || false,
    
    // Legacy fields for backward compatibility
    cooking_method_preferences: rawDietary.cooking_method_preferences || '',
    cultural_considerations: rawDietary.cultural_considerations || '',
    religious_requirements: rawDietary.religious_requirements || '',
  };
  
  return (
    <>
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Dietary Requirements</h2>
            <Button variant="outline" onClick={onEditDietaryRequirements} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>

          <div className="space-y-8">
            {/* Dietary Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allergies */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Food Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.allergies?.length > 0 ? (
                    dietaryInfo.allergies.map((allergy: string, index: number) => (
                      <Badge key={index} variant="destructive">{allergy}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No allergies recorded</span>
                  )}
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Dietary Restrictions</h3>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.dietary_restrictions?.length > 0 ? (
                    dietaryInfo.dietary_restrictions.map((restriction: string, index: number) => (
                      <Badge key={index} variant="secondary">{restriction}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No dietary restrictions</span>
                  )}
                </div>
              </div>

              {/* Food Preferences */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Food Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.food_preferences?.length > 0 ? (
                    dietaryInfo.food_preferences.map((preference: string, index: number) => (
                      <Badge key={index} variant="outline">{preference}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No preferences recorded</span>
                  )}
                </div>
              </div>

              {/* Meal Schedule */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Meal Schedule</h3>
                {dietaryInfo.meal_schedule ? (
                  <div className="text-sm">
                    {typeof dietaryInfo.meal_schedule === 'string' 
                      ? dietaryInfo.meal_schedule 
                      : JSON.stringify(dietaryInfo.meal_schedule)}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>

            {/* Risk Factors */}
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
                    <span className="text-sm text-muted-foreground">Not assessed</span>
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

                {dietaryInfo.preparation_instructions && (
                  <div className="space-y-3 md:col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Preparation Instructions</h4>
                    <p className="text-sm">{dietaryInfo.preparation_instructions}</p>
                  </div>
                )}
                
                {(dietaryInfo.avoid_medical_reasons || dietaryInfo.avoid_religious_reasons) && (
                  <div className="space-y-3 md:col-span-2">
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
              </div>
            </div>

            {/* Nutritional Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Nutritional & Hydration Needs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Nutritional Needs</h4>
                  <p className="text-sm">
                    {dietaryInfo.nutritional_needs || <span className="text-muted-foreground">Not specified</span>}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Hydration Needs</h4>
                  <p className="text-sm">
                    {dietaryInfo.hydration_needs || <span className="text-muted-foreground">Not specified</span>}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Meal Preparation Needs</h4>
                  <p className="text-sm">
                    {dietaryInfo.meal_preparation_needs || <span className="text-muted-foreground">Not specified</span>}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Eating Assistance</h4>
                  <p className="text-sm">
                    {dietaryInfo.eating_assistance || <span className="text-muted-foreground">Not specified</span>}
                  </p>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Supplements</h4>
                  <div className="flex flex-wrap gap-2">
                    {dietaryInfo.supplements?.length > 0 ? (
                      dietaryInfo.supplements.map((supplement: string, index: number) => (
                        <Badge key={index} variant="outline">{supplement}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No supplements</span>
                    )}
                  </div>
                </div>

                {dietaryInfo.dislikes?.length > 0 && (
                  <div className="space-y-3 md:col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Food Dislikes</h4>
                    <div className="flex flex-wrap gap-2">
                      {dietaryInfo.dislikes.map((dislike: string, index: number) => (
                        <Badge key={index} variant="outline">{dislike}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requirements & Modifications */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Special Requirements & Modifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Special Equipment</h4>
                  <p className="text-sm">
                    {dietaryInfo.special_equipment_needed || <span className="text-muted-foreground">None specified</span>}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Texture Modifications</h4>
                  <p className="text-sm">
                    {dietaryInfo.texture_modifications || <span className="text-muted-foreground">None specified</span>}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Fluid Restrictions</h4>
                  <p className="text-sm">
                    {dietaryInfo.fluid_restrictions || <span className="text-muted-foreground">None specified</span>}
                  </p>
                </div>

                {dietaryInfo.swallowing_difficulties && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Swallowing Difficulties</h4>
                    <p className="text-sm">{dietaryInfo.swallowing_difficulties}</p>
                  </div>
                )}

                {dietaryInfo.choking_risk && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Choking Risk</h4>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                )}

                {dietaryInfo.cultural_religious_requirements && (
                  <div className="space-y-3 md:col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Cultural/Religious Requirements</h4>
                    <p className="text-sm">{dietaryInfo.cultural_religious_requirements}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cooking & Preparation */}
            {(dietaryInfo.cooking_method_preferences || dietaryInfo.cultural_considerations || dietaryInfo.religious_requirements) && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">Cooking & Preparation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dietaryInfo.cooking_method_preferences && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Cooking Preferences</h4>
                      <p className="text-sm">{dietaryInfo.cooking_method_preferences}</p>
                    </div>
                  )}

                  {dietaryInfo.cultural_considerations && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Cultural Considerations</h4>
                      <p className="text-sm">{dietaryInfo.cultural_considerations}</p>
                    </div>
                  )}

                  {dietaryInfo.religious_requirements && (
                    <div className="space-y-3 md:col-span-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Religious Requirements</h4>
                      <p className="text-sm">{dietaryInfo.religious_requirements}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Fluid Balance Section */}
            {clientId && clientName && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Fluid Intake & Output Monitoring
                  </h3>
                  <Button variant="outline" onClick={() => setFluidBalanceDialogOpen(true)}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Record Fluid Balance
                  </Button>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Today's Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="text-sm text-muted-foreground">Intake</div>
                        <div className="text-2xl font-bold text-primary">{todayIntake?.total || 0} ml</div>
                      </div>
                      <div className="p-4 bg-secondary/10 rounded-lg">
                        <div className="text-sm text-muted-foreground">Output</div>
                        <div className="text-2xl font-bold text-secondary">{todayOutput?.total || 0} ml</div>
                      </div>
                      <div className="p-4 bg-accent/10 rounded-lg">
                        <div className="text-sm text-muted-foreground">Balance</div>
                        <div className="text-2xl font-bold">{(todayIntake?.total || 0) - (todayOutput?.total || 0)} ml</div>
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
        />
      )}
    </>
  );
};
