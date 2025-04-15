
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
  errorMessage?: string;
}

export interface TextAreaElement extends FormElementBase {
  type: 'textarea';
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  minLength?: number;
  rows?: number;
  errorMessage?: string;
}

export interface NumberElement extends FormElementBase {
  type: 'number';
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  errorMessage?: string;
}

export interface EmailElement extends FormElementBase {
  type: 'email';
  placeholder?: string;
  defaultValue?: string;
  errorMessage?: string;
}

export interface TelElement extends FormElementBase {
  type: 'tel';
  placeholder?: string;
  defaultValue?: string;
  errorMessage?: string;
}

export interface DateElement extends FormElementBase {
  type: 'date';
  defaultValue?: string;
  min?: string;
  max?: string;
  errorMessage?: string;
}

export interface TimeElement extends FormElementBase {
  type: 'time';
  defaultValue?: string;
  errorMessage?: string;
}

export interface CheckboxElement extends FormElementBase {
  type: 'checkbox';
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  defaultValue?: string[];
  errorMessage?: string;
}

export interface RadioElement extends FormElementBase {
  type: 'radio';
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  defaultValue?: string;
  errorMessage?: string;
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
  errorMessage?: string;
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
  errorMessage?: string;
}

export interface SignatureElement extends FormElementBase {
  type: 'signature';
  errorMessage?: string;
}

export interface FileElement extends FormElementBase {
  type: 'file';
  accept?: string; // e.g., "image/*" or ".pdf,.doc"
  multiple?: boolean;
  errorMessage?: string;
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

export interface FormPermissions {
  view?: {
    clients?: boolean;
    staff?: boolean;
    carers?: boolean;
    admins?: boolean;
  };
  submit?: {
    clients?: boolean;
    staff?: boolean;
    carers?: boolean;
    admins?: boolean;
  };
  manage?: {
    clients?: boolean;
    staff?: boolean;
    carers?: boolean;
    admins?: boolean;
  };
}

export interface FormSettings {
  requireAuth?: boolean;
  recordIP?: boolean;
  notifications?: {
    email?: {
      enabled?: boolean;
      recipients?: string;
      subject?: string;
      template?: string;
    };
    sms?: {
      enabled?: boolean;
      recipients?: string;
    };
  };
  workflow?: {
    reviewerType?: 'admin' | 'manager' | 'specific';
    specificReviewers?: string;
    afterSubmission?: 'thankyou' | 'redirect' | 'another';
    redirectUrl?: string;
    thankYouMessage?: string;
  };
  storage?: {
    database?: boolean;
    file?: boolean;
    fileFormat?: 'csv' | 'pdf' | 'json';
  };
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
  permissions?: FormPermissions;
  settings?: FormSettings;
}
