
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
import { useToast } from "@/hooks/use-toast";

interface AddMedicalConditionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (condition: any) => void;
  categories: { id: number; name: string; status: string }[];
  isCategory: boolean;
}

export function AddMedicalConditionDialog({ 
  isOpen, 
  onClose,
  onAdd,
  categories,
  isCategory
}: AddMedicalConditionDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [fieldCaption, setFieldCaption] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCategory) {
      if (!title.trim()) {
        toast({
          title: "Name is required",
          description: "Please enter a name for the category",
          variant: "destructive",
        });
        return;
      }
      
      onAdd({ name: title, status: "Active" });
      toast({
        title: "Category added",
        description: `${title} has been added successfully`,
      });
    } else {
      if (!title.trim()) {
        toast({
          title: "Title is required",
          description: "Please enter a title for the condition",
          variant: "destructive",
        });
        return;
      }
      
      if (!category.trim()) {
        toast({
          title: "Category is required",
          description: "Please select a category for the condition",
          variant: "destructive",
        });
        return;
      }
      
      onAdd({ 
        title, 
        category, 
        fieldCaption, 
        status: "Active" 
      });
      
      toast({
        title: "Condition added",
        description: `${title} has been added successfully`,
      });
    }
    
    setTitle("");
    setCategory("");
    setFieldCaption("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New {isCategory ? "Category" : "Condition"}</DialogTitle>
          <DialogDescription>
            Enter the details for the new {isCategory ? "category" : "condition"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                {isCategory ? "Name" : "Title"}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder={isCategory ? "E.g., Medical Health Conditions..." : "E.g., Diabetes, Arthritis..."}
              />
            </div>
            
            {!isCategory && (
              <>
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
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fieldCaption" className="text-right">
                    Field Caption
                  </Label>
                  <Input
                    id="fieldCaption"
                    value={fieldCaption}
                    onChange={(e) => setFieldCaption(e.target.value)}
                    className="col-span-3"
                    placeholder="Optional field caption..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Add {isCategory ? "Category" : "Condition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
