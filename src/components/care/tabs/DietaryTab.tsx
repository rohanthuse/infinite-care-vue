
import React from "react";
import { Utensils, Pill, ShieldAlert, ThumbsUp, Droplets, Battery, ScrollText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DietaryTabProps {
  dietaryRequirements: {
    mealPlan: string;
    restrictions: Array<{
      name: string;
      reason: string;
      severity: string;
    }>;
    preferences: string[];
    supplements: Array<{
      name: string;
      dosage: string;
      frequency: string;
      purpose: string;
    }>;
    hydrationPlan: string;
    nutritionalNotes: string;
  };
}

export const DietaryTab: React.FC<DietaryTabProps> = ({ dietaryRequirements }) => {
  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
        <CardTitle className="text-lg flex items-center gap-2">
          <Utensils className="h-5 w-5 text-green-600" />
          <span>Nutrition Plan</span>
        </CardTitle>
        <CardDescription>Dietary requirements and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Pill className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-medium">Meal Plan</h3>
          </div>
          <p className="text-sm px-7">{dietaryRequirements.mealPlan}</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <ShieldAlert className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="font-medium">Dietary Restrictions</h3>
          </div>
          <div className="space-y-2 px-7">
            {dietaryRequirements.restrictions.map((restriction, index) => (
              <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-red-50/50 border-red-100">
                <div>
                  <p className="font-medium text-sm">{restriction.name}</p>
                  <p className="text-xs text-gray-500">{restriction.reason}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    restriction.severity === "Critical" ? "text-red-600 bg-red-50 border-red-200" : 
                    restriction.severity === "Strict" ? "text-amber-600 bg-amber-50 border-amber-200" : 
                    "text-blue-600 bg-blue-50 border-blue-200"
                  }
                >
                  {restriction.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-medium">Food Preferences</h3>
          </div>
          <ul className="space-y-2 px-7">
            {dietaryRequirements.preferences.map((pref, index) => (
              <li key={index} className="text-sm flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{pref}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Droplets className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-medium">Hydration Plan</h3>
          </div>
          <p className="text-sm px-7">{dietaryRequirements.hydrationPlan}</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Battery className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-medium">Supplements</h3>
          </div>
          <div className="space-y-2 px-7">
            {dietaryRequirements.supplements.map((supplement, index) => (
              <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-purple-50/50 border-purple-100">
                <div>
                  <p className="font-medium text-sm">{supplement.name}</p>
                  <p className="text-xs text-gray-500">{supplement.purpose}</p>
                </div>
                <p className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                  {supplement.dosage}, {supplement.frequency}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <ScrollText className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="font-medium">Nutritional Notes</h3>
          </div>
          <p className="text-sm bg-gray-50 p-3 rounded-md border border-gray-100 px-7">
            {dietaryRequirements.nutritionalNotes}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
