import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Edit, Plus, Save, X } from "lucide-react";
import { useClientBehaviorSupport, useCreateClientBehaviorSupport, useUpdateClientBehaviorSupport, ClientBehaviorSupport } from '@/hooks/useClientBehaviorSupport';
import { toast } from "sonner";

interface BehaviorSupportTabProps {
  clientId: string;
  clientName?: string;
}

export function BehaviorSupportTab({ clientId, clientName }: BehaviorSupportTabProps) {
  const { data: behaviorSupports = [], isLoading } = useClientBehaviorSupport(clientId);
  const createMutation = useCreateClientBehaviorSupport();
  const updateMutation = useUpdateClientBehaviorSupport();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    challenging_behaviors: '',
    behavior_triggers: '',
    early_warning_signs: '',
    preventative_strategies: '',
    crisis_management_plan: '',
    post_incident_protocol: ''
  });

  const handleEdit = (support: ClientBehaviorSupport) => {
    setEditingId(support.id);
    setFormData({
      challenging_behaviors: support.challenging_behaviors || '',
      behavior_triggers: support.behavior_triggers || '',
      early_warning_signs: support.early_warning_signs || '',
      preventative_strategies: support.preventative_strategies || '',
      crisis_management_plan: support.crisis_management_plan || '',
      post_incident_protocol: support.post_incident_protocol || ''
    });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: formData });
        toast.success('Behavior support plan updated successfully');
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({ ...formData, client_id: clientId });
        toast.success('Behavior support plan created successfully');
        setShowAddForm(false);
      }
      
      setFormData({
        challenging_behaviors: '',
        behavior_triggers: '',
        early_warning_signs: '',
        preventative_strategies: '',
        crisis_management_plan: '',
        post_incident_protocol: ''
      });
    } catch (error) {
      toast.error('Failed to save behavior support plan');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      challenging_behaviors: '',
      behavior_triggers: '',
      early_warning_signs: '',
      preventative_strategies: '',
      crisis_management_plan: '',
      post_incident_protocol: ''
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading behavior support information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Behavior Support Plan</h2>
          <p className="text-muted-foreground">
            Comprehensive behavior management strategies for {clientName}
          </p>
        </div>
        
        {!showAddForm && !editingId && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Behavior Plan
          </Button>
        )}
      </div>

      {behaviorSupports.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Behavior Support Plan</h3>
            <p className="text-muted-foreground mb-4">
              Create a behavior support plan to document strategies for managing challenging behaviors.
            </p>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Behavior Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {(showAddForm || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Create'} Behavior Support Plan</CardTitle>
            <CardDescription>
              Document challenging behaviors and management strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="challenging_behaviors">Challenging Behaviors</Label>
                <Textarea
                  id="challenging_behaviors"
                  placeholder="Describe known challenging behaviors..."
                  value={formData.challenging_behaviors}
                  onChange={(e) => setFormData({ ...formData, challenging_behaviors: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="behavior_triggers">Known Triggers</Label>
                <Textarea
                  id="behavior_triggers"
                  placeholder="List situations, environments, or events that may trigger behaviors..."
                  value={formData.behavior_triggers}
                  onChange={(e) => setFormData({ ...formData, behavior_triggers: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="early_warning_signs">Early Warning Signs</Label>
                <Textarea
                  id="early_warning_signs"
                  placeholder="Describe early indicators that challenging behavior may occur..."
                  value={formData.early_warning_signs}
                  onChange={(e) => setFormData({ ...formData, early_warning_signs: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preventative_strategies">Preventative Strategies</Label>
                <Textarea
                  id="preventative_strategies"
                  placeholder="Outline strategies to prevent challenging behaviors..."
                  value={formData.preventative_strategies}
                  onChange={(e) => setFormData({ ...formData, preventative_strategies: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crisis_management_plan">Crisis Management Plan</Label>
                <Textarea
                  id="crisis_management_plan"
                  placeholder="Detailed plan for managing behavioral crisis situations..."
                  value={formData.crisis_management_plan}
                  onChange={(e) => setFormData({ ...formData, crisis_management_plan: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post_incident_protocol">Post-Incident Protocol</Label>
                <Textarea
                  id="post_incident_protocol"
                  placeholder="Steps to follow after a behavioral incident..."
                  value={formData.post_incident_protocol}
                  onChange={(e) => setFormData({ ...formData, post_incident_protocol: e.target.value })}
                  className="min-h-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingId ? 'Update Plan' : 'Create Plan'}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {behaviorSupports.map((support) => (
        <Card key={support.id} className={editingId === support.id ? 'hidden' : ''}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Behavior Support Plan</CardTitle>
              <CardDescription>
                Created {new Date(support.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(support)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {support.challenging_behaviors && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Challenging Behaviors</Label>
                  <Badge variant="destructive" className="mb-2">High Priority</Badge>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {support.challenging_behaviors}
                  </p>
                </div>
              )}

              {support.behavior_triggers && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Known Triggers</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {support.behavior_triggers}
                  </p>
                </div>
              )}

              {support.early_warning_signs && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Early Warning Signs</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {support.early_warning_signs}
                  </p>
                </div>
              )}

              {support.preventative_strategies && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preventative Strategies</Label>
                  <Badge variant="secondary" className="mb-2">Prevention</Badge>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {support.preventative_strategies}
                  </p>
                </div>
              )}

              {support.crisis_management_plan && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Crisis Management Plan</Label>
                  <Badge variant="destructive" className="mb-2">Emergency</Badge>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {support.crisis_management_plan}
                  </p>
                </div>
              )}

              {support.post_incident_protocol && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Post-Incident Protocol</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {support.post_incident_protocol}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}