import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Moon, Droplet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PersonalCareSectionProps {
  personalCare: any;
}

export function PersonalCareSection({ personalCare }: PersonalCareSectionProps) {
  const data = personalCare || {};

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

  const renderYesNo = (label: string, value: any) => {
    const hasValue = value !== undefined && value !== null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <Badge variant={value === true || value === 'yes' ? 'default' : 'secondary'} className="mt-1 block w-fit">
            {value === true || value === 'yes' ? 'Yes' : 'No'}
          </Badge>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderSelect = (label: string, value: any) => {
    const hasValue = value !== undefined && value !== null && value !== '';
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <p className="text-base mt-1 capitalize">{value.replace(/_/g, ' ')}</p>
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
          <Heart className="h-5 w-5 text-primary" />
          Personal Care
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assistance Levels */}
        <div>
          <h3 className="font-semibold text-base mb-3">Assistance Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderSelect('Dressing Assistance Level', data.dressing_assistance_level)}
            {renderSelect('Toileting Assistance Level', data.toileting_assistance_level)}
            {renderSelect('Continence Status', data.continence_status)}
          </div>
        </div>

        {/* Hygiene and Bathing */}
        <div>
          <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Droplet className="h-4 w-4" />
            Hygiene & Bathing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Bathing Preferences', data.bathing_preferences)}
            {renderField('Personal Hygiene Needs', data.personal_hygiene_needs)}
            {renderField('Skin Care Needs', data.skin_care_needs)}
          </div>
        </div>

        {/* Sleep Patterns */}
        <div>
          <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Sleep & Rest
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Sleep Patterns', data.sleep_patterns)}
            {renderField('What time do you usually go to bed?', data.sleep_go_to_bed_time)}
            {renderField('What time do you usually wake up?', data.sleep_wake_up_time)}
            {renderField('What time do you prefer to get out of bed?', data.sleep_get_out_of_bed_time)}
            {renderField('How long will it take you to prepare to go to bed?', data.sleep_prepare_duration)}
            {renderYesNo('Do you want us to assist you with going to bed?', data.assist_going_to_bed)}
            {renderYesNo('Do you want us to assist you with getting out of the bed?', data.assist_getting_out_of_bed)}
            {renderYesNo('Do you have a panic button to call for assistance when in bed?', data.panic_button_in_bed)}
            {renderYesNo('Do you need assistance to turn to your preferred sleeping position at night?', data.assist_turn_to_sleep_position)}
          </div>
        </div>

        {/* Night Time Care */}
        <div>
          <h3 className="font-semibold text-base mb-3">Night Time Care</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderYesNo('Do you require any night-time repositioning?', data.night_repositioning_required)}
            {renderField('Repositioning Frequency', data.repositioning_frequency)}
            {renderField('Repositioning Method', data.repositioning_method)}
            {renderYesNo('Do you require a night light?', data.night_light_required)}
            {renderYesNo('Do you require medication at night?', data.night_medication_required)}
            {renderField('Night Medication Details', data.night_medication_details)}
          </div>
        </div>

        {/* Incontinence */}
        <div>
          <h3 className="font-semibold text-base mb-3">Incontinence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderYesNo('Are incontinence products required?', data.incontinence_products_required)}
            {renderField('Incontinence Product Type', data.incontinence_product_type)}
            {renderField('Incontinence Management', data.incontinence_management)}
          </div>
        </div>

        {/* Pain and Comfort */}
        <div>
          <h3 className="font-semibold text-base mb-3">Pain & Comfort</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Pain Management', data.pain_management)}
            {renderField('Comfort Measures', data.comfort_measures)}
          </div>
        </div>

        {/* Behavioral Notes */}
        <div>
          <h3 className="font-semibold text-base mb-3">Behavioral Notes</h3>
          <div className="grid grid-cols-1 gap-4">
            {renderField('Behavioral Notes', data.behavioral_notes)}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-muted/50 rounded p-3">
          <label className="text-sm font-medium">Additional Notes</label>
          {data.notes ? (
            <p className="text-sm mt-1 whitespace-pre-wrap">{data.notes}</p>
          ) : (
            <p className="text-sm mt-1 text-muted-foreground italic">No additional notes provided</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
