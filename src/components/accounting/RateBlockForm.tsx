import React from "react";
import { Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";

export interface RateBlock {
  id: string;
  applicableDays: string[];
  rateType: string;
  effectiveFrom: string;
  effectiveUntil: string;
  chargeBasedOn: string;
  rateChargingMethod: string;
  rateCalculationType: string;
  services: string[];
  rate: string;
  rateAt15Minutes: string;
  rateAt30Minutes: string;
  rateAt45Minutes: string;
  rateAt60Minutes: string;
  consecutiveHours: string;
  isVatable: boolean;
}

export const dayOptions = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
  { id: "bank_holiday", label: "Bank Holiday" },
];

export const rateTypeOptions = [
  { value: "standard", label: "Standard" },
  { value: "adult", label: "Adult" },
  { value: "cyp", label: "CYP" },
];

export const chargeBasedOnOptions = [
  { value: "hours_minutes", label: "Hours/Minutes" },
  { value: "services", label: "Services" },
  { value: "fix_flat_rate", label: "Fix Flat Rate" },
];

export const createNewRateBlock = (): RateBlock => ({
  id: crypto.randomUUID(),
  applicableDays: [],
  rateType: "",
  effectiveFrom: "",
  effectiveUntil: "",
  chargeBasedOn: "",
  rateChargingMethod: "",
  rateCalculationType: "",
  services: [],
  rate: "",
  rateAt15Minutes: "",
  rateAt30Minutes: "",
  rateAt45Minutes: "",
  rateAt60Minutes: "",
  consecutiveHours: "",
  isVatable: false,
});

interface ServiceOption {
  label: string;
  value: string;
}

interface RateBlockFormProps {
  block: RateBlock;
  index: number;
  isViewMode?: boolean;
  servicesOptions: ServiceOption[];
  servicesLoading?: boolean;
  onBlockChange: (id: string, field: keyof RateBlock, value: any) => void;
  onDayToggle: (blockId: string, dayId: string) => void;
  onSelectAllDays: (blockId: string) => void;
  onClearAllDays: (blockId: string) => void;
  onRemoveBlock: (id: string) => void;
}

