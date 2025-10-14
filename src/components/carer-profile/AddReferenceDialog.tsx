import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffReference } from "@/hooks/useStaffReferences";

interface AddReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<StaffReference, 'id' | 'staff_id' | 'created_at' | 'updated_at'>) => void;
  isLoading: boolean;
}

interface FormData {
  name: string;
  position: string;
  company: string;
  relationship: string;
  contact_date: string;
  rating: number;
  statement: string;
}

const relationshipOptions = [
  "Former Supervisor",
  "Direct Manager",
  "Colleague",
  "HR Manager",
  "Client",
  "Professional Contact"
];

export function AddReferenceDialog({ open, onOpenChange, onSubmit, isLoading }: AddReferenceDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [contactDate, setContactDate] = useState<Date | undefined>();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();

  const handleFormSubmit = (data: FormData) => {
    if (!contactDate) return;
    if (rating === 0) return;

    onSubmit({
      ...data,
      contact_date: contactDate.toISOString().split('T')[0],
      rating,
    });

    // Reset form
    reset();
    setRating(0);
    setContactDate(undefined);
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setRating(0);
      setContactDate(undefined);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Professional Reference</DialogTitle>
          <DialogDescription>
            Add a new professional reference to your profile. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register("name", { 
                  required: "Name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                  maxLength: { value: 100, message: "Name must be less than 100 characters" }
                })}
                placeholder="John Doe"
                disabled={isLoading}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                {...register("position", { 
                  required: "Position is required",
                  minLength: { value: 2, message: "Position must be at least 2 characters" }
                })}
                placeholder="Senior Care Manager"
                disabled={isLoading}
              />
              {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company/Organization *</Label>
              <Input
                id="company"
                {...register("company", { 
                  required: "Company is required",
                  minLength: { value: 2, message: "Company must be at least 2 characters" }
                })}
                placeholder="ABC Care Services"
                disabled={isLoading}
              />
              {errors.company && <p className="text-sm text-destructive">{errors.company.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship *</Label>
              <Input
                id="relationship"
                list="relationships"
                {...register("relationship", { required: "Relationship is required" })}
                placeholder="Select or type..."
                disabled={isLoading}
              />
              <datalist id="relationships">
                {relationshipOptions.map(option => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              {errors.relationship && <p className="text-sm text-destructive">{errors.relationship.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Date *</Label>
              <EnhancedDatePicker
                value={contactDate}
                onChange={setContactDate}
                placeholder="Select date"
                disabled={(date) => date > new Date()}
              />
              {!contactDate && <p className="text-sm text-destructive">Contact date is required</p>}
            </div>

            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex items-center gap-1 pt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={isLoading}
                    className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition-colors",
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-transparent text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating > 0 ? `${rating}/5` : "Select rating"}
                </span>
              </div>
              {rating === 0 && <p className="text-sm text-destructive">Rating is required</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statement">Reference Statement *</Label>
            <Textarea
              id="statement"
              {...register("statement", { 
                required: "Statement is required",
                minLength: { value: 50, message: "Statement must be at least 50 characters" },
                maxLength: { value: 2000, message: "Statement must be less than 2000 characters" }
              })}
              placeholder="Provide the reference statement or testimonial..."
              className="min-h-[120px]"
              disabled={isLoading}
            />
            {errors.statement && <p className="text-sm text-destructive">{errors.statement.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !contactDate || rating === 0}
            >
              {isLoading ? "Adding..." : "Add Reference"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
