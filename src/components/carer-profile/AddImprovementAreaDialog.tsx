import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AddImprovementAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  staffId: string;
  editArea?: any | null;
}

export const AddImprovementAreaDialog: React.FC<AddImprovementAreaDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  staffId,
  editArea,
}) => {
  const [formData, setFormData] = useState({
    area_title: '',
    description: '',
    category: 'communication',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    priority: 'medium',
    action_plan: '',
    target_completion_date: '',
    support_required: '',
    training_recommended: false,
    progress_percentage: 0,
    status: 'open',
  });

  // Fetch staff branch_id
  const { data: staffInfo } = useQuery({
    queryKey: ['staff-info', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('branch_id')
        .eq('id', staffId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });

  useEffect(() => {
    if (editArea) {
      setFormData({
        area_title: editArea.area_title,
        description: editArea.description,
        category: editArea.category,
        severity: editArea.severity,
        priority: editArea.priority,
        action_plan: editArea.action_plan || '',
        target_completion_date: editArea.target_completion_date || '',
        support_required: editArea.support_required || '',
        training_recommended: editArea.training_recommended || false,
        progress_percentage: editArea.progress_percentage || 0,
        status: editArea.status,
      });
    } else {
      // Reset form
      setFormData({
        area_title: '',
        description: '',
        category: 'communication',
        severity: 'medium',
        priority: 'medium',
        action_plan: '',
        target_completion_date: '',
        support_required: '',
        training_recommended: false,
        progress_percentage: 0,
        status: 'open',
      });
    }
  }, [editArea, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      staff_id: staffId,
      branch_id: staffInfo?.branch_id || '',
    };
    
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editArea ? 'Edit Improvement Area' : 'Add Improvement Area'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="area_title">Title *</Label>
              <Input
                id="area_title"
                value={formData.area_title}
                onChange={(e) => setFormData({ ...formData, area_title: e.target.value })}
                placeholder="e.g., Improve documentation timeliness"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the improvement area"
                rows={3}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="punctuality">Punctuality</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="client_care">Client Care</SelectItem>
                  <SelectItem value="professionalism">Professionalism</SelectItem>
                  <SelectItem value="technical_skills">Technical Skills</SelectItem>
                  <SelectItem value="safety_compliance">Safety Compliance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="target_completion_date">Target Completion Date</Label>
              <Input
                id="target_completion_date"
                type="date"
                value={formData.target_completion_date}
                onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
              />
            </div>
            
            {editArea && (
              <>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="progress_percentage">Progress (%)</Label>
                  <Input
                    id="progress_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_percentage}
                    onChange={(e) => setFormData({ ...formData, progress_percentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}
          </div>
          
          <div>
            <Label htmlFor="action_plan">Action Plan</Label>
            <Textarea
              id="action_plan"
              value={formData.action_plan}
              onChange={(e) => setFormData({ ...formData, action_plan: e.target.value })}
              placeholder="Specific steps to address this improvement area"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="support_required">Support Required</Label>
            <Textarea
              id="support_required"
              value={formData.support_required}
              onChange={(e) => setFormData({ ...formData, support_required: e.target.value })}
              placeholder="What support or resources are needed?"
              rows={2}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="training_recommended"
              checked={formData.training_recommended}
              onCheckedChange={(checked) => setFormData({ ...formData, training_recommended: checked as boolean })}
            />
            <Label htmlFor="training_recommended" className="cursor-pointer">
              Training recommended
            </Label>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : editArea ? 'Update' : 'Add Improvement Area'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
