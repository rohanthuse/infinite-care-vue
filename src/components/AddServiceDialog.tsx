
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AddServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  "Daily Support",
  "Medical",
  "Mobility",
  "Family Support",
  "Mental Wellbeing",
  "Emergency",
  "Overnight",
  "Specialized Care",
  "Physical Support",
  "Long-term Support"
];

export function AddServiceDialog({ isOpen, onClose }: AddServiceDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isDoubleHanded, setIsDoubleHanded] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Please enter a title for the service",
        variant: "destructive",
      });
      return;
    }
    
    if (!category.trim()) {
      toast({
        title: "Category is required",
        description: "Please select a category for the service",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Service added",
      description: `${title} has been added successfully`,
    });
    
    // Reset form and close dialog
    setTitle("");
    setCategory("");
    setDescription("");
    setIsDoubleHanded(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Service</DialogTitle>
          <DialogDescription>
            Enter the details for the new service
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
                placeholder="E.g., Medication Assistance, Meal Preparation..."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
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
                placeholder="Provide a description of the service..."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doubleHanded" className="text-right">
                Double Handed
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="doubleHanded"
                  checked={isDoubleHanded}
                  onCheckedChange={setIsDoubleHanded}
                />
                <Label htmlFor="doubleHanded" className="text-sm text-gray-500">
                  {isDoubleHanded ? "Yes" : "No"}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
