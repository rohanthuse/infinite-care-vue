import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GraduationCap, Target, BookOpen, Users, Edit, Save, X } from "lucide-react";
import { useClientChildInfo, useUpdateClientChildInfo } from '@/hooks/useClientChildInfo';
import { toast } from "sonner";
import { useState } from 'react';

interface EducationDevelopmentTabProps {
  clientId: string;
  clientName?: string;
}

export function EducationDevelopmentTab({ clientId, clientName }: EducationDevelopmentTabProps) {
  const { data: childInfo, isLoading } = useClientChildInfo(clientId);
  const updateMutation = useUpdateClientChildInfo();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    education_placement: childInfo?.education_placement || '',
    ehcp_targets_linked: childInfo?.ehcp_targets_linked || false,
    daily_learning_goals: childInfo?.daily_learning_goals || '',
    independence_skills: childInfo?.independence_skills || '',
    social_skills_development: childInfo?.social_skills_development || ''
  });

  React.useEffect(() => {
    if (childInfo) {
      setFormData({
        education_placement: childInfo.education_placement || '',
        ehcp_targets_linked: childInfo.ehcp_targets_linked || false,
        daily_learning_goals: childInfo.daily_learning_goals || '',
        independence_skills: childInfo.independence_skills || '',
        social_skills_development: childInfo.social_skills_development || ''
      });
    }
  }, [childInfo]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        client_id: clientId,
        ...formData
      });
      toast.success('Education & development information updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update education information');
    }
  };

  const handleCancel = () => {
    if (childInfo) {
      setFormData({
        education_placement: childInfo.education_placement || '',
        ehcp_targets_linked: childInfo.ehcp_targets_linked || false,
        daily_learning_goals: childInfo.daily_learning_goals || '',
        independence_skills: childInfo.independence_skills || '',
        social_skills_development: childInfo.social_skills_development || ''
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading education information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Education & Development</h2>
          <p className="text-muted-foreground">
            Educational placement and developmental goals for {clientName}
          </p>
        </div>
        
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Information
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Education Placement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Education Placement
            </CardTitle>
            <CardDescription>Current educational setting and arrangement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="education_placement">Education Placement</Label>
                <Input
                  id="education_placement"
                  placeholder="e.g., Special school, mainstream with support, home education..."
                  value={formData.education_placement}
                  onChange={(e) => setFormData({ ...formData, education_placement: e.target.value })}
                />
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium">Current Placement</Label>
                <p className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded-md">
                  {childInfo?.education_placement || 'Not specified'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">EHCP Targets Linked</Label>
                <p className="text-xs text-muted-foreground">
                  Education, Health and Care Plan targets integration
                </p>
              </div>
              {isEditing ? (
                <Switch
                  checked={formData.ehcp_targets_linked}
                  onCheckedChange={(checked) => setFormData({ ...formData, ehcp_targets_linked: checked })}
                />
              ) : (
                <Badge variant={childInfo?.ehcp_targets_linked ? "default" : "secondary"}>
                  {childInfo?.ehcp_targets_linked ? "Linked" : "Not Linked"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Daily Learning Goals
            </CardTitle>
            <CardDescription>Current learning objectives and targets</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="daily_learning_goals">Learning Goals</Label>
                <Textarea
                  id="daily_learning_goals"
                  placeholder="Describe daily learning goals and objectives..."
                  value={formData.daily_learning_goals}
                  onChange={(e) => setFormData({ ...formData, daily_learning_goals: e.target.value })}
                  className="min-h-32"
                />
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium">Current Goals</Label>
                <p className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded-md min-h-32">
                  {childInfo?.daily_learning_goals || 'No goals specified'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Independence Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Independence Skills
            </CardTitle>
            <CardDescription>Skills development for independent living</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="independence_skills">Independence Skills</Label>
                <Textarea
                  id="independence_skills"
                  placeholder="Document independence skills being developed..."
                  value={formData.independence_skills}
                  onChange={(e) => setFormData({ ...formData, independence_skills: e.target.value })}
                  className="min-h-32"
                />
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium">Current Focus Areas</Label>
                <p className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded-md min-h-32">
                  {childInfo?.independence_skills || 'No skills documented'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Skills Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Social Skills Development
            </CardTitle>
            <CardDescription>Social interaction and communication skills</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="social_skills_development">Social Skills Development</Label>
                <Textarea
                  id="social_skills_development"
                  placeholder="Outline social skills development activities and goals..."
                  value={formData.social_skills_development}
                  onChange={(e) => setFormData({ ...formData, social_skills_development: e.target.value })}
                  className="min-h-32"
                />
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium">Development Areas</Label>
                <p className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded-md min-h-32">
                  {childInfo?.social_skills_development || 'No social skills development documented'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Development Progress Summary</CardTitle>
            <CardDescription>
              Overall progress tracking and key milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Badge variant={childInfo?.ehcp_targets_linked ? "default" : "secondary"}>
                  EHCP Integration
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {childInfo?.ehcp_targets_linked ? 
                    "Education plan is integrated with care planning" : 
                    "EHCP targets need to be linked to care plan"
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Badge variant={childInfo?.daily_learning_goals ? "default" : "outline"}>
                  Learning Goals
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {childInfo?.daily_learning_goals ? 
                    "Daily learning objectives are defined" : 
                    "Learning goals need to be established"
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Badge variant={childInfo?.independence_skills ? "default" : "outline"}>
                  Independence Skills
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {childInfo?.independence_skills ? 
                    "Independence skills development is documented" : 
                    "Independence skills development needs documentation"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}