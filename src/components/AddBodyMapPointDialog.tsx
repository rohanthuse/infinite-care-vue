
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AddBodyMapPointDialogProps {
  onAdd: (point: { letter: string; title: string; color: string }) => void;
}

export function AddBodyMapPointDialog({ onAdd }: AddBodyMapPointDialogProps) {
  const [open, setOpen] = useState(false);
  const [letter, setLetter] = useState("");
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#ff0000");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letter.trim()) {
      toast({
        title: "Letter is required",
        description: "Please enter a letter for the body map point",
        variant: "destructive",
      });
      return;
    }
    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Please enter a title for the body map point",
        variant: "destructive",
      });
      return;
    }

    onAdd({ letter, title, color });
    setLetter("");
    setTitle("");
    setColor("#ff0000");
    setOpen(false);
    toast({
      title: "Body Map Point added",
      description: `${letter} - ${title} has been added successfully`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 rounded-full">
          <Plus className="mr-1.5 h-4 w-4" /> New Body Map Point
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Body Map Point</DialogTitle>
          <DialogDescription>
            Enter the details for the new body map point
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="letter" className="text-right">
                Letter
              </Label>
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
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="E.g., Bruising, Burns..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Point
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
