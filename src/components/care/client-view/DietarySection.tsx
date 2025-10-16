import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          {renderField('Eating Assistance Required', dietary.eating_assistance)}
          {renderField('Hydration Needs', dietary.hydration_needs)}
          {renderField('Texture Modifications', dietary.texture_modifications)}
          {renderField('Cultural/Religious Requirements', dietary.cultural_religious_requirements)}
        </div>
      </CardContent>
    </Card>
  );
}
