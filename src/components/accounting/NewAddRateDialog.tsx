import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useAuthorities } from "@/contexts/AuthoritiesContext";

interface RateBlock {
  id: string;
  applicableDays: string[];
  rateType: string;
  effectiveFrom: string;
  effectiveUntil: string;
  chargeBasedOn: string;
  rateChargingMethod: string;
  rateCalculationType: string;
  services: string[];
  rateAt15Minutes: string;
  rateAt30Minutes: string;
  rateAt45Minutes: string;
  rateAt60Minutes: string;
  consecutiveHours: string;
  isVatable: boolean;
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
  { value: "standard", label: "Standard" },
  { value: "adult", label: "Adult" },
  { value: "cyp", label: "CYP" },
];

const chargeBasedOnOptions = [
  { value: "hours_minutes", label: "Hours/Minutes" },
  { value: "services", label: "Services" },
];

const typeOptions = [
  { value: "client", label: "Client Rate" },
  { value: "staff", label: "Staff Rate" },
  { value: "authority", label: "Authority Rate" },
  { value: "fees", label: "Fees" },
];

const servicesOptions = [
  { label: "Personal Care", value: "personal_care" },
  { label: "Medication Support", value: "medication_support" },
  { label: "Domestic Help", value: "domestic_help" },
  { label: "Companionship", value: "companionship" },
  { label: "Night Care", value: "night_care" },
  { label: "Respite Care", value: "respite_care" },
];

