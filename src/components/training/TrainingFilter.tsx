
import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import { TrainingCategory, TrainingStatus } from "@/types/training";

interface FilterOptions {
  categories: TrainingCategory[];
  statuses: TrainingStatus[];
  expiryRange: string;
}

interface TrainingFilterProps {
  onApplyFilters: (filters: FilterOptions) => void;
}

const TrainingFilter: React.FC<TrainingFilterProps> = ({ onApplyFilters }) => {
  const [selectedCategories, setSelectedCategories] = React.useState<TrainingCategory[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<TrainingStatus[]>([]);
  const [expiryRange, setExpiryRange] = React.useState<string>("all");
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleCategory = (category: TrainingCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleStatus = (status: TrainingStatus) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const handleApplyFilters = () => {
    onApplyFilters({
      categories: selectedCategories,
      statuses: selectedStatuses,
      expiryRange
    });
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setExpiryRange("all");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 whitespace-nowrap">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Advanced Filter</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Trainings</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down the training program view
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-6 py-6">
          <div>
            <h3 className="mb-3 text-sm font-medium">Training Categories</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="category-core" 
                  checked={selectedCategories.includes("core")}
                  onCheckedChange={() => toggleCategory("core")}
                />
                <Label htmlFor="category-core">Core</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="category-mandatory" 
                  checked={selectedCategories.includes("mandatory")}
                  onCheckedChange={() => toggleCategory("mandatory")}
                />
                <Label htmlFor="category-mandatory">Mandatory</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="category-specialized" 
                  checked={selectedCategories.includes("specialized")}
                  onCheckedChange={() => toggleCategory("specialized")}
                />
                <Label htmlFor="category-specialized">Specialized</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="category-optional" 
                  checked={selectedCategories.includes("optional")}
                  onCheckedChange={() => toggleCategory("optional")}
                />
                <Label htmlFor="category-optional">Optional</Label>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="mb-3 text-sm font-medium">Training Status</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="status-completed" 
                  checked={selectedStatuses.includes("completed")}
                  onCheckedChange={() => toggleStatus("completed")}
                />
                <Label htmlFor="status-completed">Completed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="status-in-progress" 
                  checked={selectedStatuses.includes("in-progress")}
                  onCheckedChange={() => toggleStatus("in-progress")}
                />
                <Label htmlFor="status-in-progress">In Progress</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="status-expired" 
                  checked={selectedStatuses.includes("expired")}
                  onCheckedChange={() => toggleStatus("expired")}
                />
                <Label htmlFor="status-expired">Expired</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="status-not-started" 
                  checked={selectedStatuses.includes("not-started")}
                  onCheckedChange={() => toggleStatus("not-started")}
                />
                <Label htmlFor="status-not-started">Not Started</Label>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="mb-3 text-sm font-medium">Expiry Date Range</h3>
            <Select value={expiryRange} onValueChange={setExpiryRange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select expiry range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="30days">Expiring in 30 days</SelectItem>
                <SelectItem value="60days">Expiring in 60 days</SelectItem>
                <SelectItem value="90days">Expiring in 90 days</SelectItem>
                <SelectItem value="expired">Already Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <SheetFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleResetFilters} className="w-full sm:w-auto">
            Reset
          </Button>
          <Button onClick={handleApplyFilters} className="w-full sm:w-auto">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TrainingFilter;
