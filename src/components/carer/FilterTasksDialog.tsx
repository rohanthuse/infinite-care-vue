
import React, { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface FilterTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: {
    priority: string[];
    category: string[];
    client: string[];
    dateRange: { from: Date | undefined; to: Date | undefined };
    showCompleted: boolean;
  }) => void;
  categories: string[];
  clients: string[];
}

const FilterTasksDialog: React.FC<FilterTasksDialogProps> = ({ 
  open, 
  onOpenChange, 
  onApplyFilters,
  categories,
  clients
}) => {
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined,
    to: undefined 
  });
  const [showCompleted, setShowCompleted] = useState(false);

  const togglePriority = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      setSelectedPriorities(selectedPriorities.filter(p => p !== priority));
    } else {
      setSelectedPriorities([...selectedPriorities, priority]);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleClient = (client: string) => {
    if (selectedClients.includes(client)) {
      setSelectedClients(selectedClients.filter(c => c !== client));
    } else {
      setSelectedClients([...selectedClients, client]);
    }
  };

  const handleApply = () => {
    onApplyFilters({
      priority: selectedPriorities,
      category: selectedCategories,
      client: selectedClients,
      dateRange: {
        from: dateRange.from,
        to: dateRange.to
      },
      showCompleted
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setSelectedPriorities([]);
    setSelectedCategories([]);
    setSelectedClients([]);
    setDateRange({ from: undefined, to: undefined });
    setShowCompleted(false);
  };

  // Filter out empty strings and ensure we have valid values
  const validCategories = categories.filter(category => category && category.trim() !== '');
  const validClients = clients.filter(client => client && client.trim() !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Tasks</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <h3 className="font-medium mb-3">Priority</h3>
            <div className="grid grid-cols-2 gap-2">
              {["High", "Medium", "Low"].map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`priority-${priority}`} 
                    checked={selectedPriorities.includes(priority)}
                    onCheckedChange={() => togglePriority(priority)}
                  />
                  <Label htmlFor={`priority-${priority}`}>{priority}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {validCategories.length > 0 && (
            <>
              <div>
                <h3 className="font-medium mb-3">Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {validCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`} 
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <Label htmlFor={`category-${category}`}>{category}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {validClients.length > 0 && (
            <>
              <div>
                <h3 className="font-medium mb-3">Client</h3>
                <div className="grid grid-cols-1 gap-2">
                  {validClients.map((client) => (
                    <div key={client} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`client-${client}`} 
                        checked={selectedClients.includes(client)}
                        onCheckedChange={() => toggleClient(client)}
                      />
                      <Label htmlFor={`client-${client}`}>{typeof client === 'string' ? client.trim() : String(client)}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}
          
          <div>
            <h3 className="font-medium mb-3">Date Range</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                      </>
                    ) : (
                      format(dateRange.from, "PPP")
                    )
                  ) : (
                    "Select date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Separator />
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-completed" 
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked === true)}
            />
            <Label htmlFor="show-completed">Show completed tasks</Label>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset Filters
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleApply}>Apply Filters</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterTasksDialog;
