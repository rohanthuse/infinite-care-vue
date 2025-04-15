
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface FilterDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    dateRange: DateRange | null;
    fileTypes: string[];
    onlyPrivate: boolean;
    expiryStatus: string;
  };
  onApplyFilters: (filters: {
    dateRange: DateRange | null;
    fileTypes: string[];
    onlyPrivate: boolean;
    expiryStatus: string;
  }) => void;
}

const fileTypes = [
  { id: "pdf", label: "PDF Documents" },
  { id: "docx", label: "Word Documents" },
  { id: "xlsx", label: "Excel Spreadsheets" },
  { id: "jpg", label: "JPG Images" },
  { id: "png", label: "PNG Images" },
  { id: "txt", label: "Text Files" },
];

export const FilterDocumentsDialog: React.FC<FilterDocumentsDialogProps> = ({
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
      fileTypes: [],
      onlyPrivate: false,
      expiryStatus: 'all',
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };
  
  const handleFileTypeToggle = (fileType: string) => {
    setLocalFilters(prev => {
      const updatedFileTypes = prev.fileTypes.includes(fileType)
        ? prev.fileTypes.filter(type => type !== fileType)
        : [...prev.fileTypes, fileType];
      
      return {
        ...prev,
        fileTypes: updatedFileTypes,
      };
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Documents
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
            <Label className="font-medium">File Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {fileTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`file-type-${type.id}`}
                    checked={localFilters.fileTypes.includes(type.id)}
                    onCheckedChange={() => handleFileTypeToggle(type.id)}
                  />
                  <Label
                    htmlFor={`file-type-${type.id}`}
                    className="text-sm font-normal"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="font-medium">Document Status</Label>
            <div className="space-y-3">
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
                  Show only private documents
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Expiry Status</Label>
                <Select
                  value={localFilters.expiryStatus}
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, expiryStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="active">Active (Not Expired)</SelectItem>
                    <SelectItem value="expired">Expired Documents</SelectItem>
                  </SelectContent>
                </Select>
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
