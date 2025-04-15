
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Filter, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LibraryFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    dateRange: DateRange | null;
    resourceTypes: string[];
    onlyPrivate: boolean;
    categories: string[];
    hasExpiry: boolean;
  };
  onApplyFilters: (filters: {
    dateRange: DateRange | null;
    resourceTypes: string[];
    onlyPrivate: boolean;
    categories: string[];
    hasExpiry: boolean;
  }) => void;
}

const resourceTypes = [
  { id: "pdf", label: "PDF Documents" },
  { id: "video", label: "Video Content" },
  { id: "presentation", label: "Presentations" },
  { id: "audio", label: "Audio Files" },
  { id: "spreadsheet", label: "Spreadsheets" },
  { id: "document", label: "Text Documents" },
  { id: "image", label: "Images" },
  { id: "link", label: "External Links" },
];

const categories = [
  { id: "care_protocols", label: "Care Protocols" },
  { id: "training", label: "Training Materials" },
  { id: "research", label: "Research Papers" },
  { id: "guidelines", label: "Clinical Guidelines" },
  { id: "reference", label: "Reference Materials" },
  { id: "presentations", label: "Presentations" },
  { id: "courses", label: "Courses" },
  { id: "tools", label: "Tools & Calculators" },
];

export const LibraryFilterDialog: React.FC<LibraryFilterDialogProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };
  
  const handleReset = () => {
    const resetFilters = {
      dateRange: null,
      resourceTypes: [],
      onlyPrivate: false,
      categories: [],
      hasExpiry: false,
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };
  
  const handleResourceTypeToggle = (resourceType: string) => {
    setLocalFilters(prev => {
      const updatedResourceTypes = prev.resourceTypes.includes(resourceType)
        ? prev.resourceTypes.filter(type => type !== resourceType)
        : [...prev.resourceTypes, resourceType];
      
      return {
        ...prev,
        resourceTypes: updatedResourceTypes,
      };
    });
  };
  
  const handleCategoryToggle = (category: string) => {
    setLocalFilters(prev => {
      const updatedCategories = prev.categories.includes(category)
        ? prev.categories.filter(cat => cat !== category)
        : [...prev.categories, category];
      
      return {
        ...prev,
        categories: updatedCategories,
      };
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Library Resources
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="font-medium">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !localFilters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateRange?.from ? (
                    localFilters.dateRange.to ? (
                      <>
                        {format(localFilters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(localFilters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(localFilters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Select a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={localFilters.dateRange?.from}
                  selected={localFilters.dateRange || undefined}
                  onSelect={(range) => setLocalFilters(prev => ({ ...prev, dateRange: range }))}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {localFilters.dateRange && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto p-0 text-xs text-muted-foreground"
                onClick={() => setLocalFilters(prev => ({ ...prev, dateRange: null }))}
              >
                <XIcon className="mr-1 h-3 w-3" />
                Clear date range
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="font-medium">Resource Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {resourceTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`resource-type-${type.id}`}
                    checked={localFilters.resourceTypes.includes(type.id)}
                    onCheckedChange={() => handleResourceTypeToggle(type.id)}
                  />
                  <Label
                    htmlFor={`resource-type-${type.id}`}
                    className="text-sm font-normal"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="font-medium">Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={localFilters.categories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-normal"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="font-medium">Other Filters</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-private"
                  checked={localFilters.onlyPrivate}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, onlyPrivate: checked === true }))}
                />
                <Label
                  htmlFor="filter-private"
                  className="text-sm font-normal"
                >
                  Show only private resources
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-expiry"
                  checked={localFilters.hasExpiry}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, hasExpiry: checked === true }))}
                />
                <Label
                  htmlFor="filter-expiry"
                  className="text-sm font-normal"
                >
                  Show only resources with expiry date
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>Reset Filters</Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
