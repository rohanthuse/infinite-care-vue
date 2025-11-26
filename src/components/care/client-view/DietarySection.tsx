import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, AlertCircle } from 'lucide-react';

interface DietarySectionProps {
  dietary: any;
}

export function DietarySection({ dietary }: DietarySectionProps) {
  const data = dietary || {};

  const renderList = (label: string, items: any[], isAlert = false) => {
    const hasValue = items && Array.isArray(items) && items.length > 0;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {isAlert && <AlertCircle className="h-4 w-4 text-red-500" />}
          {label}
        </label>
        {hasValue ? (
          <ul className="mt-2 space-y-1">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={isAlert ? "text-red-500" : "text-primary"}>•</span>
                <span className="text-base">{typeof item === 'string' ? item : item.name || JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderField = (label: string, value: any) => {
    const hasValue = value !== undefined && value !== null && value !== '';
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <p className="text-base mt-1 whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderYesNo = (label: string, value: any, variant: 'default' | 'destructive' | 'secondary' = 'default') => {
    const hasValue = value !== undefined && value !== null;
    const isYes = value === true || value === 'yes';
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <Badge variant={isYes ? variant : 'secondary'} className="mt-1 block w-fit">
            {isYes ? 'Yes' : 'No'}
          </Badge>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
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
        {/* Food Allergies - Always show prominently */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Food Allergies
          </h4>
          {data.food_allergies && data.food_allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.food_allergies.map((allergy: string, idx: number) => (
                <Badge key={idx} variant="destructive">{allergy}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-700 italic">No food allergies recorded</p>
          )}
        </div>

        {/* Risk Factors */}
        <div>
          <h4 className="font-semibold text-base mb-3">Risk Factors & Monitoring</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderYesNo('At Risk of Malnutrition', data.at_risk_malnutrition, 'destructive')}
            {renderYesNo('At Risk of Dehydration', data.at_risk_dehydration, 'destructive')}
            {renderYesNo('Weight Monitoring Required', data.weight_monitoring)}
            {renderYesNo('Feeding Assistance Required', data.feeding_assistance_required)}
          </div>
        </div>

        {/* Cooking & Meal Preparation */}
        <div>
          <h4 className="font-semibold text-base mb-3">Cooking & Meal Preparation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderYesNo('Do you want us to check the food conditions/expiry dates in the fridge?', data.check_fridge_expiry)}
            {renderYesNo('Do you cook?', data.do_you_cook)}
            {renderYesNo('Do you want us to help you with cooking?', data.help_with_cooking)}
            {renderField('Food Preparation Instructions', data.preparation_instructions)}
          </div>
        </div>

        {/* Food Avoidance */}
        <div>
          <h4 className="font-semibold text-base mb-3">Food Avoidance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderYesNo('Are there any foods or ingredients that should be avoided for medical reasons?', data.avoid_medical_reasons)}
            {renderYesNo('Are there any foods or ingredients that should be avoided for religious reasons?', data.avoid_religious_reasons)}
          </div>
        </div>

        {/* Dietary Preferences */}
        <div>
          <h4 className="font-semibold text-base mb-3">Dietary Preferences</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderList('Dietary Restrictions', data.dietary_restrictions)}
            {renderList('Food Preferences', data.food_preferences)}
            {renderList('Dislikes', data.dislikes)}
            {renderList('Supplements', data.supplements)}
          </div>
        </div>

        {/* Nutritional Needs */}
        <div>
          <h4 className="font-semibold text-base mb-3">Nutritional & Hydration Needs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Nutritional Needs', data.nutritional_needs)}
            {renderField('Meal Preparation Needs', data.meal_preparation_needs)}
            {renderField('Eating Assistance', data.eating_assistance)}
            {renderField('Hydration Needs', data.hydration_needs)}
            {renderField('Fluid Restrictions', data.fluid_restrictions)}
            {renderField('Texture Modifications', data.texture_modifications)}
            {renderField('Special Equipment Needed', data.special_equipment_needed)}
            {renderField('Cultural/Religious Requirements', data.cultural_religious_requirements)}
          </div>
        </div>

        {/* Meal Schedule */}
        <div>
          <h4 className="font-semibold text-base mb-3">Meal Schedule</h4>
          {data.meal_schedule ? (
            <div className="bg-muted/50 rounded p-3">
              <pre className="text-sm whitespace-pre-wrap">{typeof data.meal_schedule === 'string' ? data.meal_schedule : JSON.stringify(data.meal_schedule, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No meal schedule specified</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
