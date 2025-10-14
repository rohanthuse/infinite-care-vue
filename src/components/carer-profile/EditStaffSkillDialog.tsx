import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useUpdateStaffSkill, StaffSkill } from "@/hooks/useStaffSkills";

interface EditStaffSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: StaffSkill | null;
}

const proficiencyLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

export const EditStaffSkillDialog: React.FC<EditStaffSkillDialogProps> = ({
  open,
  onOpenChange,
  skill
}) => {
  const [proficiencyLevel, setProficiencyLevel] = useState<string>('intermediate');
  const [verified, setVerified] = useState<boolean>(false);
  const [lastAssessed, setLastAssessed] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const updateSkillMutation = useUpdateStaffSkill();

  useEffect(() => {
    if (skill) {
      setProficiencyLevel(skill.proficiency_level);
      setVerified(skill.verified);
      setLastAssessed(skill.last_assessed || '');
      setNotes(skill.notes || '');
    }
  }, [skill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!skill) return;

    try {
      await updateSkillMutation.mutateAsync({
        id: skill.id,
        updates: {
          proficiency_level: proficiencyLevel as any,
          verified,
          last_assessed: lastAssessed || null,
          notes: notes || null
        }
      });

      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (!skill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Skill</DialogTitle>
          <DialogDescription>
            Update your proficiency level and details for {skill.skills?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skill-name" className="text-right">
                Skill
              </Label>
              <Input
                id="skill-name"
                value={skill.skills?.name || ''}
                disabled
                className="col-span-3 bg-muted"
              />
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
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last-assessed" className="text-right">
                Last Assessed
              </Label>
              <Input
                id="last-assessed"
                type="date"
                value={lastAssessed}
                onChange={(e) => setLastAssessed(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Verified</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={verified}
                  onCheckedChange={(checked) => setVerified(checked as boolean)}
                />
                <Label htmlFor="verified" className="text-sm font-normal">
                  This skill has been officially verified/certified
                </Label>
              </div>
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
                placeholder="Add any additional notes (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSkillMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateSkillMutation.isPending}
            >
              {updateSkillMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
