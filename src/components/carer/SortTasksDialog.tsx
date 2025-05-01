
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type SortOption = {
  field: string;
  direction: "asc" | "desc";
  label: string;
};

interface SortTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
}

const sortOptions: SortOption[] = [
  { field: "dueDate", direction: "asc", label: "Due Date (Earliest First)" },
  { field: "dueDate", direction: "desc", label: "Due Date (Latest First)" },
  { field: "priority", direction: "desc", label: "Priority (High to Low)" },
  { field: "priority", direction: "asc", label: "Priority (Low to High)" },
  { field: "title", direction: "asc", label: "Title (A-Z)" },
  { field: "title", direction: "desc", label: "Title (Z-A)" },
  { field: "category", direction: "asc", label: "Category (A-Z)" },
  { field: "category", direction: "desc", label: "Category (Z-A)" }
];

const SortTasksDialog: React.FC<SortTasksDialogProps> = ({ 
  open, 
  onOpenChange, 
  selectedSort, 
  onSelectSort 
}) => {
  const [tempSort, setTempSort] = React.useState<string>(
    `${selectedSort.field}-${selectedSort.direction}`
  );

  const handleApply = () => {
    const [field, direction] = tempSort.split("-") as [string, "asc" | "desc"];
    const sortOption = sortOptions.find(
      option => option.field === field && option.direction === direction
    );
    if (sortOption) {
      onSelectSort(sortOption);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sort Tasks</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup 
            value={tempSort} 
            onValueChange={setTempSort}
            className="space-y-3"
          >
            {sortOptions.map((option) => (
              <div key={`${option.field}-${option.direction}`} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={`${option.field}-${option.direction}`} 
                  id={`${option.field}-${option.direction}`} 
                />
                <Label htmlFor={`${option.field}-${option.direction}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SortTasksDialog;
