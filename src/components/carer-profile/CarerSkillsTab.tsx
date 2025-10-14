import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, Plus, Star, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { useStaffSkills, useDeleteStaffSkill } from "@/hooks/useStaffSkills";
import { AddStaffSkillDialog } from "./AddStaffSkillDialog";
import { EditStaffSkillDialog } from "./EditStaffSkillDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CarerSkillsTabProps {
  carerId: string;
}

export const CarerSkillsTab: React.FC<CarerSkillsTabProps> = ({ carerId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [deletingSkill, setDeletingSkill] = useState<any>(null);

  const { data: staffSkills = [], isLoading } = useStaffSkills(carerId);
  const deleteSkillMutation = useDeleteStaffSkill();

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return "text-green-600 bg-green-50";
      case 'advanced': return "text-blue-600 bg-blue-50";
      case 'intermediate': return "text-yellow-600 bg-yellow-50";
      case 'basic': return "text-orange-600 bg-orange-50";
      case 'beginner': return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getSkillLevelText = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const getLevelNumber = (level: string) => {
    const mapping: { [key: string]: number } = {
      'beginner': 1,
      'basic': 2,
      'intermediate': 3,
      'advanced': 4,
      'expert': 5
    };
    return mapping[level] || 3;
  };

  const filteredSkills = staffSkills.filter(skill =>
    skill.skills?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSkills = staffSkills.length;
  const verifiedSkills = staffSkills.filter(skill => skill.verified).length;
  const averageLevel = staffSkills.length > 0
    ? staffSkills.reduce((acc, skill) => acc + getLevelNumber(skill.proficiency_level), 0) / staffSkills.length
    : 0;

  const handleDeleteSkill = async () => {
    if (!deletingSkill) return;

    try {
      await deleteSkillMutation.mutateAsync(deletingSkill.id);
      setDeletingSkill(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Skills Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalSkills}</div>
              <div className="text-sm text-muted-foreground">Total Skills</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{verifiedSkills}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{averageLevel.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Level</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {totalSkills > 0 ? Math.round((verifiedSkills / totalSkills) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Verified Rate</div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowAddSkill(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>

          {filteredSkills.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">
                {searchTerm ? 'No skills found' : 'No skills yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Try adjusting your search term'
                  : 'Start by adding your first skill'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddSkill(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Skill
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSkills.map((staffSkill) => {
                const levelNum = getLevelNumber(staffSkill.proficiency_level);
                
                return (
                  <div
                    key={staffSkill.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getSkillLevelColor(staffSkill.proficiency_level)}`}>
                        <Award className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{staffSkill.skills?.name}</h4>
                          {staffSkill.verified && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>Level:</span>
                            <div className="flex">
                              {[1,2,3,4,5].map(star => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= levelNum
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${getSkillLevelColor(staffSkill.proficiency_level)}`}>
                              {getSkillLevelText(staffSkill.proficiency_level)}
                            </span>
                          </div>
                          
                          {staffSkill.last_assessed && (
                            <span>
                              Last assessed: {new Date(staffSkill.last_assessed).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {staffSkill.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{staffSkill.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSkill(staffSkill)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeletingSkill(staffSkill)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddStaffSkillDialog
        open={showAddSkill}
        onOpenChange={setShowAddSkill}
        staffId={carerId}
      />

      {editingSkill && (
        <EditStaffSkillDialog
          open={!!editingSkill}
          onOpenChange={(open) => {
            if (!open) setEditingSkill(null);
          }}
          skill={editingSkill}
        />
      )}

      <AlertDialog
        open={!!deletingSkill}
        onOpenChange={(open) => {
          if (!open) setDeletingSkill(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deletingSkill?.skills?.name}" from the profile?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSkillMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSkill}
              disabled={deleteSkillMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteSkillMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Skill'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};