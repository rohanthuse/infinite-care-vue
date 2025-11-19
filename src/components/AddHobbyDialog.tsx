
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
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export function AddHobbyDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const { mutate: addHobby, isPending } = useMutation({
    mutationFn: async (newHobby: { title: string; status: string; organization_id?: string }) => {
      const { data, error } = await supabase.from('hobbies').insert([newHobby]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Hobby added",
        description: `${title} has been added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['hobbies', organization?.id] });
      setTitle("");
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add hobby",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Please enter a title for the hobby",
        variant: "destructive",
      });
      return;
    }

    addHobby({ title, status: "Active", organization_id: organization?.id });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 rounded-full">
          <Plus className="mr-1.5 h-4 w-4" /> New Hobby
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Hobby</DialogTitle>
          <DialogDescription>
            Enter the details for the new hobby
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="E.g., Swimming, Reading..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Hobby'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
