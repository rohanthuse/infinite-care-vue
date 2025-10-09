
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ParameterItem } from "./ParameterTable";

interface EditBodyMapPointDialogProps {
  isOpen: boolean;
  onClose: () => void;
  point: ParameterItem | null;
}

const colors = [
    { value: "#ff0000", label: "Red" },
    { value: "#ff00ff", label: "Pink" },
    { value: "#00ff00", label: "Green" },
    { value: "#00ff80", label: "Sea Green" },
    { value: "#0000ff", label: "Blue" },
    { value: "#ff8000", label: "Orange" },
    { value: "#8000ff", label: "Purple" },
    { value: "#ffff00", label: "Yellow" },
];

export function EditBodyMapPointDialog({ isOpen, onClose, point }: EditBodyMapPointDialogProps) {
  const [letter, setLetter] = useState("");
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#ff0000");
  const [status, setStatus] = useState("Active");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (point) {
      setLetter(point.letter);
      setTitle(point.title);
      setColor(point.color);
      setStatus(point.status);
    }
  }, [point]);

  const { mutate: updatePoint, isPending } = useMutation({
    mutationFn: async (updatedPoint: { letter: string; title: string; color: string; status: string }) => {
      if (!point) return;
      const { error } = await supabase
        .from('body_map_points')
        .update(updatedPoint)
        .eq('id', String(point.id));
      if (error) throw error;
    },
    onSuccess: () => {
      // Close dialog first to remove overlay
      onClose();
      
      toast({ title: "Body Map Point updated successfully" });
      
      // Delay query invalidations to prevent race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['body_map_points'] });
      }, 100);
    },
    onError: (error: any) => {
      onClose();
      toast({ title: "Failed to update point", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letter.trim()) {
      toast({ title: "Letter is required", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    updatePoint({ letter, title, color, status });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Body Map Point</DialogTitle>
          <DialogDescription>
            Update the details for this body map point.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="letter" className="text-right">Letter</Label>
              <Input
                id="letter"
                value={letter}
                onChange={(e) => setLetter(e.target.value.toUpperCase())}
                className="col-span-3"
                maxLength={1}
                placeholder="E.g., A, B, C..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="E.g., Bruising, Burns..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Color</Label>
              <div className="col-span-3 flex gap-2 items-center">
                <div
                  className="h-8 w-12 rounded border border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-between border-gray-200"
                    >
                      {color}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {colors.map((colorOption) => (
                        <Button
                          key={colorOption.value}
                          variant="outline"
                          className={cn(
                            "justify-start gap-2 border-gray-200",
                            color === colorOption.value && "border-blue-600 ring-1 ring-blue-200"
                          )}
                          onClick={() => {
                            setColor(colorOption.value);
                            setPopoverOpen(false);
                          }}
                        >
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: colorOption.value }}
                          />
                          <span>{colorOption.label}</span>
                          {color === colorOption.value && (
                            <Check className="ml-auto h-4 w-4 text-blue-600" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
