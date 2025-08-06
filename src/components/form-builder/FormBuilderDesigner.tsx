
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlusCircle, Type, AlignLeft, Hash, Mail, Phone, Calendar, Clock, CheckSquare, 
  CircleDot, List, FileInput, FileSignature, Heading, Text, Section, SeparatorHorizontal,
  GripVertical, Copy, Trash, Settings
} from 'lucide-react';
import { Form, FormElement, FormElementType } from '@/types/form-builder';
import { FormElementEditor } from './FormElementEditor';
import { FormElementRenderer } from './FormElementRenderer';
import { v4 as uuidv4 } from 'uuid';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FormBuilderDesignerProps {
  form: Form;
  onAddElement: (element: FormElement) => void;
  onUpdateElement: (elementId: string, updatedElement: Partial<FormElement>) => void;
  onRemoveElement: (elementId: string) => void;
  onReorderElements: (elements: FormElement[]) => void;
}

export const FormBuilderDesigner: React.FC<FormBuilderDesignerProps> = ({
  form,
  onAddElement,
  onUpdateElement,
  onRemoveElement,
  onReorderElements,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  
  const getElementIcon = (type: FormElementType) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'textarea': return <AlignLeft className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'tel': return <Phone className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'time': return <Clock className="h-4 w-4" />;
      case 'checkbox': return <CheckSquare className="h-4 w-4" />;
      case 'radio': return <CircleDot className="h-4 w-4" />;
      case 'select': return <List className="h-4 w-4" />;
      case 'multiselect': return <List className="h-4 w-4" />;
      case 'file': return <FileInput className="h-4 w-4" />;
      case 'signature': return <FileSignature className="h-4 w-4" />;
      case 'heading': return <Heading className="h-4 w-4" />;
      case 'paragraph': return <Text className="h-4 w-4" />; // Changed from Paragraph to Text
      case 'section': return <Section className="h-4 w-4" />;
      case 'divider': return <SeparatorHorizontal className="h-4 w-4" />;
      default: return <PlusCircle className="h-4 w-4" />;
    }
  };

  const handleAddElement = (type: FormElementType) => {
    const newElementBase = {
      id: uuidv4(),
      type,
      label: `New ${type} field`,
      required: false,
      order: form.elements.length,
    };
    
    let newElement: FormElement;
    
    switch (type) {
      case 'text':
        newElement = {
          ...newElementBase,
          type: 'text',
          placeholder: 'Enter text...',
        };
        break;
      case 'textarea':
        newElement = {
          ...newElementBase,
          type: 'textarea',
          placeholder: 'Enter text...',
          rows: 3,
        };
        break;
      case 'number':
        newElement = {
          ...newElementBase,
          type: 'number',
          placeholder: 'Enter number...',
        };
        break;
      case 'email':
        newElement = {
          ...newElementBase,
          type: 'email',
          placeholder: 'email@example.com',
        };
        break;
      case 'tel':
        newElement = {
          ...newElementBase,
          type: 'tel',
          placeholder: '+44 123 456 7890',
        };
        break;
      case 'date':
        newElement = {
          ...newElementBase,
          type: 'date',
        };
        break;
      case 'time':
        newElement = {
          ...newElementBase,
          type: 'time',
        };
        break;
      case 'checkbox':
        newElement = {
          ...newElementBase,
          type: 'checkbox',
          options: [
            { id: uuidv4(), label: 'Option 1', value: 'option1' },
            { id: uuidv4(), label: 'Option 2', value: 'option2' },
          ],
        };
        break;
      case 'radio':
        newElement = {
          ...newElementBase,
          type: 'radio',
          options: [
            { id: uuidv4(), label: 'Option 1', value: 'option1' },
            { id: uuidv4(), label: 'Option 2', value: 'option2' },
          ],
        };
        break;
      case 'select':
        newElement = {
          ...newElementBase,
          type: 'select',
          options: [
            { id: uuidv4(), label: 'Option 1', value: 'option1' },
            { id: uuidv4(), label: 'Option 2', value: 'option2' },
          ],
          placeholder: 'Select an option',
        };
        break;
      case 'multiselect':
        newElement = {
          ...newElementBase,
          type: 'multiselect',
          options: [
            { id: uuidv4(), label: 'Option 1', value: 'option1' },
            { id: uuidv4(), label: 'Option 2', value: 'option2' },
          ],
          placeholder: 'Select options',
        };
        break;
      case 'signature':
        newElement = {
          ...newElementBase,
          type: 'signature',
        };
        break;
      case 'file':
        newElement = {
          ...newElementBase,
          type: 'file',
          accept: 'image/*,.pdf,.doc,.docx',
          multiple: false,
        };
        break;
      case 'heading':
        newElement = {
          ...newElementBase,
          type: 'heading',
          headingLevel: 'h2',
          text: 'Heading Text',
        };
        break;
      case 'paragraph':
        newElement = {
          ...newElementBase,
          type: 'paragraph',
          text: 'Paragraph text goes here. Click to edit.',
        };
        break;
      case 'section':
        newElement = {
          ...newElementBase,
          type: 'section',
          title: 'Section Title',
          description: 'Section description',
          elements: [],
          collapsible: true,
          defaultCollapsed: false,
        };
        break;
      case 'divider':
        newElement = {
          ...newElementBase,
          type: 'divider',
        };
        break;
      default:
        throw new Error(`Unsupported element type: ${type}`);
    }
    
    onAddElement(newElement);
    setSelectedElementId(newElement.id);
    setIsEditorOpen(true);
  };

  const handleEditElement = (elementId: string) => {
    setSelectedElementId(elementId);
    setIsEditorOpen(true);
  };

  const handleDuplicateElement = (element: FormElement) => {
    const duplicatedElement = {
      ...element,
      id: uuidv4(),
      label: `${element.label} (copy)`,
      order: form.elements.length,
    };
    onAddElement(duplicatedElement);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedElements = Array.from(form.elements);
    const [removed] = reorderedElements.splice(result.source.index, 1);
    reorderedElements.splice(result.destination.index, 0, removed);
    
    // Update the order property
    const elementsWithUpdatedOrder = reorderedElements.map((el, idx) => ({ ...el, order: idx }));
    
    onReorderElements(elementsWithUpdatedOrder);
  };

  const selectedElement = form.elements.find(el => el.id === selectedElementId) || null;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left Panel - Element Types */}
      <div className="w-full md:w-56 lg:w-64">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Form Elements</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-0.5">
                <h3 className="text-xs font-medium text-gray-500 px-2 py-1">Input Fields</h3>
                <div className="space-y-1 px-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('text')}>
                    {getElementIcon('text')} <span className="ml-2">Text</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('textarea')}>
                    {getElementIcon('textarea')} <span className="ml-2">Text Area</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('number')}>
                    {getElementIcon('number')} <span className="ml-2">Number</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('email')}>
                    {getElementIcon('email')} <span className="ml-2">Email</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('tel')}>
                    {getElementIcon('tel')} <span className="ml-2">Phone</span>
                  </Button>
                </div>
                
                <h3 className="text-xs font-medium text-gray-500 px-2 py-1 mt-2">Date & Time</h3>
                <div className="space-y-1 px-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('date')}>
                    {getElementIcon('date')} <span className="ml-2">Date</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('time')}>
                    {getElementIcon('time')} <span className="ml-2">Time</span>
                  </Button>
                </div>
                
                <h3 className="text-xs font-medium text-gray-500 px-2 py-1 mt-2">Selection</h3>
                <div className="space-y-1 px-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('checkbox')}>
                    {getElementIcon('checkbox')} <span className="ml-2">Checkbox</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('radio')}>
                    {getElementIcon('radio')} <span className="ml-2">Radio</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('select')}>
                    {getElementIcon('select')} <span className="ml-2">Dropdown</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('multiselect')}>
                    {getElementIcon('multiselect')} <span className="ml-2">Multi-Select</span>
                  </Button>
                </div>
                
                <h3 className="text-xs font-medium text-gray-500 px-2 py-1 mt-2">Attachments</h3>
                <div className="space-y-1 px-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('file')}>
                    {getElementIcon('file')} <span className="ml-2">File Upload</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('signature')}>
                    {getElementIcon('signature')} <span className="ml-2">Signature</span>
                  </Button>
                </div>
                
                <h3 className="text-xs font-medium text-gray-500 px-2 py-1 mt-2">Layout</h3>
                <div className="space-y-1 px-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('heading')}>
                    {getElementIcon('heading')} <span className="ml-2">Heading</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('paragraph')}>
                    {getElementIcon('paragraph')} <span className="ml-2">Paragraph</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('section')}>
                    {getElementIcon('section')} <span className="ml-2">Section</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => handleAddElement('divider')}>
                    {getElementIcon('divider')} <span className="ml-2">Divider</span>
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Middle Panel - Form Canvas */}
      <div className="flex-1">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Form Canvas</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[calc(100vh-320px)] border rounded-lg bg-gray-50 p-4">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="form-elements">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4 min-h-[200px]"
                    >
                      {form.elements.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                          <p className="text-gray-500">Drag elements here or click an element type to add</p>
                        </div>
                      )}
                      
                      {form.elements.map((element, index) => (
                        <Draggable key={element.id} draggableId={element.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white rounded-lg border ${selectedElementId === element.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                            >
                              <div className="flex items-center justify-between p-2 border-b bg-gray-50 rounded-t-lg">
                                <div className="flex items-center">
                                  <div {...provided.dragHandleProps} className="cursor-grab p-1">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <span className="ml-2 text-sm font-medium">{element.label}</span>
                                  {element.required && (
                                    <span className="ml-1 text-red-500">*</span>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditElement(element.id)}>
                                    <Settings className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicateElement(element)}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onRemoveElement(element.id)}>
                                    <Trash className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="p-3" onClick={() => handleEditElement(element.id)}>
                                <FormElementRenderer element={element} />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Element Editor Dialog */}
      <Dialog open={isEditorOpen && selectedElement !== null} onOpenChange={(open) => {
        // Only allow closing when explicitly triggered by the close button
        if (!open && selectedElement) {
          return; // Prevent accidental closing
        }
        setIsEditorOpen(open);
      }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit {selectedElement?.type} Element</DialogTitle>
          </DialogHeader>
          {selectedElement && (
            <FormElementEditor 
              element={selectedElement}
              onUpdate={(updatedElement) => onUpdateElement(selectedElement.id, updatedElement)}
              onClose={() => setIsEditorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
