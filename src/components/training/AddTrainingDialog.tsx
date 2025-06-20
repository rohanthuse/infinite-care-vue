
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrainingCategory } from "@/types/training";
import { toast } from "@/hooks/use-toast";

interface AddTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTraining: (trainingData: any) => void;
}

const AddTrainingDialog: React.FC<AddTrainingDialogProps> = ({
  open,
  onOpenChange,
  onAddTraining,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TrainingCategory>("core");
  const [description, setDescription] = useState("");
  const [validFor, setValidFor] = useState<number>(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a training title",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Error",
        description: "Please select a training category",
        variant: "destructive",
      });
      return;
    }

    const trainingData = {
      title: title.trim(),
      category,
      description: description.trim() || null,
      validFor,
    };

    onAddTraining(trainingData);
    
    // Reset form
    setTitle("");
    setCategory("core");
    setDescription("");
    setValidFor(12);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Training Course</DialogTitle>
          <DialogDescription>
            Create a new training course for your staff members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter training title"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category *
              </Label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as TrainingCategory)}
              >
                <SelectTrigger className="col-span-3" id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="specialized">Specialized</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Brief description of the training course"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="validFor" className="text-right">
                Valid For (months)
              </Label>
              <Input
                id="validFor"
                type="number"
                min={1}
                max={60}
                value={validFor}
                onChange={(e) => setValidFor(parseInt(e.target.value) || 12)}
                className="col-span-3"
                placeholder="12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Training Course</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTrainingDialog;
