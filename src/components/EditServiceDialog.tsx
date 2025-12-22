
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

import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface Service {
  id: string;
  title: string;
  category: string;
  description: string | null;
}

interface EditServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
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

export function EditServiceDialog({ isOpen, onClose, service }: EditServiceDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  useEffect(() => {
    if (service) {
      setTitle(service.title);
      setCategory(service.category);
      setDescription(service.description || "");
    }
  }, [service]);

  const { mutate: updateService, isPending } = useMutation({
    mutationFn: async (updatedService: Omit<Service, 'id'>) => {
      if (!service) return;
      const { error } = await supabase
        .from('services')
        .update(updatedService)
        .eq('id', service.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Close dialog first to remove overlay
      onClose();
      
      toast({
        title: "Service updated",
        description: `${title} has been updated successfully`,
      });
      
      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      // Delay query invalidations to prevent race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['services', organization?.id] });
        queryClient.invalidateQueries({ queryKey: ['branch-services'] });
        queryClient.invalidateQueries({ queryKey: ['organization-services', organization?.id] });
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
    
    if (!title.trim() || !category.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please provide a title and category.",
        variant: "destructive",
      });
      return;
    }
    
    updateService({ title, category, description });
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-800">Edit Service</DialogTitle>
          <DialogDescription className="text-gray-500">
            Update the details for the service
          </DialogDescription>
          <Button 
            className="absolute right-4 top-4 rounded-full p-2 h-auto" 
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="px-6">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-gray-700">
                Title<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3 h-10 rounded-md border-gray-300"
                placeholder="E.g., Medication Assistance..."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-gray-700">
                Category<span className="text-red-500 ml-1">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="col-span-3 h-10 rounded-md border-gray-300">
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
              <Label htmlFor="description" className="text-right text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 min-h-[100px] rounded-md border-gray-300"
                placeholder="Provide a description of the service..."
              />
            </div>
            
          </div>
          
          <DialogFooter className="py-4 border-t mt-4 bg-gray-50/50 -mx-6 px-6">
            <div className="flex justify-end gap-2 w-full">
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-200 rounded-md" disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-md" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
