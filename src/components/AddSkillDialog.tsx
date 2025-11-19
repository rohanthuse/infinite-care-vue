
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export function AddSkillDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [explanation, setExplanation] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const { mutate: addSkill, isPending } = useMutation({
    mutationFn: async (newSkill: { name: string; explanation: string; status: string; organization_id?: string }) => {
      const { data, error } = await supabase.from('skills').insert([newSkill]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Skill added",
        description: `${name} has been added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['skills', organization?.id] });
      setName("");
      setExplanation("");
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add skill",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a name for the skill",
        variant: "destructive",
      });
      return;
    }

    addSkill({ name, explanation, status: "Active", organization_id: organization?.id });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 rounded-full">
          <Plus className="mr-1.5 h-4 w-4" /> New Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Skill</DialogTitle>
          <DialogDescription>
            Enter the details for the new skill
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
                placeholder="E.g., Communication, Patience..."
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
                placeholder="Provide an explanation for this skill (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Skill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
