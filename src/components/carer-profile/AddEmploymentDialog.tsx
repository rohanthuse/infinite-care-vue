import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { X, Plus } from "lucide-react";
import { NewEmploymentHistory } from "@/hooks/useStaffEmploymentHistory";

interface AddEmploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewEmploymentHistory) => void;
  isLoading: boolean;
}

interface FormData {
  position: string;
  employer: string;
  location: string;
  start_date: Date;
  end_date: Date | null;
  is_current: boolean;
}

export const AddEmploymentDialog: React.FC<AddEmploymentDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [newResponsibility, setNewResponsibility] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      is_current: false,
    },
  });

  const isCurrent = watch("is_current");
  const startDate = watch("start_date");
  const endDate = watch("end_date");

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      setResponsibilities([...responsibilities, newResponsibility.trim()]);
      setNewResponsibility("");
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: FormData) => {
    const employmentData: NewEmploymentHistory = {
      position: data.position,
      employer: data.employer,
      location: data.location,
      start_date: data.start_date.toISOString().split('T')[0],
      end_date: data.is_current ? null : data.end_date?.toISOString().split('T')[0] || null,
      status: data.is_current ? 'current' : 'completed',
      responsibilities: responsibilities,
    };
    
    onSubmit(employmentData);
    reset();
    setResponsibilities([]);
    setNewResponsibility("");
  };

  const handleClose = () => {
    reset();
    setResponsibilities([]);
    setNewResponsibility("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employment Position</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                {...register("position", { 
                  required: "Position is required",
                  minLength: { value: 2, message: "Position must be at least 2 characters" }
                })}
                placeholder="e.g., Senior Care Assistant"
                disabled={isLoading}
              />
              {errors.position && (
                <p className="text-sm text-destructive">{errors.position.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employer">Employer *</Label>
              <Input
                id="employer"
                {...register("employer", { 
                  required: "Employer is required",
                  minLength: { value: 2, message: "Employer must be at least 2 characters" }
                })}
                placeholder="e.g., Healthcare Ltd"
                disabled={isLoading}
              />
              {errors.employer && (
                <p className="text-sm text-destructive">{errors.employer.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              {...register("location", { 
                required: "Location is required",
                minLength: { value: 2, message: "Location must be at least 2 characters" }
              })}
              placeholder="e.g., London, UK"
              disabled={isLoading}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <EnhancedDatePicker
                value={startDate}
                onChange={(date) => setValue("start_date", date || new Date())}
                placeholder="Select start date"
                disabled={(date) => date > new Date()}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date {!isCurrent && "*"}</Label>
              <EnhancedDatePicker
                value={endDate || undefined}
                onChange={(date) => setValue("end_date", date || null)}
                placeholder="Select end date"
                disabled={isCurrent ? undefined : (date) => {
                  if (startDate && date < startDate) return true;
                  if (date > new Date()) return true;
                  return false;
                }}
                className={isCurrent ? "opacity-50" : ""}
              />
              {!isCurrent && errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_current"
              checked={isCurrent}
              onCheckedChange={(checked) => {
                setValue("is_current", checked as boolean);
                if (checked) {
                  setValue("end_date", null);
                }
              }}
              disabled={isLoading}
            />
            <Label htmlFor="is_current" className="cursor-pointer font-normal">
              This is my current position
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Key Responsibilities</Label>
            <div className="flex gap-2">
              <Input
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                placeholder="Add a responsibility"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddResponsibility();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddResponsibility}
                disabled={!newResponsibility.trim() || isLoading}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {responsibilities.length > 0 && (
              <ul className="space-y-2 mt-3">
                {responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start gap-2 p-2 bg-muted rounded-md">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                    <span className="flex-1 text-sm">{responsibility}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveResponsibility(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !startDate || (!isCurrent && !endDate)}>
              {isLoading ? "Adding..." : "Add Position"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
