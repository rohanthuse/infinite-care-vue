
import React from 'react';
import { FormElement } from '@/types/form-builder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface FormElementRendererProps {
  element: FormElement;
  onChange?: (value: any) => void;
  value?: any;
  isPreview?: boolean;
}

export const FormElementRenderer: React.FC<FormElementRendererProps> = ({ 
  element, 
  onChange,
  value,
  isPreview = false 
}) => {
  const handleChange = (val: any) => {
    if (onChange) {
      onChange(val);
    }
  };

  const isInteractive = isPreview && onChange;

  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={(element as any).placeholder}
            defaultValue={(element as any).defaultValue}
            value={isInteractive ? value : undefined}
            onChange={isInteractive ? (e) => handleChange(e.target.value) : undefined}
            readOnly={!isInteractive}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={(element as any).placeholder}
            defaultValue={(element as any).defaultValue}
            value={isInteractive ? value : undefined}
            onChange={isInteractive ? (e) => handleChange(e.target.value) : undefined}
            rows={(element as any).rows}
            readOnly={!isInteractive}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={(element as any).placeholder}
            defaultValue={(element as any).defaultValue?.toString()}
            value={isInteractive ? value : undefined}
            onChange={isInteractive ? (e) => handleChange(parseFloat(e.target.value) || 0) : undefined}
            min={(element as any).min}
            max={(element as any).max}
            step={(element as any).step}
            readOnly={!isInteractive}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            placeholder={(element as any).placeholder}
            defaultValue={(element as any).defaultValue}
            value={isInteractive ? value : undefined}
            onChange={isInteractive ? (e) => handleChange(e.target.value) : undefined}
            readOnly={!isInteractive}
          />
        );
      
      case 'tel':
        return (
          <Input
            type="tel"
            placeholder={(element as any).placeholder}
            defaultValue={(element as any).defaultValue}
            value={isInteractive ? value : undefined}
            onChange={isInteractive ? (e) => handleChange(e.target.value) : undefined}
            readOnly={!isInteractive}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            defaultValue={(element as any).defaultValue}
            value={isInteractive ? value : undefined}
            onChange={isInteractive ? (e) => handleChange(e.target.value) : undefined}
            min={(element as any).min}
            max={(element as any).max}
            readOnly={!isInteractive}
          />
        );
      
      case 'time':
        return (
          <Input
            type="time"
            defaultValue={(element as any).defaultValue}
            value={isInteractive ? value : undefined}
            onChange={isInteractive ? (e) => handleChange(e.target.value) : undefined}
            readOnly={!isInteractive}
          />
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {(element as any).options.map((option: any) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={option.id} 
                  disabled={!isInteractive}
                  checked={isInteractive ? (value && value.includes(option.value)) : undefined}
                  onCheckedChange={isInteractive ? (checked) => {
                    const currentValues = Array.isArray(value) ? [...value] : [];
                    if (checked) {
                      handleChange([...currentValues, option.value]);
                    } else {
                      handleChange(currentValues.filter(v => v !== option.value));
                    }
                  } : undefined}
                />
                <label htmlFor={option.id} className="text-sm">{option.label}</label>
              </div>
            ))}
          </div>
        );
      
      case 'radio':
        return (
          <RadioGroup 
            defaultValue={(element as any).defaultValue} 
            disabled={!isInteractive}
            value={isInteractive ? value : undefined}
            onValueChange={isInteractive ? handleChange : undefined}
          >
            {(element as any).options.map((option: any) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.id} />
                <Label htmlFor={option.id}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'select':
        return (
          <Select defaultValue={element.defaultValue} disabled>
            <SelectTrigger>
              <SelectValue placeholder={element.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {element.options.map(option => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'multiselect':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={element.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {element.options.map(option => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'file':
        return (
          <Input
            type="file"
            accept={element.accept}
            multiple={element.multiple}
            disabled
          />
        );
      
      case 'signature':
        return (
          <div className="border rounded p-4 bg-gray-50 flex items-center justify-center h-24">
            <p className="text-gray-500">Signature Field</p>
          </div>
        );
      
      case 'heading':
        return renderHeading();
      
      case 'paragraph':
        return <p className="text-gray-700">{(element as any).text}</p>;
      
      case 'section':
        return (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg">{(element as any).title}</h3>
            {(element as any).description && (
              <p className="text-gray-600 text-sm mt-1">{(element as any).description}</p>
            )}
            <div className="mt-4 space-y-4">
              {(element as any).elements.map((nestedElement: FormElement) => (
                <FormElementRenderer 
                  key={nestedElement.id} 
                  element={nestedElement} 
                  isPreview={isPreview}
                  onChange={onChange ? (value) => onChange({ [nestedElement.id]: value }) : undefined}
                  value={value && value[nestedElement.id]}
                />
              ))}
            </div>
          </div>
        );
      
      case 'divider':
        return <Separator />;
      
      default:
        return <div>Unknown element type</div>;
    }
  };

  const renderHeading = () => {
    const { headingLevel, text } = element as any;
    
    switch (headingLevel) {
      case 'h1':
        return <h1 className="text-3xl font-bold">{text}</h1>;
      case 'h2':
        return <h2 className="text-2xl font-bold">{text}</h2>;
      case 'h3':
        return <h3 className="text-xl font-bold">{text}</h3>;
      case 'h4':
        return <h4 className="text-lg font-bold">{text}</h4>;
      case 'h5':
        return <h5 className="text-base font-bold">{text}</h5>;
      case 'h6':
        return <h6 className="text-sm font-bold">{text}</h6>;
      default:
        return <h2 className="text-2xl font-bold">{text}</h2>;
    }
  };

  return (
    <div className="w-full">
      {['heading', 'paragraph', 'section', 'divider'].includes(element.type) ? (
        renderElement()
      ) : (
        <div className="space-y-2">
          <div className="font-medium text-sm">
            {element.label}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </div>
          {renderElement()}
        </div>
      )}
    </div>
  );
};
