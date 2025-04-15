
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
}

export const FormElementRenderer: React.FC<FormElementRendererProps> = ({ element }) => {
  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={element.placeholder}
            defaultValue={element.defaultValue}
            readOnly
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={element.placeholder}
            defaultValue={element.defaultValue}
            rows={element.rows}
            readOnly
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={element.placeholder}
            defaultValue={element.defaultValue?.toString()}
            min={element.min}
            max={element.max}
            step={element.step}
            readOnly
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            placeholder={element.placeholder}
            defaultValue={element.defaultValue}
            readOnly
          />
        );
      
      case 'tel':
        return (
          <Input
            type="tel"
            placeholder={element.placeholder}
            defaultValue={element.defaultValue}
            readOnly
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            defaultValue={element.defaultValue}
            min={element.min}
            max={element.max}
            readOnly
          />
        );
      
      case 'time':
        return (
          <Input
            type="time"
            defaultValue={element.defaultValue}
            readOnly
          />
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {element.options.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox id={option.id} disabled />
                <label htmlFor={option.id} className="text-sm">{option.label}</label>
              </div>
            ))}
          </div>
        );
      
      case 'radio':
        return (
          <RadioGroup defaultValue={element.defaultValue} disabled>
            {element.options.map(option => (
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
        return <p className="text-gray-700">{element.text}</p>;
      
      case 'section':
        return (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg">{element.title}</h3>
            {element.description && (
              <p className="text-gray-600 text-sm mt-1">{element.description}</p>
            )}
            <div className="mt-4 space-y-4">
              {element.elements.map(nestedElement => (
                <FormElementRenderer key={nestedElement.id} element={nestedElement} />
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
