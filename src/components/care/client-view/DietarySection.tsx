import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, AlertCircle } from 'lucide-react';

interface DietarySectionProps {
  dietary: any;
}

export function DietarySection({ dietary }: DietarySectionProps) {
  if (!dietary || Object.keys(dietary).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Dietary Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No dietary information provided yet.</p>
        </CardContent>
      </Card>
    );
  }

  const renderList = (label: string, items: any[], isAlert = false) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {isAlert && <AlertCircle className="h-4 w-4 text-red-500" />}
          {label}
        </label>
        <ul className="mt-2 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className={isAlert ? "text-red-500" : "text-primary"}>•</span>
              <span className="text-base">{typeof item === 'string' ? item : item.name || JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderField = (label: string, value: any) => {
    if (!value) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <p className="text-base mt-1 whitespace-pre-wrap">{value}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Dietary Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(dietary.food_allergies && dietary.food_allergies.length > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            {renderList('⚠️ Food Allergies', dietary.food_allergies, true)}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderList('Dietary Restrictions', dietary.dietary_restrictions)}
          {renderList('Food Preferences', dietary.food_preferences)}
          {renderList('Dislikes', dietary.dislikes)}
          {renderList('Supplements', dietary.supplements)}
          {renderField('Nutritional Needs', dietary.nutritional_needs)}
          {renderField('Meal Preparation Needs', dietary.meal_preparation_needs)}
          {renderField('Preparation Instructions', dietary.preparation_instructions)}
          {renderField('Eating Assistance Required', dietary.eating_assistance || dietary.feeding_assistance_required)}
          {renderField('Hydration Needs', dietary.hydration_needs)}
          {renderField('Fluid Restrictions', dietary.fluid_restrictions)}
          {renderField('Texture Modifications', dietary.texture_modifications)}
          {renderField('Meal Schedule', dietary.meal_schedule ? JSON.stringify(dietary.meal_schedule, null, 2) : null)}
          {renderField('Special Equipment Needed', dietary.special_equipment_needed)}
          {renderField('Cultural/Religious Requirements', dietary.cultural_religious_requirements)}
        </div>

        {/* Risk Factors and Monitoring */}
        <div>
          <h4 className="font-semibold text-base mb-3">Risk Factors & Monitoring</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">At Risk of Malnutrition</label>
              <Badge variant={dietary.at_risk_malnutrition ? 'destructive' : 'secondary'} className="mt-1">
                {dietary.at_risk_malnutrition ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">At Risk of Dehydration</label>
              <Badge variant={dietary.at_risk_dehydration ? 'destructive' : 'secondary'} className="mt-1">
                {dietary.at_risk_dehydration ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Check Fridge Expiry</label>
              <Badge variant={dietary.check_fridge_expiry ? 'default' : 'secondary'} className="mt-1">
                {dietary.check_fridge_expiry ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Weight Monitoring</label>
              <Badge variant={dietary.weight_monitoring ? 'default' : 'secondary'} className="mt-1">
                {dietary.weight_monitoring ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Cooking and Meal Preparation */}
        <div>
          <h4 className="font-semibold text-base mb-3">Cooking & Meal Preparation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Do You Cook</label>
              <Badge variant={dietary.do_you_cook ? 'default' : 'secondary'} className="mt-1">
                {dietary.do_you_cook ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Help with Cooking</label>
              <Badge variant={dietary.help_with_cooking ? 'default' : 'secondary'} className="mt-1">
                {dietary.help_with_cooking ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Avoidance Reasons */}
        <div>
          <h4 className="font-semibold text-base mb-3">Food Avoidance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Avoid for Medical Reasons</label>
              <Badge variant={dietary.avoid_medical_reasons ? 'default' : 'secondary'} className="mt-1">
                {dietary.avoid_medical_reasons ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Avoid for Religious Reasons</label>
              <Badge variant={dietary.avoid_religious_reasons ? 'default' : 'secondary'} className="mt-1">
                {dietary.avoid_religious_reasons ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
