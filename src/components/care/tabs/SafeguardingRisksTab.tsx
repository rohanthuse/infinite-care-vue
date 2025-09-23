import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, Users, MapPin, FileText, Edit, Save, X, Plus } from "lucide-react";
import { useClientSafeguarding, useCreateClientSafeguarding, useUpdateClientSafeguarding, ClientSafeguarding } from '@/hooks/useClientSafeguarding';
import { toast } from "sonner";

interface SafeguardingRisksTabProps {
  clientId: string;
  clientName?: string;
}

export function SafeguardingRisksTab({ clientId, clientName }: SafeguardingRisksTabProps) {
  const { data: safeguardingRecords = [], isLoading } = useClientSafeguarding(clientId);
  const createMutation = useCreateClientSafeguarding();
  const updateMutation = useUpdateClientSafeguarding();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    absconding_risk: 'low' as 'low' | 'medium' | 'high',
    absconding_plan: '',
    self_harm_risk: 'low' as 'low' | 'medium' | 'high',
    self_harm_plan: '',
    violence_aggression_risk: 'low' as 'low' | 'medium' | 'high',
    violence_plan: '',
    environmental_risks: '',
    safeguarding_notes: '',
    safeguarding_restrictions: ''
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const handleEdit = (record: ClientSafeguarding) => {
    setEditingId(record.id);
    setFormData({
      absconding_risk: record.absconding_risk,
      absconding_plan: record.absconding_plan || '',
      self_harm_risk: record.self_harm_risk,
      self_harm_plan: record.self_harm_plan || '',
      violence_aggression_risk: record.violence_aggression_risk,
      violence_plan: record.violence_plan || '',
      environmental_risks: record.environmental_risks || '',
      safeguarding_notes: record.safeguarding_notes || '',
      safeguarding_restrictions: record.safeguarding_restrictions || ''
    });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: formData });
        toast.success('Safeguarding assessment updated successfully');
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({ ...formData, client_id: clientId });
        toast.success('Safeguarding assessment created successfully');
        setShowAddForm(false);
      }
      
      setFormData({
        absconding_risk: 'low',
        absconding_plan: '',
        self_harm_risk: 'low',
        self_harm_plan: '',
        violence_aggression_risk: 'low',
        violence_plan: '',
        environmental_risks: '',
        safeguarding_notes: '',
        safeguarding_restrictions: ''
      });
    } catch (error) {
      toast.error('Failed to save safeguarding assessment');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      absconding_risk: 'low',
      absconding_plan: '',
      self_harm_risk: 'low',
      self_harm_plan: '',
      violence_aggression_risk: 'low',
      violence_plan: '',
      environmental_risks: '',
      safeguarding_notes: '',
      safeguarding_restrictions: ''
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading safeguarding information...</div>;
  }

  const latestRecord = safeguardingRecords[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Safeguarding & Risk Assessment</h2>
          <p className="text-muted-foreground">
            Comprehensive risk assessment and safeguarding measures for {clientName}
          </p>
        </div>
        
        {!showAddForm && !editingId && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {safeguardingRecords.length === 0 ? 'Create Assessment' : 'Update Assessment'}
          </Button>
        )}
      </div>

      {/* Risk Overview Cards */}
      {latestRecord && !editingId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Absconding Risk</p>
                  <Badge variant={getRiskColor(latestRecord.absconding_risk)} className="mt-1">
                    {latestRecord.absconding_risk.toUpperCase()}
                  </Badge>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Self-Harm Risk</p>
                  <Badge variant={getRiskColor(latestRecord.self_harm_risk)} className="mt-1">
                    {latestRecord.self_harm_risk.toUpperCase()}
                  </Badge>
                </div>
                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Violence/Aggression Risk</p>
                  <Badge variant={getRiskColor(latestRecord.violence_aggression_risk)} className="mt-1">
                    {latestRecord.violence_aggression_risk.toUpperCase()}
                  </Badge>
                </div>
                <Shield className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {safeguardingRecords.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Safeguarding Assessment</h3>
            <p className="text-muted-foreground mb-4">
              Create a safeguarding assessment to document risks and protective measures.
            </p>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {(showAddForm || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {editingId ? 'Update' : 'Create'} Safeguarding Assessment
            </CardTitle>
            <CardDescription>
              Document risk levels and corresponding management plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Absconding Risk */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Users className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor="absconding_risk">Absconding Risk Level</Label>
                    <Select value={formData.absconding_risk} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, absconding_risk: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="absconding_plan">Risk Management Plan</Label>
                  <Textarea
                    id="absconding_plan"
                    placeholder="Describe strategies to prevent absconding and response procedures..."
                    value={formData.absconding_plan}
                    onChange={(e) => setFormData({ ...formData, absconding_plan: e.target.value })}
                    className="min-h-20"
                  />
                </div>
              </div>

              {/* Self-Harm Risk */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor="self_harm_risk">Self-Harm Risk Level</Label>
                    <Select value={formData.self_harm_risk} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, self_harm_risk: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="self_harm_plan">Prevention & Response Plan</Label>
                  <Textarea
                    id="self_harm_plan"
                    placeholder="Outline prevention strategies and intervention procedures..."
                    value={formData.self_harm_plan}
                    onChange={(e) => setFormData({ ...formData, self_harm_plan: e.target.value })}
                    className="min-h-20"
                  />
                </div>
              </div>

              {/* Violence/Aggression Risk */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor="violence_aggression_risk">Violence/Aggression Risk</Label>
                    <Select value={formData.violence_aggression_risk} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, violence_aggression_risk: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="violence_plan">Management Plan</Label>
                  <Textarea
                    id="violence_plan"
                    placeholder="Describe de-escalation techniques and safety measures..."
                    value={formData.violence_plan}
                    onChange={(e) => setFormData({ ...formData, violence_plan: e.target.value })}
                    className="min-h-20"
                  />
                </div>
              </div>

              {/* Environmental Risks */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Label htmlFor="environmental_risks">Environmental Risks</Label>
                </div>
                <Textarea
                  id="environmental_risks"
                  placeholder="Identify environmental hazards and safety concerns..."
                  value={formData.environmental_risks}
                  onChange={(e) => setFormData({ ...formData, environmental_risks: e.target.value })}
                  className="min-h-20"
                />
              </div>

              {/* Safeguarding Notes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <Label htmlFor="safeguarding_notes">Additional Safeguarding Notes</Label>
                </div>
                <Textarea
                  id="safeguarding_notes"
                  placeholder="Additional safeguarding concerns or observations..."
                  value={formData.safeguarding_notes}
                  onChange={(e) => setFormData({ ...formData, safeguarding_notes: e.target.value })}
                  className="min-h-20"
                />
              </div>

              {/* Safeguarding Restrictions */}
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="safeguarding_restrictions">Safeguarding Restrictions</Label>
                <Textarea
                  id="safeguarding_restrictions"
                  placeholder="Document any restrictions or special measures in place..."
                  value={formData.safeguarding_restrictions}
                  onChange={(e) => setFormData({ ...formData, safeguarding_restrictions: e.target.value })}
                  className="min-h-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingId ? 'Update Assessment' : 'Create Assessment'}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display existing assessments */}
      {safeguardingRecords.map((record, index) => (
        <Card key={record.id} className={editingId === record.id ? 'hidden' : ''}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Safeguarding Assessment {index === 0 && '(Current)'}
              </CardTitle>
              <CardDescription>
                Last updated {new Date(record.updated_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(record)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Levels Summary */}
              <div className="space-y-4">
                <h4 className="font-medium">Risk Assessment Summary</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Absconding Risk</span>
                    <Badge variant={getRiskColor(record.absconding_risk)}>
                      {record.absconding_risk.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Self-Harm Risk</span>
                    <Badge variant={getRiskColor(record.self_harm_risk)}>
                      {record.self_harm_risk.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Violence/Aggression Risk</span>
                    <Badge variant={getRiskColor(record.violence_aggression_risk)}>
                      {record.violence_aggression_risk.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Key Information */}
              <div className="space-y-4">
                {record.environmental_risks && (
                  <div>
                    <Label className="text-sm font-medium">Environmental Risks</Label>
                    <p className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded-md">
                      {record.environmental_risks}
                    </p>
                  </div>
                )}

                {record.safeguarding_restrictions && (
                  <div>
                    <Label className="text-sm font-medium">Restrictions in Place</Label>
                    <p className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded-md">
                      {record.safeguarding_restrictions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}