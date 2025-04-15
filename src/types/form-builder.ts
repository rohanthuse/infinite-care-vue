
export type FormElementType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'tel'
  | 'date'
  | 'time'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'multiselect'
  | 'signature'
  | 'file'
  | 'heading'
  | 'paragraph'
  | 'section'
  | 'divider';

export interface FormElementBase {
  id: string;
  type: FormElementType;
  label: string;
  required: boolean;
  order: number;
}

export interface TextElement extends FormElementBase {
  type: 'text';
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  minLength?: number;
}

export interface TextAreaElement extends FormElementBase {
  type: 'textarea';
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  minLength?: number;
  rows?: number;
}

export interface NumberElement extends FormElementBase {
  type: 'number';
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface EmailElement extends FormElementBase {
  type: 'email';
  placeholder?: string;
  defaultValue?: string;
}

export interface TelElement extends FormElementBase {
  type: 'tel';
  placeholder?: string;
  defaultValue?: string;
}

export interface DateElement extends FormElementBase {
  type: 'date';
  defaultValue?: string;
  min?: string;
  max?: string;
}

export interface TimeElement extends FormElementBase {
  type: 'time';
  defaultValue?: string;
}

export interface CheckboxElement extends FormElementBase {
  type: 'checkbox';
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  defaultValue?: string[];
}

export interface RadioElement extends FormElementBase {
  type: 'radio';
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  defaultValue?: string;
}

export interface SelectElement extends FormElementBase {
  type: 'select';
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  defaultValue?: string;
  placeholder?: string;
}

export interface MultiSelectElement extends FormElementBase {
  type: 'multiselect';
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  defaultValue?: string[];
  placeholder?: string;
}

export interface SignatureElement extends FormElementBase {
  type: 'signature';
}

export interface FileElement extends FormElementBase {
  type: 'file';
  accept?: string; // e.g., "image/*" or ".pdf,.doc"
  multiple?: boolean;
}

export interface HeadingElement extends FormElementBase {
  type: 'heading';
  headingLevel: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  text: string;
}

export interface ParagraphElement extends FormElementBase {
  type: 'paragraph';
  text: string;
}

export interface SectionElement extends FormElementBase {
  type: 'section';
  title: string;
  description?: string;
  elements: FormElement[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface DividerElement extends FormElementBase {
  type: 'divider';
}

export type FormElement =
  | TextElement
  | TextAreaElement
  | NumberElement
  | EmailElement
  | TelElement
  | DateElement
  | TimeElement
  | CheckboxElement
  | RadioElement
  | SelectElement
  | MultiSelectElement
  | SignatureElement
  | FileElement
  | HeadingElement
  | ParagraphElement
  | SectionElement
  | DividerElement;

export type AssigneeType = 'client' | 'staff' | 'branch' | 'carer';

export interface FormAssignee {
  type: AssigneeType;
  id: string;
  name: string;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  elements: FormElement[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  published: boolean;
  requiresReview: boolean;
  version: number;
  assignees: FormAssignee[];
}
