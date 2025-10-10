
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface EditMedicalConditionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  condition: any;
}

const fetchCategories = async () => {
    const { data, error } = await supabase.from('medical_categories').select('*').order('name');
    if (error) throw error;
    return data;
};

export function EditMedicalConditionDialog({ isOpen, onClose, condition }: EditMedicalConditionDialogProps) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fieldCaption, setFieldCaption] = useState("");
  const [status, setStatus] = useState("Active");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
      queryKey: ['medical_categories'],
      queryFn: fetchCategories
  });

  useEffect(() => {
    if (condition) {
      setTitle(condition.title);
      setCategoryId(condition.category_id);
      setFieldCaption(condition.field_caption || "");
      setStatus(condition.status);
    }
  }, [condition]);

  const { mutate: updateCondition, isPending } = useMutation({
    mutationFn: async (updatedCondition: { title: string; category_id: string; field_caption: string; status: string }) => {
      const { error } = await supabase
        .from('medical_conditions')
        .update(updatedCondition)
        .eq('id', condition.id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Close dialog first to remove overlay
      onClose();
      
      toast({ title: "Condition updated successfully" });
      
      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      // Delay query invalidations to prevent race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['medical_conditions'] });
      }, 300);
    },
    onError: (error: any) => {
      onClose();
      
      // Clean up document body on error too
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({ title: "Failed to update condition", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) {
      toast({ title: "Title and Category are required", variant: "destructive" });
      return;
    }
    updateCondition({ title, category_id: categoryId, field_caption: fieldCaption, status });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Condition</DialogTitle>
          <DialogDescription>
            Update the details for this condition.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fieldCaption" className="text-right">Field Caption</Label>
              <Input
                id="fieldCaption"
                value={fieldCaption}
                onChange={(e) => setFieldCaption(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
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
