import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useAuthorities } from "@/contexts/AuthoritiesContext";

interface RateBlock {
  id: string;
  applicableDays: string[];
  rateType: string;
  effectiveFrom: Date | undefined;
  effectiveUntil: Date | undefined;
  chargeBasedOn: string;
}

interface NewAddRateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
}

const dayOptions = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
  { id: "bank_holiday", label: "Bank Holiday" },
];

const rateTypeOptions = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "fixed", label: "Fixed Rate" },
];

const chargeBasedOnOptions = [
  { value: "actual_time", label: "Actual Time" },
  { value: "booked_time", label: "Booked Time" },
  { value: "fixed_amount", label: "Fixed Amount" },
];

const typeOptions = [
  { value: "client", label: "Client Rate" },
  { value: "staff", label: "Staff Rate" },
  { value: "authority", label: "Authority Rate" },
];

const NewAddRateDialog: React.FC<NewAddRateDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  // Basic Rate Information
  const [type, setType] = useState<string>("");
  const [authority, setAuthority] = useState<string>("");
  const [captionStartDate, setCaptionStartDate] = useState<Date | undefined>();
  const [captionEndDate, setCaptionEndDate] = useState<Date | undefined>();

  // Rate Blocks
  const [rateBlocks, setRateBlocks] = useState<RateBlock[]>([]);

  // Get authorities from context
  const { authorities } = useAuthorities();

  const createNewRateBlock = (): RateBlock => ({
    id: crypto.randomUUID(),
    applicableDays: [],
    rateType: "",
    effectiveFrom: undefined,
    effectiveUntil: undefined,
    chargeBasedOn: "",
  });

  const handleAddRateBlock = () => {
    setRateBlocks((prev) => [...prev, createNewRateBlock()]);
  };

  const handleRemoveRateBlock = (id: string) => {
    setRateBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const handleRateBlockChange = (id: string, field: keyof RateBlock, value: any) => {
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, [field]: value } : block
      )
    );
  };

  const handleDayToggle = (blockId: string, dayId: string) => {
    setRateBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        const currentDays = block.applicableDays;
        const newDays = currentDays.includes(dayId)
          ? currentDays.filter((d) => d !== dayId)
          : [...currentDays, dayId];
        return { ...block, applicableDays: newDays };
      })
    );
  };

  const handleSelectAllDays = (blockId: string) => {
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? { ...block, applicableDays: dayOptions.map((d) => d.id) }
          : block
      )
    );
  };

  const handleClearAllDays = (blockId: string) => {
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, applicableDays: [] } : block
      )
    );
  };

  const handleSave = () => {
    const data = {
      type,
      authority,
      captionStartDate,
      captionEndDate,
      rateBlocks,
    };

    onSave?.(data);
    toast.success("Rate saved successfully");
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setType("");
    setAuthority("");
    setCaptionStartDate(undefined);
    setCaptionEndDate(undefined);
    setRateBlocks([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Rate</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Rate Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Basic Rate Information
            </h3>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Authority */}
            <div className="space-y-2">
              <Label htmlFor="authority">Authority</Label>
              <Select value={authority} onValueChange={setAuthority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Authority" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {authorities.length > 0 ? (
                    authorities.map((auth) => (
                      <SelectItem key={auth.id} value={auth.id}>
                        {auth.organization}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-authorities" disabled>
                      No authorities available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {authorities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add authorities in Workflow Management → Authorities tab
                </p>
              )}
            </div>

            {/* Caption Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Caption Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !captionStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {captionStartDate ? format(captionStartDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={captionStartDate}
                      onSelect={setCaptionStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Caption End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !captionEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {captionEndDate ? format(captionEndDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={captionEndDate}
                      onSelect={setCaptionEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Rates Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-foreground">Rates</h3>
              <Button variant="outline" size="sm" onClick={handleAddRateBlock}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
            </div>

            {rateBlocks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Click "Add Rate" to add rate configuration
              </p>
            )}

            {/* Rate Blocks */}
            {rateBlocks.map((block, index) => (
              <Card key={block.id} className="p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rate #{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRateBlock(block.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Applicable Days */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Applicable Days</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => handleSelectAllDays(block.id)}
                      >
                        Select All
                      </Button>
                      <span className="text-muted-foreground">|</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => handleClearAllDays(block.id)}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {dayOptions.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${block.id}-${day.id}`}
                          checked={block.applicableDays.includes(day.id)}
                          onCheckedChange={() => handleDayToggle(block.id, day.id)}
                        />
                        <Label
                          htmlFor={`${block.id}-${day.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rate Type */}
                <div className="space-y-2">
                  <Label>Rate Type</Label>
                  <Select
                    value={block.rateType}
                    onValueChange={(value) =>
                      handleRateBlockChange(block.id, "rateType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rate type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {rateTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Effective Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Effective From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !block.effectiveFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {block.effectiveFrom
                            ? format(block.effectiveFrom, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={block.effectiveFrom}
                          onSelect={(date) =>
                            handleRateBlockChange(block.id, "effectiveFrom", date)
                          }
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Effective Until</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !block.effectiveUntil && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {block.effectiveUntil
                            ? format(block.effectiveUntil, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={block.effectiveUntil}
                          onSelect={(date) =>
                            handleRateBlockChange(block.id, "effectiveUntil", date)
                          }
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Charge Based On */}
                <div className="space-y-2">
                  <Label>Charge Based On</Label>
                  <Select
                    value={block.chargeBasedOn}
                    onValueChange={(value) =>
                      handleRateBlockChange(block.id, "chargeBasedOn", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {chargeBasedOnOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Rate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewAddRateDialog;
