
import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, ChevronLeft, Home, Loader2 } from 'lucide-react';
import { Form } from '@/types/form-builder';

interface FormBuilderNavBarProps {
  form: Form;
  onSave: (overrideTitle?: string, overrideDescription?: string) => void;
  onFormChange: (title: string, description: string) => void;
  isFormDirty: boolean;
  isSaving?: boolean;
}

export const FormBuilderNavBar: React.FC<FormBuilderNavBarProps> = ({
  form,
  onSave,
  onFormChange,
  isFormDirty,
  isSaving = false,
}) => {
  const navigate = useNavigate();
  const { id: branchId, branchName } = useParams<{ id: string; branchName: string }>();
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState<string>(form.title);
  const [description, setDescription] = useState<string>(form.description || '');
  const [isTitleEditing, setIsTitleEditing] = useState<boolean>(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState<boolean>(false);

  const handleBack = () => {
    const source = searchParams.get('source');
    
    if (source === 'forms') {
      navigate(`/branch-dashboard/${branchId}/${branchName}/forms`);
    } else if (source === 'workflow') {
      navigate(`/branch-dashboard/${branchId}/${branchName}/workflow`);
    } else {
      navigate(`/branch-dashboard/${branchId}/${branchName}`);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsTitleEditing(false);
    onFormChange(title, description);
  };

  const handleDescriptionBlur = () => {
    setIsDescriptionEditing(false);
    onFormChange(title, description);
  };

  const handleSave = () => {
    // Force blur any active editing fields before saving
    if (isTitleEditing || isDescriptionEditing) {
      onFormChange(title, description);
      setIsTitleEditing(false);
      setIsDescriptionEditing(false);
    }
    // Call save with current title and description values
    onSave(title, description);
  };

  // Update local state when form prop changes
  React.useEffect(() => {
    setTitle(form.title);
    setDescription(form.description || '');
  }, [form.title, form.description]);

  return (
    <div className="flex flex-col space-y-4 bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <Home className="h-4 w-4 mr-1" /> Dashboard
          </Button>
        </div>
        <div>
          <Button 
            onClick={handleSave} 
            disabled={!isFormDirty || isSaving}
            variant={isFormDirty ? "default" : "outline"}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" /> Save
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="pt-2">
        {isTitleEditing ? (
          <Input
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
            autoFocus
            className="text-xl font-bold"
          />
        ) : (
          <h1 
            className="text-xl font-bold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded" 
            onClick={() => setIsTitleEditing(true)}
          >
            {title}
          </h1>
        )}
        
        {isDescriptionEditing ? (
          <Textarea
            value={description}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            className="text-sm text-gray-600 mt-2"
            placeholder="Enter form description..."
            rows={2}
          />
        ) : (
          <p 
            className="text-sm text-gray-600 mt-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => setIsDescriptionEditing(true)}
          >
            {description || 'Click to add a description...'}
          </p>
        )}
      </div>
    </div>
  );
};
