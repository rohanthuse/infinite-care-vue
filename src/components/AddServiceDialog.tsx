
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

import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const { mutate: addService, isPending } = useMutation({
    mutationFn: async (newService: { 
      title: string; 
      category: string; 
      description: string; 
      organization_id?: string;
    }) => {
      console.log('[AddServiceDialog] Creating service with data:', newService);
      const { error } = await supabase.from('services').insert([newService]);
      if (error) {
        console.error('[AddServiceDialog] Error creating service:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Service added",
        description: `${title} has been added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['services', organization?.id] });
      queryClient.invalidateQueries({ queryKey: ['organization-services', organization?.id] });
      // Reset form and close dialog
      setTitle("");
      setCategory("");
      setDescription("");
      onClose();
    },
    onError: (error: any) => {
      console.error('[AddServiceDialog] Service creation failed:', error);
      
      // Parse the error for user-friendly messages
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      // Check for duplicate key violation (PostgreSQL error code 23505)
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        if (error.message?.includes('services_title')) {
          errorMessage = `A service with the title "${title.trim()}" already exists in your organisation. Please choose a different title.`;
        } else {
          errorMessage = "This service already exists. Please check your input.";
        }
      } else if (error.message) {
        // Clean up technical error messages
        errorMessage = error.message.replace(/^(.*?):\s*/, '');
      }
      
      toast({
        title: "Failed to add service",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle) {
      toast({
        title: "Title required",
        description: "Please enter a service title.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedTitle.length < 2) {
      toast({
        title: "Title too short",
        description: "Service title must be at least 2 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a service category.",
        variant: "destructive",
      });
      return;
    }

    if (!organization?.id) {
      toast({
        title: "Organisation required",
        description: "Unable to determine organisation context.",
        variant: "destructive",
      });
      return;
    }
    
    const serviceData = {
      title: trimmedTitle,
      category,
      description: description.trim(),
      organization_id: organization.id
    };

    console.log('[AddServiceDialog] Submitting service data:', serviceData);
    addService(serviceData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold text-foreground">Add New Service</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the details for the new service
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
              <Label htmlFor="title" className="text-right text-foreground">
                Title<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3 h-10 rounded-md"
                placeholder="E.g., Medication Assistance, Meal Preparation..."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-foreground">
                Category<span className="text-destructive ml-1">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="col-span-3 h-10 rounded-md">
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
              <Label htmlFor="description" className="text-right text-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 min-h-[100px] rounded-md"
                placeholder="Provide a description of the service..."
              />
            </div>
            
          </div>
          
          <DialogFooter className="py-4 border-t mt-4 bg-muted/30 -mx-6 px-6">
            <div className="flex justify-end gap-2 w-full">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md" disabled={isPending}>
                 {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Service'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
