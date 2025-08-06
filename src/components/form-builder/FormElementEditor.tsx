import React, { useState, useCallback } from 'react';
import { FormElement, CheckboxElement, RadioElement, SelectElement, MultiSelectElement } from '@/types/form-builder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FormElementEditorProps {
  element: FormElement;
  onUpdate: (updatedElement: Partial<FormElement>) => void;
  onClose: () => void;
}

export const FormElementEditor: React.FC<FormElementEditorProps> = ({
  element,
  onUpdate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  
  const handleBasicInfoChange = useCallback((field: string, value: any) => {
    onUpdate({ [field]: value });
  }, [onUpdate]);
  
  const handleAddOption = () => {
    if (['checkbox', 'radio', 'select', 'multiselect'].includes(element.type)) {
      const elementWithOptions = element as CheckboxElement | RadioElement | SelectElement | MultiSelectElement;
      const updatedOptions = [
        ...elementWithOptions.options,
        { id: uuidv4(), label: `Option ${elementWithOptions.options.length + 1}`, value: `option${elementWithOptions.options.length + 1}` }
      ];
      onUpdate({ options: updatedOptions });
    }
  };
  
  const handleUpdateOption = (optionId: string, field: string, value: string) => {
    if (['checkbox', 'radio', 'select', 'multiselect'].includes(element.type)) {
      const elementWithOptions = element as CheckboxElement | RadioElement | SelectElement | MultiSelectElement;
      const updatedOptions = elementWithOptions.options.map(option =>
        option.id === optionId ? { ...option, [field]: value } : option
      );
      onUpdate({ options: updatedOptions });
    }
  };
  
  const handleRemoveOption = (optionId: string) => {
    if (['checkbox', 'radio', 'select', 'multiselect'].includes(element.type)) {
      const elementWithOptions = element as CheckboxElement | RadioElement | SelectElement | MultiSelectElement;
      const updatedOptions = elementWithOptions.options.filter(option => option.id !== optionId);
      onUpdate({ options: updatedOptions });
    }
  };
  
  const renderBasicSettings = () => {
    return (
      <div className="space-y-4">
        {/* Common settings for all elements */}
        {!['heading', 'paragraph', 'section', 'divider'].includes(element.type) && (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">Field Label</Label>
              <Input
                id="label"
                value={element.label || ''}
                onChange={(e) => handleBasicInfoChange('label', e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={element.required}
                onCheckedChange={(checked) => handleBasicInfoChange('required', checked)}
              />
              <Label htmlFor="required">Required field</Label>
            </div>
          </>
        )}
        
        {/* Element-specific settings */}
        {element.type === 'text' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={(element as any).placeholder || ''}
                onChange={(e) => handleBasicInfoChange('placeholder', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                value={(element as any).defaultValue || ''}
                onChange={(e) => handleBasicInfoChange('defaultValue', e.target.value)}
              />
            </div>
          </>
        )}
        
        {element.type === 'textarea' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={element.placeholder || ''}
                onChange={(e) => handleBasicInfoChange('placeholder', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Textarea
                id="defaultValue"
                value={element.defaultValue || ''}
                onChange={(e) => handleBasicInfoChange('defaultValue', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rows">Number of Rows</Label>
              <Input
                id="rows"
                type="number"
                min={1}
                max={20}
                value={element.rows || 3}
                onChange={(e) => handleBasicInfoChange('rows', parseInt(e.target.value) || 3)}
              />
            </div>
          </>
        )}
        
        {element.type === 'number' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={element.placeholder || ''}
                onChange={(e) => handleBasicInfoChange('placeholder', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                type="number"
                value={element.defaultValue || ''}
                onChange={(e) => handleBasicInfoChange('defaultValue', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min">Minimum Value</Label>
                <Input
                  id="min"
                  type="number"
                  value={element.min || ''}
                  onChange={(e) => handleBasicInfoChange('min', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Maximum Value</Label>
                <Input
                  id="max"
                  type="number"
                  value={element.max || ''}
                  onChange={(e) => handleBasicInfoChange('max', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </>
        )}
        
        {(element.type === 'email' || element.type === 'tel') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={element.placeholder || ''}
                onChange={(e) => handleBasicInfoChange('placeholder', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                type={element.type}
                value={element.defaultValue || ''}
                onChange={(e) => handleBasicInfoChange('defaultValue', e.target.value)}
              />
            </div>
          </>
        )}
        
        {element.type === 'date' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                type="date"
                value={element.defaultValue || ''}
                onChange={(e) => handleBasicInfoChange('defaultValue', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min">Minimum Date</Label>
                <Input
                  id="min"
                  type="date"
                  value={element.min || ''}
                  onChange={(e) => handleBasicInfoChange('min', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Maximum Date</Label>
                <Input
                  id="max"
                  type="date"
                  value={element.max || ''}
                  onChange={(e) => handleBasicInfoChange('max', e.target.value)}
                />
              </div>
            </div>
          </>
        )}
        
        {element.type === 'time' && (
          <div className="space-y-2">
            <Label htmlFor="defaultValue">Default Value</Label>
            <Input
              id="defaultValue"
              type="time"
              value={element.defaultValue || ''}
              onChange={(e) => handleBasicInfoChange('defaultValue', e.target.value)}
            />
          </div>
        )}
        
        {['checkbox', 'radio', 'select', 'multiselect'].includes(element.type) && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="options">Options</Label>
                <Button variant="outline" size="sm" onClick={handleAddOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                  {(element as CheckboxElement | RadioElement | SelectElement | MultiSelectElement).options.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Input
                        value={option.label}
                        onChange={(e) => handleUpdateOption(option.id, 'label', e.target.value)}
                        placeholder="Option label"
                        className="flex-grow"
                      />
                      <Input
                        value={option.value}
                        onChange={(e) => handleUpdateOption(option.id, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-24"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleRemoveOption(option.id)}
                        disabled={(element as CheckboxElement | RadioElement | SelectElement | MultiSelectElement).options.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {['select', 'multiselect'].includes(element.type) && (
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={(element as SelectElement | MultiSelectElement).placeholder || ''}
                  onChange={(e) => handleBasicInfoChange('placeholder', e.target.value)}
                />
              </div>
            )}
          </>
        )}
        
        {element.type === 'file' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="accept">Accepted File Types</Label>
              <Input
                id="accept"
                value={element.accept || ''}
                onChange={(e) => handleBasicInfoChange('accept', e.target.value)}
                placeholder="e.g., image/*,.pdf,.doc"
              />
              <p className="text-xs text-gray-500">Use comma-separated values, e.g., image/*,.pdf,.doc</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="multiple"
                checked={element.multiple}
                onCheckedChange={(checked) => handleBasicInfoChange('multiple', checked)}
              />
              <Label htmlFor="multiple">Allow multiple files</Label>
            </div>
          </>
        )}
        
        {element.type === 'heading' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="text">Heading Text</Label>
              <Input
                id="text"
                value={element.text || ''}
                onChange={(e) => handleBasicInfoChange('text', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="headingLevel">Heading Level</Label>
              <Select
                value={element.headingLevel}
                onValueChange={(value) => handleBasicInfoChange('headingLevel', value)}
              >
                <SelectTrigger id="headingLevel">
                  <SelectValue placeholder="Select heading level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">Heading 1 (Largest)</SelectItem>
                  <SelectItem value="h2">Heading 2</SelectItem>
                  <SelectItem value="h3">Heading 3</SelectItem>
                  <SelectItem value="h4">Heading 4</SelectItem>
                  <SelectItem value="h5">Heading 5</SelectItem>
                  <SelectItem value="h6">Heading 6 (Smallest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {element.type === 'paragraph' && (
          <div className="space-y-2">
            <Label htmlFor="text">Paragraph Text</Label>
            <Textarea
              id="text"
              value={element.text || ''}
              onChange={(e) => handleBasicInfoChange('text', e.target.value)}
              rows={4}
            />
          </div>
        )}
        
        {element.type === 'section' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={element.title || ''}
                onChange={(e) => handleBasicInfoChange('title', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Section Description</Label>
              <Textarea
                id="description"
                value={element.description || ''}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="collapsible"
                checked={element.collapsible}
                onCheckedChange={(checked) => handleBasicInfoChange('collapsible', checked)}
              />
              <Label htmlFor="collapsible">Make section collapsible</Label>
            </div>
            
            {element.collapsible && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="defaultCollapsed"
                  checked={element.defaultCollapsed}
                  onCheckedChange={(checked) => handleBasicInfoChange('defaultCollapsed', checked)}
                />
                <Label htmlFor="defaultCollapsed">Collapsed by default</Label>
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  const renderValidationSettings = () => {
    // Additional validation settings could be implemented here
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Validation settings will be available in a future update.</p>
      </div>
    );
  };
  
  const renderAdvancedSettings = () => {
    // Advanced settings could be implemented here
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Advanced settings will be available in a future update.</p>
      </div>
    );
  };
  
  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="px-1 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            {renderBasicSettings()}
          </TabsContent>
          
          <TabsContent value="validation">
            {renderValidationSettings()}
          </TabsContent>
          
          <TabsContent value="advanced">
            {renderAdvancedSettings()}
          </TabsContent>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};
