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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/contexts/TenantContext";

interface Skill {
  id: string;
  name: string;
  explanation: string | null;
  status: string;
}

interface EditSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill | null;
}

export function EditSkillDialog({ isOpen, onClose, skill }: EditSkillDialogProps) {
  const [name, setName] = useState("");
  const [explanation, setExplanation] = useState("");
  const [status, setStatus] = useState("Active");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setExplanation(skill.explanation || "");
      setStatus(skill.status);
    }
  }, [skill]);

  const { mutate: updateSkill, isPending } = useMutation({
    mutationFn: async (updatedSkill: { name: string; explanation: string; status: string; }) => {
      if (!skill) return;
      const { error } = await supabase
        .from('skills')
        .update(updatedSkill)
        .eq('id', skill.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Close dialog first to remove overlay
      onClose();
      
      toast({
        title: "Skill updated",
        description: `${name} has been updated successfully`,
      });
      
      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      // Delay query invalidations to prevent race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['skills', organization?.id] });
      }, 300);
    },
    onError: (error: any) => {
      onClose();
      
      // Clean up document body on error too
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please provide a name for the skill",
        variant: "destructive",
      });
      return;
    }
    
    updateSkill({ name, explanation, status });
  };

  if (!skill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Skill</DialogTitle>
          <DialogDescription>
            Update the details for the skill
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="E.g., Communication"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="explanation" className="text-right">
                Explanation
              </Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="col-span-3 min-h-[100px]"
                placeholder="Provide an explanation (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
