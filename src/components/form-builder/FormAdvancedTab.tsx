
import React, { useState } from 'react';
import { Form, FormSettings } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings, AlertCircle } from 'lucide-react';

interface FormAdvancedTabProps {
  form: Form;
  onUpdateSettings: (settings: FormSettings) => void;
}

export const FormAdvancedTab: React.FC<FormAdvancedTabProps> = ({ 
  form,
  onUpdateSettings
}) => {
  const defaultSettings: FormSettings = {
    showProgressBar: false,
    allowSaveAsDraft: false,
    autoSaveEnabled: false,
    autoSaveInterval: 60,
    redirectAfterSubmit: false,
    submitButtonText: 'Submit',
  };

  const [settings, setSettings] = useState<FormSettings>(
    form.settings || defaultSettings
  );

  const handleSettingChange = (key: keyof FormSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    onUpdateSettings(settings);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
        <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800">Advanced Settings</h3>
          <p className="text-sm text-blue-600">
            Configure advanced form settings like progress tracking, auto-save, and submission behavior.
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Form Settings</CardTitle>
          <CardDescription>
            Configure how your form behaves and appears to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="showProgressBar">Show Progress Bar</Label>
                <p className="text-sm text-muted-foreground">
                  Display a progress bar to show form completion status
                </p>
              </div>
              <Switch
                id="showProgressBar"
                checked={settings.showProgressBar}
                onCheckedChange={(checked) => handleSettingChange('showProgressBar', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="allowSaveAsDraft">Allow Save as Draft</Label>
                <p className="text-sm text-muted-foreground">
                  Let users save their progress and continue later
                </p>
              </div>
              <Switch
                id="allowSaveAsDraft"
                checked={settings.allowSaveAsDraft}
                onCheckedChange={(checked) => handleSettingChange('allowSaveAsDraft', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="autoSaveEnabled">Enable Auto-Save</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save form progress periodically
                </p>
              </div>
              <Switch
                id="autoSaveEnabled"
                checked={settings.autoSaveEnabled}
                onCheckedChange={(checked) => handleSettingChange('autoSaveEnabled', checked)}
              />
            </div>
          </div>
          
          {settings.autoSaveEnabled && (
            <div className="space-y-2 pb-4">
              <div className="flex justify-between">
                <Label htmlFor="autoSaveInterval">Auto-Save Interval (seconds)</Label>
                <span className="text-sm">{settings.autoSaveInterval} seconds</span>
              </div>
              <Slider
                id="autoSaveInterval"
                min={10}
                max={300}
                step={10}
                value={[settings.autoSaveInterval]}
                onValueChange={([value]) => handleSettingChange('autoSaveInterval', value)}
              />
            </div>
          )}
          
          <div className="pt-2">
            <div className="space-y-2">
              <Label htmlFor="submitButtonText">Submit Button Text</Label>
              <Input
                id="submitButtonText"
                value={settings.submitButtonText}
                onChange={(e) => handleSettingChange('submitButtonText', e.target.value)}
                placeholder="Submit"
              />
            </div>
          </div>
          
          <div className="pt-2 space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="redirectAfterSubmit">Redirect After Submit</Label>
                <p className="text-sm text-muted-foreground">
                  Redirect users to another page after form submission
                </p>
              </div>
              <Switch
                id="redirectAfterSubmit"
                checked={settings.redirectAfterSubmit}
                onCheckedChange={(checked) => handleSettingChange('redirectAfterSubmit', checked)}
              />
            </div>
            
            {settings.redirectAfterSubmit && (
              <div className="space-y-2">
                <Label htmlFor="redirectUrl">Redirect URL</Label>
                <Input
                  id="redirectUrl"
                  value={settings.redirectUrl || ''}
                  onChange={(e) => handleSettingChange('redirectUrl', e.target.value)}
                  placeholder="https://example.com/thank-you"
                />
              </div>
            )}
          </div>
          
          <div className="pt-4">
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
