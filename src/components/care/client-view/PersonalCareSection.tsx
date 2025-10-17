import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Moon, Droplet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PersonalCareSectionProps {
  personalCare: any;
}

export function PersonalCareSection({ personalCare }: PersonalCareSectionProps) {
  if (!personalCare || Object.keys(personalCare).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Personal Care
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No personal care information provided yet.</p>
        </CardContent>
      </Card>
    );
  }

  const renderField = (label: string, value: any) => {
    if (!value) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <p className="text-base mt-1 whitespace-pre-wrap">{value}</p>
      </div>
    );
  };

  const renderYesNo = (label: string, value: boolean) => {
    if (value === undefined || value === null) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <Badge variant={value ? 'default' : 'secondary'} className="mt-1">
          {value ? 'Yes' : 'No'}
        </Badge>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Personal Care
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hygiene and Bathing */}
        <div>
          <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Droplet className="h-4 w-4" />
            Hygiene & Bathing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Personal Hygiene Needs', personalCare.personal_hygiene_needs)}
            {renderField('Bathing Preferences', personalCare.bathing_preferences)}
            {renderField('Skin Care Needs', personalCare.skin_care_needs)}
          </div>
        </div>

        {/* Dressing and Toileting */}
        <div>
          <h3 className="font-semibold text-base mb-3">Dressing & Toileting</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Dressing Assistance Level', personalCare.dressing_assistance_level)}
            {renderField('Toileting Assistance Level', personalCare.toileting_assistance_level)}
            {renderField('Continence Status', personalCare.continence_status)}
            {renderYesNo('Incontinence Products Required', personalCare.incontinence_products_required)}
          </div>
        </div>

        {/* Sleep Patterns */}
        {(personalCare.sleep_patterns || personalCare.sleep_go_to_bed_time || personalCare.sleep_wake_up_time) && (
          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Sleep & Rest
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Sleep Patterns', personalCare.sleep_patterns)}
              {renderField('Bedtime', personalCare.sleep_go_to_bed_time)}
              {renderField('Wake Up Time', personalCare.sleep_wake_up_time)}
              {renderField('Get Out of Bed Time', personalCare.sleep_get_out_of_bed_time)}
              {renderField('Preparation Duration', personalCare.sleep_prepare_duration)}
              {renderYesNo('Assist Going to Bed', personalCare.assist_going_to_bed)}
              {renderYesNo('Assist Getting Out of Bed', personalCare.assist_getting_out_of_bed)}
              {renderYesNo('Panic Button in Bed', personalCare.panic_button_in_bed)}
              {renderYesNo('Assist Turn to Sleep Position', personalCare.assist_turn_to_sleep_position)}
            </div>
          </div>
        )}

        {/* Additional Care Needs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Pain Management', personalCare.pain_management)}
          {renderField('Comfort Measures', personalCare.comfort_measures)}
          {renderField('Behavioral Notes', personalCare.behavioral_notes)}
          {renderField('Additional Notes', personalCare.notes)}
        </div>
      </CardContent>
    </Card>
  );
}