const NewAddRateDialog: React.FC<NewAddRateDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  // Basic Rate Information
  const [type, setType] = useState<string>("");
  const [authority, setAuthority] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endDateOptional, setEndDateOptional] = useState<boolean>(false);

  // Rate Blocks
  const [rateBlocks, setRateBlocks] = useState<RateBlock[]>([]);

  // Get authorities from context
  const { authorities, isLoading: authoritiesLoading } = useAuthorities();

  const createNewRateBlock = (): RateBlock => ({
    id: crypto.randomUUID(),
    applicableDays: [],
    rateType: "",
    effectiveFrom: "",
    effectiveUntil: "",
    chargeBasedOn: "",
    rateChargingMethod: "",
    rateCalculationType: "",
    services: [],
    rateAt15Minutes: "",
    rateAt30Minutes: "",
    rateAt45Minutes: "",
    rateAt60Minutes: "",
    consecutiveHours: "",
    isVatable: false,
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

  const handleEndDateOptionalChange = (checked: boolean) => {
    setEndDateOptional(checked);
    if (checked) {
      setEndDate(undefined);
    }
  };

  const handleSave = () => {
    const data = {
      type,
      authority,
      caption,
      startDate,
      endDate: endDateOptional ? null : endDate,
      endDateOptional,
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
    setCaption("");
    setStartDate(undefined);
    setEndDate(undefined);
    setEndDateOptional(false);
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
              <Select value={authority} onValueChange={setAuthority} disabled={authoritiesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={authoritiesLoading ? "Loading authorities..." : "Select Authority"} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {authoritiesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading authorities...
                    </SelectItem>
                  ) : authorities.length > 0 ? (
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
              {!authoritiesLoading && authorities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add authorities in Workflow Management → Authorities tab
                </p>
              )}
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Enter caption"
              />
            </div>

            {/* Start Date & End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>End Date</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="endDateOptional"
                      checked={endDateOptional}
                      onCheckedChange={(checked) => handleEndDateOptionalChange(checked === true)}
                    />
                    <Label htmlFor="endDateOptional" className="text-sm font-normal cursor-pointer">
                      Optional
                    </Label>
                  </div>
                </div>
                {endDateOptional ? (
                  <div className="h-10 flex items-center px-3 border rounded-md bg-muted/50 text-muted-foreground text-sm">
                    No end date
                  </div>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
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

                {/* Effective Time */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Effective Time</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Effective From
                      </Label>
                      <Input
                        type="time"
                        value={block.effectiveFrom}
                        onChange={(e) =>
                          handleRateBlockChange(block.id, "effectiveFrom", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Effective Until
                      </Label>
                      <Input
                        type="time"
                        value={block.effectiveUntil}
                        onChange={(e) =>
                          handleRateBlockChange(block.id, "effectiveUntil", e.target.value)
                        }
                      />
                    </div>
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

                {/* Hours/Minutes based Charge Options */}
                {block.chargeBasedOn === "hours_minutes" && (
                  <div className="space-y-4 p-4 bg-background/50 rounded-lg border">
                    {/* Rate Calculation Type - Radio Group */}
                    <div className="space-y-3">
                      <Label>Rate Calculation Options</Label>
                      <RadioGroup
                        value={block.rateCalculationType}
                        onValueChange={(value) =>
                          handleRateBlockChange(block.id, "rateCalculationType", value)
                        }
                        className="flex flex-col gap-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rate_per_hour" id={`${block.id}-rate_per_hour`} />
                          <Label htmlFor={`${block.id}-rate_per_hour`} className="font-normal cursor-pointer">
                            Rate per Hour
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rate_per_minutes_pro" id={`${block.id}-rate_per_minutes_pro`} />
                          <Label htmlFor={`${block.id}-rate_per_minutes_pro`} className="font-normal cursor-pointer">
                            Rate per Minutes (Pro Rate)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rate_per_minutes_flat" id={`${block.id}-rate_per_minutes_flat`} />
                          <Label htmlFor={`${block.id}-rate_per_minutes_flat`} className="font-normal cursor-pointer">
                            Rate per Minutes (Flat Rate)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Rate Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rate at 15 Minutes</Label>
                        <Input
                          value={block.rateAt15Minutes}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rateAt15Minutes", e.target.value)
                          }
                          placeholder="Enter rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Rate at 30 Minutes <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={block.rateAt30Minutes}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rateAt30Minutes", e.target.value)
                          }
                          placeholder="Enter rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Rate at 45 Minutes <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={block.rateAt45Minutes}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rateAt45Minutes", e.target.value)
                          }
                          placeholder="Enter rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Rate at 60 Minutes <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={block.rateAt60Minutes}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rateAt60Minutes", e.target.value)
                          }
                          placeholder="Enter rate"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Consecutive Hours</Label>
                      <Input
                        value={block.consecutiveHours}
                        onChange={(e) =>
                          handleRateBlockChange(block.id, "consecutiveHours", e.target.value)
                        }
                        placeholder="Enter hours"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${block.id}-vatable-hours`}
                        checked={block.isVatable}
                        onCheckedChange={(checked) =>
                          handleRateBlockChange(block.id, "isVatable", checked === true)
                        }
                      />
                      <Label htmlFor={`${block.id}-vatable-hours`} className="font-normal cursor-pointer">
                        Is this rate VATable?
                      </Label>
                    </div>
                  </div>
                )}

                {/* Service-based Charge Options */}
                {block.chargeBasedOn === "services" && (
                  <div className="space-y-4 p-4 bg-background/50 rounded-lg border">
                    {/* Rate Charging Method - Radio Group */}
                    <div className="space-y-2">
                      <Label>Rate Charging Method</Label>
                      <RadioGroup
                        value={block.rateChargingMethod}
                        onValueChange={(value) =>
                          handleRateBlockChange(block.id, "rateChargingMethod", value)
                        }
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="flat" id={`${block.id}-flat`} />
                          <Label htmlFor={`${block.id}-flat`} className="font-normal cursor-pointer">
                            Flat Rate
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pro" id={`${block.id}-pro`} />
                          <Label htmlFor={`${block.id}-pro`} className="font-normal cursor-pointer">
                            Pro Rate
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hourly" id={`${block.id}-hourly`} />
                          <Label htmlFor={`${block.id}-hourly`} className="font-normal cursor-pointer">
                            Hourly Rate
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Services Multi-Select */}
                    <div className="space-y-2">
                      <Label>Services</Label>
                      <MultiSelect
                        options={servicesOptions}
                        selected={block.services}
                        onSelectionChange={(selected) =>
                          handleRateBlockChange(block.id, "services", selected)
                        }
                        placeholder="Select services..."
                      />
                    </div>

                    {/* Additional Rate Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rate at 15 Minutes</Label>
                        <Input
                          value={block.rateAt15Minutes}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rateAt15Minutes", e.target.value)
                          }
                          placeholder="Enter rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Rate at 30 Minutes <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={block.rateAt30Minutes}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rateAt30Minutes", e.target.value)
                          }
                          placeholder="Enter rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Rate at 45 Minutes <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={block.rateAt45Minutes}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rateAt45Minutes", e.target.value)
                          }
                          placeholder="Enter rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Rate at 60 Minutes <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={block.rateAt60Minutes}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rateAt60Minutes", e.target.value)
                          }
                          placeholder="Enter rate"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Consecutive Hours</Label>
                      <Input
                        value={block.consecutiveHours}
                        onChange={(e) =>
                          handleRateBlockChange(block.id, "consecutiveHours", e.target.value)
                        }
                        placeholder="Enter hours"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${block.id}-vatable`}
                        checked={block.isVatable}
                        onCheckedChange={(checked) =>
                          handleRateBlockChange(block.id, "isVatable", checked === true)
                        }
                      />
                      <Label htmlFor={`${block.id}-vatable`} className="font-normal cursor-pointer">
                        Is this rate VATable?
                      </Label>
                    </div>
                  </div>
                )}
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
