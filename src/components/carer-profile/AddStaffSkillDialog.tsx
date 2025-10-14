import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAddStaffSkill, useAvailableSkills } from "@/hooks/useStaffSkills";
import { useToast } from "@/hooks/use-toast";

interface AddStaffSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
}

const proficiencyLevels = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting to learn' },
  { value: 'basic', label: 'Basic', description: 'Can perform with guidance' },
  { value: 'intermediate', label: 'Intermediate', description: 'Can work independently' },
  { value: 'advanced', label: 'Advanced', description: 'High proficiency' },
  { value: 'expert', label: 'Expert', description: 'Master level, can train others' }
];

export const AddStaffSkillDialog: React.FC<AddStaffSkillDialogProps> = ({
  open,
  onOpenChange,
  staffId
}) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [proficiencyLevel, setProficiencyLevel] = useState<string>('intermediate');
  const [notes, setNotes] = useState<string>('');
  const { toast } = useToast();

  const { data: availableSkills = [], isLoading: skillsLoading } = useAvailableSkills();
  const addSkillMutation = useAddStaffSkill();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSkillId) {
      toast({
        title: 'Skill required',
        description: 'Please select a skill from the list.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await addSkillMutation.mutateAsync({
        staff_id: staffId,
        skill_id: selectedSkillId,
        proficiency_level: proficiencyLevel,
        notes: notes || undefined
      });

      setSelectedSkillId('');
      setProficiencyLevel('intermediate');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
          <DialogDescription>
            Select a skill from the master list and set your proficiency level
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skill" className="text-right">
                Skill
              </Label>
              <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                <SelectTrigger id="skill" className="col-span-3">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {skillsLoading ? (
                    <div className="p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    availableSkills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="proficiency" className="text-right">
                Proficiency
              </Label>
              <Select value={proficiencyLevel} onValueChange={setProficiencyLevel}>
                <SelectTrigger id="proficiency" className="col-span-3">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {proficiencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-muted-foreground">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3 min-h-[100px]"
                placeholder="Add any additional notes about your experience with this skill (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addSkillMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addSkillMutation.isPending}
            >
              {addSkillMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Skill'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
