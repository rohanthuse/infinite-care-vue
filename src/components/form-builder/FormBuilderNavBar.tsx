
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
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
  const { tenantSlug } = useTenant();
  const [title, setTitle] = useState<string>(form.title);
  const [description, setDescription] = useState<string>(form.description || '');
  const [isTitleEditing, setIsTitleEditing] = useState<boolean>(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState<boolean>(false);

  const handleBack = () => {
    const source = searchParams.get('source');
    
    if (source === 'forms') {
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/forms`
        : `/branch-dashboard/${branchId}/${branchName}/forms`;
      navigate(fullPath);
    } else if (source === 'workflow') {
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/workflow`
        : `/branch-dashboard/${branchId}/${branchName}/workflow`;
      navigate(fullPath);
    } else {
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}`
        : `/branch-dashboard/${branchId}/${branchName}`;
      navigate(fullPath);
    }
  };

  // Check if there are local changes compared to the original form
  const hasLocalChanges = title !== form.title || description !== (form.description || '');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Immediately notify parent of changes to enable Save button
    onFormChange(newTitle, description);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    // Immediately notify parent of changes to enable Save button
    onFormChange(title, newDescription);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDescriptionBlur();
    }
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
    console.log('FormBuilderNavBar - handleSave called with:', { title, description });
    
    // Force blur any active editing fields and synchronize state immediately
    if (isTitleEditing || isDescriptionEditing) {
      flushSync(() => {
        setIsTitleEditing(false);
        setIsDescriptionEditing(false);
      });
      
      // Ensure parent state is updated immediately
      flushSync(() => {
        onFormChange(title, description);
      });
    }
    
    // Add a small delay to ensure state updates are processed
    setTimeout(() => {
      console.log('FormBuilderNavBar - Calling onSave with:', { title, description });
      onSave(title, description);
    }, 50);
  };

  // Update local state when form prop changes, but only when not actively editing
  React.useEffect(() => {
    if (!isTitleEditing) {
      setTitle(form.title);
    }
    if (!isDescriptionEditing) {
      setDescription(form.description || '');
    }
  }, [form.title, form.description, isTitleEditing, isDescriptionEditing]);

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
            disabled={(!isFormDirty && !hasLocalChanges) || isSaving}
            variant={(isFormDirty || hasLocalChanges) ? "default" : "outline"}
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
            onKeyDown={handleDescriptionKeyDown}
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
