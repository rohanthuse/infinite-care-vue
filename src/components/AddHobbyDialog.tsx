
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
import { toast } from "sonner";

export function AddHobbyDialog({
  open,
  onOpenChange,
  onAddHobby,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddHobby: (hobby: string) => void;
}) {
  const [hobbyName, setHobbyName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hobbyName.trim()) {
      onAddHobby(hobbyName);
      setHobbyName("");
      onOpenChange(false);
      toast.success("Hobby added successfully");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Hobby</DialogTitle>
          <DialogDescription>
            Enter the name of the hobby to add to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hobby-name" className="text-right">
                Hobby Name
              </Label>
              <Input
                id="hobby-name"
                value={hobbyName}
                onChange={(e) => setHobbyName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Hobby</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
