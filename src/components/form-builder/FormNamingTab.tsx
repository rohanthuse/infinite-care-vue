import React, { useState, useEffect } from 'react';
import { Form } from '@/types/form-builder';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

interface FormNamingTabProps {
  form: Form;
  onFormChange: (title: string, description: string) => void;
  onSave: () => void;
  isFormDirty: boolean;
  isSaving: boolean;
}

export const FormNamingTab: React.FC<FormNamingTabProps> = ({
  form,
  onFormChange,
  onSave,
  isFormDirty,
  isSaving,
}) => {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description || '');

  useEffect(() => {
    setTitle(form.title);
    setDescription(form.description || '');
  }, [form.title, form.description]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onFormChange(newTitle, description);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    onFormChange(title, newDescription);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="form-title" className="text-base font-semibold">
              Form Title *
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Give your form a clear, descriptive title
            </p>
            <Input
              id="form-title"
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g., Client Intake Form, Staff Evaluation, Daily Report"
              className="text-lg"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length} characters
            </p>
          </div>

          <div>
            <Label htmlFor="form-description" className="text-base font-semibold">
              Form Description
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Provide additional context or instructions for form users
            </p>
            <Textarea
              id="form-description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Describe the purpose of this form and any important instructions..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length} characters
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={() => onSave()} 
              disabled={!isFormDirty || isSaving}
              variant={isFormDirty ? "default" : "outline"}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Form Details
                </>
              )}
            </Button>
            {isFormDirty && (
              <p className="text-xs text-amber-600 mt-2">
                You have unsaved changes
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Use a clear, action-oriented title that describes the form's purpose</li>
          <li>Include instructions or context in the description to help users complete the form</li>
          <li>Click the "Save Form Details" button below to save your changes</li>
        </ul>
      </div>
    </div>
  );
};
