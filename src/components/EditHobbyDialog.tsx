
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Hobby {
  id: string;
  title: string;
  status: string;
}

interface EditHobbyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hobby: Hobby | null;
}

export function EditHobbyDialog({ isOpen, onClose, hobby }: EditHobbyDialogProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Active");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (hobby) {
      setTitle(hobby.title);
      setStatus(hobby.status);
    }
  }, [hobby]);

  const { mutate: updateHobby, isPending } = useMutation({
    mutationFn: async (updatedHobby: { title: string; status: string; }) => {
      if (!hobby) return;
      const { error } = await supabase
        .from('hobbies')
        .update(updatedHobby)
        .eq('id', hobby.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Close dialog first to remove overlay
      onClose();
      
      toast({
        title: "Hobby updated",
        description: `${title} has been updated successfully`,
      });
      
      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      // Delay query invalidations to prevent race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['hobbies'] });
      }, 300);
    },
    onError: (error) => {
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
    
    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Please provide a title for the hobby",
        variant: "destructive",
      });
      return;
    }
    
    updateHobby({ title, status });
  };

  if (!hobby) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Hobby</DialogTitle>
          <DialogDescription>
            Update the details for the hobby
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
