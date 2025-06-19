
import React from "react";
import { Utensils, Edit, AlertTriangle, Heart, Droplets } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DietaryTabProps {
  dietaryRequirements: {
    dietary_restrictions?: string[];
    food_allergies?: string[];
    food_preferences?: string[];
    meal_schedule?: any;
    nutritional_needs?: string;
    supplements?: string[];
    feeding_assistance_required?: boolean;
    special_equipment_needed?: string;
    texture_modifications?: string;
    fluid_restrictions?: string;
    weight_monitoring?: boolean;
  };
  onEditDietaryRequirements?: () => void;
}

export const DietaryTab: React.FC<DietaryTabProps> = ({ 
  dietaryRequirements, 
  onEditDietaryRequirements 
}) => {
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
            {/* Allergies and Restrictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Food Allergies
                </h3>
                {dietaryRequirements.food_allergies && dietaryRequirements.food_allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dietaryRequirements.food_allergies.map((allergy, index) => (
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
                <h3 className="text-sm font-medium text-gray-500 mb-2">Dietary Restrictions</h3>
                {dietaryRequirements.dietary_restrictions && dietaryRequirements.dietary_restrictions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dietaryRequirements.dietary_restrictions.map((restriction, index) => (
                      <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">None recorded</p>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-green-500" />
                Food Preferences
              </h3>
              {dietaryRequirements.food_preferences && dietaryRequirements.food_preferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dietaryRequirements.food_preferences.map((preference, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {preference}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">None recorded</p>
              )}
            </div>

            {/* Supplements */}
            {dietaryRequirements.supplements && dietaryRequirements.supplements.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Supplements</h3>
                <div className="flex flex-wrap gap-2">
                  {dietaryRequirements.supplements.map((supplement, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {supplement}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Special Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dietaryRequirements.texture_modifications && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Texture Modifications</h3>
                  <p className="text-base">{dietaryRequirements.texture_modifications}</p>
                </div>
              )}
              
              {dietaryRequirements.special_equipment_needed && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Special Equipment</h3>
                  <p className="text-base">{dietaryRequirements.special_equipment_needed}</p>
                </div>
              )}
            </div>

            {/* Fluid and Monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dietaryRequirements.fluid_restrictions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Fluid Restrictions
                  </h3>
                  <p className="text-base">{dietaryRequirements.fluid_restrictions}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Special Considerations</h3>
                <div className="space-y-1">
                  {dietaryRequirements.feeding_assistance_required && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Feeding Assistance Required
                    </Badge>
                  )}
                  {dietaryRequirements.weight_monitoring && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 ml-2">
                      Weight Monitoring
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Nutritional Notes */}
            {dietaryRequirements.nutritional_needs && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Nutritional Needs</h3>
                <p className="text-base bg-gray-50 p-3 rounded">{dietaryRequirements.nutritional_needs}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
