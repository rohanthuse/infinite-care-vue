
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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddWorkTypeDialogProps {
  onAdd: (workType: { title: string; status: string }) => void;
}

export function AddWorkTypeDialog({ onAdd }: AddWorkTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Please enter a title for the work type",
        variant: "destructive",
      });
      return;
    }

    onAdd({ title, status: "Active" });
    setTitle("");
    setOpen(false);
    toast({
      title: "Work Type added",
      description: `${title} has been added successfully`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 rounded-full">
          <Plus className="mr-1.5 h-4 w-4" /> New Type of Work
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Type of Work</DialogTitle>
          <DialogDescription>
            Enter the details for the new work type
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
                placeholder="E.g., Night Shift, Companionship..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Work Type
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
