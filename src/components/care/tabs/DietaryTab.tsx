
import React from "react";
import { Utensils, Edit, AlertTriangle, Heart, Droplets, Shield, Pill, Users, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DietaryTabProps {
  dietaryRequirements: any;
  carePlanData?: any; // For accessing auto_save_data
  onEditDietaryRequirements?: () => void;
}

export const DietaryTab: React.FC<DietaryTabProps> = ({ 
  dietaryRequirements, 
  carePlanData,
  onEditDietaryRequirements 
}) => {
  // Prioritize auto_save_data dietary info over DB dietary requirements
  const dietaryInfo = carePlanData?.auto_save_data?.dietary || dietaryRequirements || {};
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Dietary Requirements</h2>
          <Button
            variant="outline"
            onClick={onEditDietaryRequirements}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="space-y-8">
          {/* Allergies Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Allergies</h3>
            {dietaryInfo.food_allergies && dietaryInfo.food_allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dietaryInfo.food_allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive">{allergy}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No food allergies recorded</p>
            )}
          </div>

          {/* Malnutrition & Dehydration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Malnutrition & Dehydration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">At risk of malnutrition?</h4>
                <p className="text-muted-foreground">{dietaryInfo.at_risk_malnutrition ? 'Yes' : 'No'}</p>
                {dietaryInfo.at_risk_malnutrition && dietaryInfo.malnutrition_items && dietaryInfo.malnutrition_items.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dietaryInfo.malnutrition_items.map((item, index) => (
                      <Badge key={index} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">At risk of dehydration?</h4>
                <p className="text-muted-foreground">{dietaryInfo.at_risk_dehydration ? 'Yes' : 'No'}</p>
                {dietaryInfo.at_risk_dehydration && dietaryInfo.dehydration_items && dietaryInfo.dehydration_items.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dietaryInfo.dehydration_items.map((item, index) => (
                      <Badge key={index} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">Check fridge & expiry dates?</h4>
                <p className="text-muted-foreground">{dietaryInfo.check_fridge_expiry ? 'Yes' : 'No'}</p>
                {dietaryInfo.check_fridge_expiry && dietaryInfo.fridge_expiry_items && dietaryInfo.fridge_expiry_items.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dietaryInfo.fridge_expiry_items.map((item, index) => (
                      <Badge key={index} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cooking & Meal Preparation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Cooking & Meal Preparation</h3>
            <div>
              <h4 className="font-medium mb-2">Do you cook?</h4>
              <p className="text-muted-foreground">{dietaryInfo.do_you_cook ? 'Yes' : 'No'}</p>
              {dietaryInfo.do_you_cook && dietaryInfo.cooking_items && dietaryInfo.cooking_items.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {dietaryInfo.cooking_items.map((item, index) => (
                    <Badge key={index} variant="secondary">{item}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Extra Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Extra Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Avoid foods due to medical reasons?</h4>
                <p className="text-muted-foreground">{dietaryInfo.avoid_medical_reasons ? 'Yes' : 'No'}</p>
                {dietaryInfo.avoid_medical_reasons && dietaryInfo.medical_avoidance_items && dietaryInfo.medical_avoidance_items.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dietaryInfo.medical_avoidance_items.map((item, index) => (
                      <Badge key={index} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Avoid foods due to religious reasons?</h4>
                <p className="text-muted-foreground">{dietaryInfo.avoid_religious_reasons ? 'Yes' : 'No'}</p>
                {dietaryInfo.avoid_religious_reasons && dietaryInfo.religious_avoidance_items && dietaryInfo.religious_avoidance_items.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dietaryInfo.religious_avoidance_items.map((item, index) => (
                      <Badge key={index} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Feeding Assistance</h4>
                <p className="text-muted-foreground">{dietaryInfo.feeding_assistance_required ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Weight Monitoring</h4>
                <p className="text-muted-foreground">{dietaryInfo.weight_monitoring ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Detailed Descriptions */}
            {dietaryInfo.texture_modifications && (
              <div>
                <h4 className="font-medium mb-2">Texture Modifications</h4>
                <p className="text-muted-foreground">{dietaryInfo.texture_modifications}</p>
              </div>
            )}

            {dietaryInfo.nutritional_needs && (
              <div>
                <h4 className="font-medium mb-2">Nutritional Needs</h4>
                <p className="text-muted-foreground">{dietaryInfo.nutritional_needs}</p>
              </div>
            )}

            {dietaryInfo.special_equipment_needed && (
              <div>
                <h4 className="font-medium mb-2">Special Equipment Needed</h4>
                <p className="text-muted-foreground">{dietaryInfo.special_equipment_needed}</p>
              </div>
            )}

            {dietaryInfo.fluid_restrictions && (
              <div>
                <h4 className="font-medium mb-2">Fluid Restrictions</h4>
                <p className="text-muted-foreground">{dietaryInfo.fluid_restrictions}</p>
              </div>
            )}

            {/* Other Lists */}
            {dietaryInfo.dietary_restrictions && dietaryInfo.dietary_restrictions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Dietary Restrictions</h4>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.dietary_restrictions.map((restriction, index) => (
                    <Badge key={index} variant="secondary">{restriction}</Badge>
                  ))}
                </div>
              </div>
            )}

            {dietaryInfo.food_preferences && dietaryInfo.food_preferences.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Food Preferences</h4>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.food_preferences.map((preference, index) => (
                    <Badge key={index} variant="outline">{preference}</Badge>
                  ))}
                </div>
              </div>
            )}

            {dietaryInfo.supplements && dietaryInfo.supplements.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Supplements</h4>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.supplements.map((supplement, index) => (
                    <Badge key={index} variant="default">{supplement}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
