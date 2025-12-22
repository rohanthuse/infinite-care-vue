import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CheckCircle2, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplateItem {
  id: string;
  title?: string;
  name?: string;
  letter?: string;
  color?: string;
  category?: string | null;
  explanation?: string | null;
  field_caption?: string | null;
  status: string;
}

interface AdoptSystemTemplatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  templates: TemplateItem[];
  adoptedIds: string[];
  isLoading: boolean;
  isAdopting: boolean;
  onAdopt: (templates: TemplateItem[]) => void;
  displayField?: 'title' | 'name' | 'letter';
  showColor?: boolean;
}

export const AdoptSystemTemplatesDialog: React.FC<AdoptSystemTemplatesDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  templates,
  adoptedIds,
  isLoading,
  isAdopting,
  onAdopt,
  displayField = 'title',
  showColor = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const availableTemplates = templates.filter(t => !adoptedIds.includes(t.id));
  const filteredTemplates = availableTemplates.filter(t => {
    const searchText = (t[displayField] || t.title || t.name || '').toLowerCase();
    return searchText.includes(searchQuery.toLowerCase());
  });

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTemplates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTemplates.map(t => t.id));
    }
  };

  const handleAdopt = () => {
    const selectedTemplates = templates.filter(t => selectedIds.includes(t.id));
    onAdopt(selectedTemplates);
    setSelectedIds([]);
    setSearchQuery('');
  };

  const handleClose = () => {
    setSelectedIds([]);
    setSearchQuery('');
    onClose();
  };

  const getDisplayText = (template: TemplateItem) => {
    if (displayField === 'letter' && template.letter) {
      return `${template.letter} - ${template.title}`;
    }
    return template[displayField] || template.title || template.name || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredTemplates.length === 0}
            >
              {selectedIds.length === filteredTemplates.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : availableTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
              <p className="text-muted-foreground">All system templates have been adopted!</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No templates match your search.
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => handleToggle(template.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(template.id)}
                      onCheckedChange={() => handleToggle(template.id)}
                    />
                    {showColor && template.color && (
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: template.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getDisplayText(template)}</p>
                      {template.category && (
                        <p className="text-sm text-muted-foreground">{template.category}</p>
                      )}
                      {template.explanation && (
                        <p className="text-sm text-muted-foreground truncate">{template.explanation}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {template.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {adoptedIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <CheckCircle2 className="inline h-4 w-4 mr-1 text-green-500" />
              {adoptedIds.length} template(s) already adopted
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAdopting}>
            Cancel
          </Button>
          <Button
            onClick={handleAdopt}
            disabled={selectedIds.length === 0 || isAdopting}
          >
            {isAdopting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adopting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Adopt {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
