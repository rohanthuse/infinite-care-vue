
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";


interface AddMedicalConditionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; status: string }[];
  isCategory: boolean;
}

export function AddMedicalConditionDialog({ 
  isOpen, 
  onClose,
  categories,
  isCategory
}: AddMedicalConditionDialogProps) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fieldCaption, setFieldCaption] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: addCategory, isPending: isAddingCategory } = useMutation({
    mutationFn: async (newCategory: { name: string; status: string }) => {
      const { data, error } = await supabase.from('medical_categories').insert([newCategory]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Category added",
        description: `${data[0].name} has been added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['medical_categories'] });
      setTitle("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add category",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const { mutate: addCondition, isPending: isAddingCondition } = useMutation({
      mutationFn: async (newCondition: { title: string; category_id: string; field_caption: string | null; status: string }) => {
          const { data, error } = await supabase.from('medical_conditions').insert([newCondition]).select();
          if (error) throw error;
          return data;
      },
      onSuccess: (data: any) => {
          toast({
              title: "Condition added",
              description: `${data[0].title} has been added successfully`,
          });
          queryClient.invalidateQueries({ queryKey: ['medical_conditions'] });
          setTitle("");
          setCategoryId("");
          setFieldCaption("");
          onClose();
      },
      onError: (error: any) => {
          toast({
              title: "Failed to add condition",
              description: error.message,
              variant: "destructive",
          });
      }
  });

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
      
      addCategory({ name: title, status: "Active" });
    } else {
      if (!title.trim()) {
        toast({
          title: "Title is required",
          description: "Please enter a title for the condition",
          variant: "destructive",
        });
        return;
      }
      
      if (!categoryId.trim()) {
        toast({
          title: "Category is required",
          description: "Please select a category for the condition",
          variant: "destructive",
        });
        return;
      }
      
      addCondition({ 
        title, 
        category_id: categoryId, 
        field_caption: fieldCaption || null, 
        status: "Active" 
      });
    }
  };

  const isPending = isAddingCategory || isAddingCondition;

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
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="category" className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : `Add ${isCategory ? "Category" : "Condition"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