export const RateBlockForm: React.FC<RateBlockFormProps> = ({
  block,
  index,
  isViewMode = false,
  servicesOptions,
  servicesLoading = false,
  onBlockChange,
  onDayToggle,
  onSelectAllDays,
  onClearAllDays,
  onRemoveBlock,
}) => {
  return (
    <Card className="p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Rate #{index + 1}</span>
        {!isViewMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveBlock(block.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      {/* Applicable Days */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Applicable Days</Label>
          {!isViewMode && (
            <div className="flex gap-2">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => onSelectAllDays(block.id)}
              >
                Select All
              </Button>
              <span className="text-muted-foreground">|</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => onClearAllDays(block.id)}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {dayOptions.map((day) => (
            <div key={day.id} className="flex items-center space-x-2">
              <Checkbox
                id={`${block.id}-${day.id}`}
                checked={block.applicableDays.includes(day.id)}
                onCheckedChange={() => onDayToggle(block.id, day.id)}
                disabled={isViewMode}
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
          onValueChange={(value) => onBlockChange(block.id, "rateType", value)}
          disabled={isViewMode}
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
              onChange={(e) => onBlockChange(block.id, "effectiveFrom", e.target.value)}
              disabled={isViewMode}
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
              onChange={(e) => onBlockChange(block.id, "effectiveUntil", e.target.value)}
              disabled={isViewMode}
            />
          </div>
        </div>
      </div>

      {/* Charge Based On */}
      <div className="space-y-2">
        <Label>Charge Based On</Label>
        <Select
          value={block.chargeBasedOn}
          onValueChange={(value) => onBlockChange(block.id, "chargeBasedOn", value)}
          disabled={isViewMode}
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
              onValueChange={(value) => onBlockChange(block.id, "rateCalculationType", value)}
              className="flex flex-col gap-3"
              disabled={isViewMode}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rate_per_hour" id={`${block.id}-rate_per_hour`} disabled={isViewMode} />
                <Label htmlFor={`${block.id}-rate_per_hour`} className="font-normal cursor-pointer">
                  Rate per Hour
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rate_per_minutes_pro" id={`${block.id}-rate_per_minutes_pro`} disabled={isViewMode} />
                <Label htmlFor={`${block.id}-rate_per_minutes_pro`} className="font-normal cursor-pointer">
                  Rate per Minutes (Pro Rate)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rate_per_minutes_flat" id={`${block.id}-rate_per_minutes_flat`} disabled={isViewMode} />
                <Label htmlFor={`${block.id}-rate_per_minutes_flat`} className="font-normal cursor-pointer">
                  Rate per Minutes (Flat Rate)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Single Rate Field for Hours/Minutes */}
          <div className="space-y-2">
            <Label>
              Rate <span className="text-destructive">*</span>
            </Label>
            <Input
              value={block.rate}
              onChange={(e) => onBlockChange(block.id, "rate", e.target.value)}
              placeholder="Enter rate"
              type="number"
              disabled={isViewMode}
            />
          </div>

          <div className="space-y-2">
            <Label>Consecutive Hours</Label>
            <Input
              value={block.consecutiveHours}
              onChange={(e) => onBlockChange(block.id, "consecutiveHours", e.target.value)}
              placeholder="Enter hours"
              disabled={isViewMode}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${block.id}-vatable-hours`}
              checked={block.isVatable}
              onCheckedChange={(checked) => onBlockChange(block.id, "isVatable", checked === true)}
              disabled={isViewMode}
            />
            <Label htmlFor={`${block.id}-vatable-hours`} className="font-normal cursor-pointer">
              Is this rate VATable?
            </Label>
          </div>
        </div>
      )}

      {/* Service-based Charge Options */}
      {(block.chargeBasedOn === "services" || block.chargeBasedOn === "fix_flat_rate") && (
        <div className="space-y-4 p-4 bg-background/50 rounded-lg border">
          {/* Rate Charging Method - Radio Group */}
          <div className="space-y-2">
            <Label>Rate Charging Method</Label>
            <RadioGroup
              value={block.rateChargingMethod}
              onValueChange={(value) => onBlockChange(block.id, "rateChargingMethod", value)}
              className="flex flex-wrap gap-4"
              disabled={isViewMode}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat" id={`${block.id}-flat`} disabled={isViewMode} />
                <Label htmlFor={`${block.id}-flat`} className="font-normal cursor-pointer">
                  Flat Rate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pro" id={`${block.id}-pro`} disabled={isViewMode} />
                <Label htmlFor={`${block.id}-pro`} className="font-normal cursor-pointer">
                  Pro Rate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hourly" id={`${block.id}-hourly`} disabled={isViewMode} />
                <Label htmlFor={`${block.id}-hourly`} className="font-normal cursor-pointer">
                  Hourly Rate
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Services Multi-Select - Fetched from database */}
          <div className="space-y-2">
            <Label>Services</Label>
            {servicesLoading ? (
              <div className="h-10 flex items-center px-3 border rounded-md bg-muted/50 text-muted-foreground text-sm">
                Loading services...
              </div>
            ) : servicesOptions.length > 0 ? (
              <MultiSelect
                options={servicesOptions}
                selected={block.services}
                onSelectionChange={(selected) => onBlockChange(block.id, "services", selected)}
                placeholder="Select services..."
                disabled={isViewMode}
              />
            ) : (
              <div className="h-10 flex items-center px-3 border rounded-md bg-muted/50 text-muted-foreground text-sm">
                No services available. Add services in Core Settings.
              </div>
            )}
          </div>

          {/* Single Rate Field - For Flat Rate or Hourly Rate */}
          {(block.rateChargingMethod === "flat" || block.rateChargingMethod === "hourly") && (
            <div className="space-y-2">
              <Label>
                Rate <span className="text-destructive">*</span>
              </Label>
              <Input
                value={block.rate}
                onChange={(e) => onBlockChange(block.id, "rate", e.target.value)}
                placeholder="Enter rate"
                type="number"
                disabled={isViewMode}
              />
            </div>
          )}

          {/* Minute-based Rate Fields - Only for Pro Rate */}
          {block.rateChargingMethod === "pro" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rate at 15 Minutes</Label>
                  <Input
                    value={block.rateAt15Minutes}
                    onChange={(e) => onBlockChange(block.id, "rateAt15Minutes", e.target.value)}
                    placeholder="Enter rate"
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Rate at 30 Minutes <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={block.rateAt30Minutes}
                    onChange={(e) => onBlockChange(block.id, "rateAt30Minutes", e.target.value)}
                    placeholder="Enter rate"
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Rate at 45 Minutes <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={block.rateAt45Minutes}
                    onChange={(e) => onBlockChange(block.id, "rateAt45Minutes", e.target.value)}
                    placeholder="Enter rate"
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Rate at 60 Minutes <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={block.rateAt60Minutes}
                    onChange={(e) => onBlockChange(block.id, "rateAt60Minutes", e.target.value)}
                    placeholder="Enter rate"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Consecutive Hours</Label>
                <Input
                  value={block.consecutiveHours}
                  onChange={(e) => onBlockChange(block.id, "consecutiveHours", e.target.value)}
                  placeholder="Enter hours"
                  disabled={isViewMode}
                />
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${block.id}-vatable`}
              checked={block.isVatable}
              onCheckedChange={(checked) => onBlockChange(block.id, "isVatable", checked === true)}
              disabled={isViewMode}
            />
            <Label htmlFor={`${block.id}-vatable`} className="font-normal cursor-pointer">
              Is this rate VATable?
            </Label>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RateBlockForm;
