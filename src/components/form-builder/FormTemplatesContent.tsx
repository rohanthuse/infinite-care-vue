
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Eye, Copy, Star, Bookmark, FileText, Calendar, Loader2 } from 'lucide-react';
import { useFormManagement } from '@/hooks/useFormManagement';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { toast } from '@/components/ui/use-toast';

interface FormTemplatesContentProps {
  branchId: string;
  branchName: string;
}

export const FormTemplatesContent: React.FC<FormTemplatesContentProps> = ({ branchId, branchName }) => {
  const navigate = useNavigate();
  const { user } = useAuthSafe();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState<boolean>(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const { 
    forms, 
    isLoading, 
    createForm,
    duplicateForm,
    isCreating,
    isDuplicating
  } = useFormManagement(branchId);

  // For now, we'll treat all published forms as potential templates
  // In a real implementation, you might add a 'is_template' field to the forms table
  const templates = forms.filter(form => form.published);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // For now, we'll use basic categories. In a real implementation, you'd add category field to forms
    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'assessment' && !template.title.toLowerCase().includes('assessment')) {
        matchesCategory = false;
      } else if (categoryFilter === 'intake' && !template.title.toLowerCase().includes('intake')) {
        matchesCategory = false;
      } else if (categoryFilter === 'care-plan' && !template.title.toLowerCase().includes('care')) {
        matchesCategory = false;
      }
    }
    
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (templateId: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to use templates",
        variant: "destructive",
      });
      return;
    }
    
    duplicateForm({ formId: templateId, userId: user.id });
  };

  const handleViewTemplate = (templateId: string) => {
    navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${templateId}`);
  };

  const handleCreateFromScratch = () => {
    navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTemplateCategory = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('assessment')) return 'Assessment';
    if (lowerTitle.includes('intake')) return 'Intake';
    if (lowerTitle.includes('care')) return 'Care Plan';
    if (lowerTitle.includes('medication')) return 'Medication';
    return 'General';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Assessment': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
      case 'Intake': return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'Care Plan': return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700';
      case 'Medication': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
      default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Form Templates</h3>
          <p className="text-sm text-muted-foreground">
            Choose from pre-built templates or create a new form from scratch
          </p>
        </div>
        <Button onClick={handleCreateFromScratch} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          {isCreating ? 'Creating...' : 'Create from Scratch'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="assessment">Assessment</SelectItem>
            <SelectItem value="intake">Intake</SelectItem>
            <SelectItem value="care-plan">Care Plan</SelectItem>
            <SelectItem value="medication">Medication</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search criteria' : 'Create your first form to use as a template'}
          </p>
          <Button onClick={handleCreateFromScratch}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const category = getTemplateCategory(template.title);
            const categoryColor = getCategoryColor(category);
            
            return (
              <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base line-clamp-2">{template.title}</CardTitle>
                      {template.description && (
                        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTemplate(template.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Template
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUseTemplate(template.id)}
                          disabled={isDuplicating}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {isDuplicating ? 'Creating...' : 'Use Template'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <Badge variant="outline" className={categoryColor}>
                      {category}
                    </Badge>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(template.updated_at)}
                      </div>
                      <div className="flex items-center">
                        <Star className="mr-1 h-3 w-3" />
                        Template
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2">
                  <div className="flex w-full gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewTemplate(template.id)}
                      className="flex-1"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleUseTemplate(template.id)}
                      disabled={isDuplicating}
                      className="flex-1"
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      {isDuplicating ? 'Creating...' : 'Use Template'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
