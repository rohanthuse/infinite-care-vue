
import React from "react";
import { Utensils, Pill, ShieldAlert, ThumbsUp, Droplets, Battery, ScrollText, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DietaryTabProps {
  dietaryRequirements?: {
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
  } | null;
  onEditDietaryRequirements?: () => void;
}

export const DietaryTab: React.FC<DietaryTabProps> = ({ dietaryRequirements, onEditDietaryRequirements }) => {
  if (!dietaryRequirements) {
    return (
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-green-600" />
                <span>Nutrition Plan</span>
              </CardTitle>
              <CardDescription>Dietary requirements and preferences</CardDescription>
            </div>
            {onEditDietaryRequirements && (
              <Button variant="outline" size="sm" onClick={onEditDietaryRequirements}>
                <Plus className="h-4 w-4 mr-2" />
                Add Nutrition Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Utensils className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">No dietary requirements recorded</p>
            {onEditDietaryRequirements && (
              <Button variant="outline" onClick={onEditDietaryRequirements}>
                <Plus className="h-4 w-4 mr-2" />
                Add Nutrition Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="h-5 w-5 text-green-600" />
              <span>Nutrition Plan</span>
            </CardTitle>
            <CardDescription>Dietary requirements and preferences</CardDescription>
          </div>
          {onEditDietaryRequirements && (
            <Button variant="outline" size="sm" onClick={onEditDietaryRequirements}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Nutritional Needs */}
          {dietaryRequirements.nutritional_needs && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Pill className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium">Nutritional Needs</h3>
              </div>
              <p className="text-sm px-7 bg-blue-50 p-3 rounded-md">{dietaryRequirements.nutritional_needs}</p>
            </div>
          )}
          
          {/* Dietary Restrictions */}
          {dietaryRequirements.dietary_restrictions && dietaryRequirements.dietary_restrictions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <ShieldAlert className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="font-medium">Dietary Restrictions</h3>
              </div>
              <div className="space-y-2 px-7">
                {dietaryRequirements.dietary_restrictions.map((restriction, index) => (
                  <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-red-50/50 border-red-100">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      <span className="font-medium text-sm">{restriction}</span>
                    </div>
                    <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                      Restriction
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Food Allergies */}
          {dietaryRequirements.food_allergies && dietaryRequirements.food_allergies.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <ShieldAlert className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="font-medium">Food Allergies</h3>
              </div>
              <div className="space-y-2 px-7">
                {dietaryRequirements.food_allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-red-50/50 border-red-100">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      <span className="font-medium text-sm">{allergy}</span>
                    </div>
                    <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                      Allergy
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Food Preferences */}
          {dietaryRequirements.food_preferences && dietaryRequirements.food_preferences.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium">Food Preferences</h3>
              </div>
              <ul className="space-y-2 px-7">
                {dietaryRequirements.food_preferences.map((pref, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{pref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Fluid Restrictions */}
          {dietaryRequirements.fluid_restrictions && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Droplets className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium">Fluid Restrictions</h3>
              </div>
              <p className="text-sm px-7 bg-blue-50 p-3 rounded-md">{dietaryRequirements.fluid_restrictions}</p>
            </div>
          )}
          
          {/* Supplements */}
          {dietaryRequirements.supplements && dietaryRequirements.supplements.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Battery className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-medium">Supplements</h3>
              </div>
              <div className="space-y-2 px-7">
                {dietaryRequirements.supplements.map((supplement, index) => (
                  <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-purple-50/50 border-purple-100">
                    <div className="flex items-center">
                      <Battery className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="font-medium text-sm">{supplement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Equipment & Texture Modifications */}
          {(dietaryRequirements.special_equipment_needed || dietaryRequirements.texture_modifications) && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <ScrollText className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="font-medium">Special Requirements</h3>
              </div>
              <div className="space-y-3 px-7">
                {dietaryRequirements.special_equipment_needed && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium">Special Equipment Needed:</p>
                    <p className="text-sm text-gray-700">{dietaryRequirements.special_equipment_needed}</p>
                  </div>
                )}
                {dietaryRequirements.texture_modifications && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium">Texture Modifications:</p>
                    <p className="text-sm text-gray-700">{dietaryRequirements.texture_modifications}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feeding Assistance & Monitoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dietaryRequirements.feeding_assistance_required && (
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <p className="text-sm font-medium text-amber-800">Feeding Assistance Required</p>
                <p className="text-xs text-amber-600">Patient requires assistance with feeding</p>
              </div>
            )}
            {dietaryRequirements.weight_monitoring && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm font-medium text-blue-800">Weight Monitoring Active</p>
                <p className="text-xs text-blue-600">Regular weight monitoring is required</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
