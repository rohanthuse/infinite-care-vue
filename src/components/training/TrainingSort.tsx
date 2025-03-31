
import React from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal } from "lucide-react";

export type SortOption = {
  field: "name" | "completion" | "category" | "dueDate" | "status";
  direction: "asc" | "desc";
}

interface TrainingSortProps {
  onSort: (option: SortOption) => void;
  currentSort: SortOption;
}

const TrainingSort: React.FC<TrainingSortProps> = ({ onSort, currentSort }) => {
  const [open, setOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortOption["field"]>(currentSort.field);
  const [sortDirection, setSortDirection] = React.useState<SortOption["direction"]>(currentSort.direction);

  const handleApply = () => {
    onSort({ field: sortBy, direction: sortDirection });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 whitespace-nowrap">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Sort</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Sort By</h4>
          <RadioGroup 
            value={sortBy} 
            onValueChange={(value) => setSortBy(value as SortOption["field"])}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="name" id="sort-name" />
              <Label htmlFor="sort-name">Staff Name</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="completion" id="sort-completion" />
              <Label htmlFor="sort-completion">Completion Rate</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dueDate" id="sort-due-date" />
              <Label htmlFor="sort-due-date">Due Date</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="status" id="sort-status" />
              <Label htmlFor="sort-status">Status</Label>
            </div>
          </RadioGroup>
          
          <div className="pt-2">
            <h4 className="font-medium mb-2">Direction</h4>
            <RadioGroup 
              value={sortDirection} 
              onValueChange={(value) => setSortDirection(value as SortOption["direction"])}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asc" id="sort-asc" />
                <Label htmlFor="sort-asc">Ascending</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="desc" id="sort-desc" />
                <Label htmlFor="sort-desc">Descending</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button onClick={handleApply} className="w-full mt-4">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TrainingSort;
