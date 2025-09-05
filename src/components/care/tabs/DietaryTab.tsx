
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Dietary Requirements</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={onEditDietaryRequirements}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <CardDescription>Nutritional needs and dietary preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-6">
            {/* Screening Questions Results */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3">Dietary Assessment Results</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dietaryInfo?.has_allergies && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">
                      <span className="font-medium">Food Allergies:</span> {dietaryInfo.has_allergies === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                )}

                {dietaryInfo?.religious_cultural_requirements && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">
                      <span className="font-medium">Religious/Cultural:</span> {dietaryInfo.religious_cultural_requirements === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                )}

                {dietaryInfo?.swallowing_concerns && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">
                      <span className="font-medium">Swallowing Concerns:</span> {dietaryInfo.swallowing_concerns === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                )}

                {dietaryInfo?.needs_help_cutting_food && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      <span className="font-medium">Help Cutting Food:</span> {dietaryInfo.needs_help_cutting_food === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                )}

                {dietaryInfo?.meal_schedule_requirements && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      <span className="font-medium">Special Schedule:</span> {dietaryInfo.meal_schedule_requirements === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                )}

                {dietaryInfo?.needs_cooking_help && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded">
                    <Utensils className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">
                      <span className="font-medium">Cooking Help:</span> {dietaryInfo.needs_cooking_help === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                )}

                {dietaryInfo?.hydration_support && (
                  <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded">
                    <Droplets className="h-4 w-4 text-cyan-600" />
                    <span className="text-sm">
                      <span className="font-medium">Hydration Support:</span> {dietaryInfo.hydration_support === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                )}

                {dietaryInfo?.at_risk_malnutrition && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">
                      <span className="font-medium">Malnutrition Risk:</span> {dietaryInfo.at_risk_malnutrition === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Information Sections */}
            {dietaryInfo?.religious_cultural_details && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Religious/Cultural Requirements</h4>
                <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded">
                  {dietaryInfo.religious_cultural_details}
                </p>
              </div>
            )}

            {dietaryInfo?.swallowing_details && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Swallowing Concerns Details</h4>
                <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded">
                  {dietaryInfo.swallowing_details}
                </p>
              </div>
            )}

            {dietaryInfo?.cutting_food_details && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Food Cutting Assistance</h4>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  {dietaryInfo.cutting_food_details}
                </p>
              </div>
            )}

            {dietaryInfo?.meal_schedule_details && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Meal Schedule Requirements</h4>
                <p className="text-sm text-gray-600 bg-green-50 p-3 rounded">
                  {dietaryInfo.meal_schedule_details}
                </p>
              </div>
            )}

            {dietaryInfo?.food_prep_instructions && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Food Preparation Instructions</h4>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                  {dietaryInfo.food_prep_instructions}
                </p>
              </div>
            )}

            {dietaryInfo?.hydration_details && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Hydration Support Details</h4>
                <p className="text-sm text-gray-600 bg-cyan-50 p-3 rounded">
                  {dietaryInfo.hydration_details}
                </p>
              </div>
            )}

            {/* Food Allergies Section */}
            {dietaryInfo?.food_allergies && dietaryInfo.food_allergies.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Food Allergies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.food_allergies.map((allergy: string, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Restrictions Section */}
            {dietaryInfo?.dietary_restrictions && dietaryInfo.dietary_restrictions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  Dietary Restrictions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.dietary_restrictions.map((restriction: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Food Preferences Section */}
            {dietaryInfo?.food_preferences && dietaryInfo.food_preferences.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-green-500" />
                  Food Preferences
                </h4>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.food_preferences.map((preference: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {preference}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Supplements Section */}
            {dietaryInfo?.supplements && dietaryInfo.supplements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  Supplements
                </h4>
                <div className="flex flex-wrap gap-2">
                  {dietaryInfo.supplements.map((supplement: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {supplement}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Texture Modifications */}
            {dietaryInfo?.texture_modifications && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Texture Modifications</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {dietaryInfo.texture_modifications}
                </p>
              </div>
            )}

            {/* Special Equipment */}
            {dietaryInfo?.special_equipment_needed && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Special Equipment</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {dietaryInfo.special_equipment_needed}
                </p>
              </div>
            )}

            {/* Fluid Restrictions */}
            {dietaryInfo?.fluid_restrictions && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Fluid Restrictions</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {dietaryInfo.fluid_restrictions}
                </p>
              </div>
            )}

            {/* Special Considerations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dietaryInfo?.feeding_assistance_required && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Feeding Assistance Required</span>
                </div>
              )}
              
              {dietaryInfo?.weight_monitoring && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Weight Monitoring Required</span>
                </div>
              )}
            </div>

            {/* Nutritional Needs */}
            {dietaryInfo?.nutritional_needs && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Nutritional Needs</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {dietaryInfo.nutritional_needs}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
