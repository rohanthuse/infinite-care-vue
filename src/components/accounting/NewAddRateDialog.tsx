import React, { useState, useEffect } from "react";
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
import { useServices } from "@/data/hooks/useServices";
import { ServiceRate } from "@/hooks/useAccountingData";

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
  rate: string;
  rateAt15Minutes: string;
  rateAt30Minutes: string;
  rateAt45Minutes: string;
  rateAt60Minutes: string;
  consecutiveHours: string;
  isVatable: boolean;
}

export type DialogMode = 'create' | 'view' | 'edit';

interface NewAddRateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  mode?: DialogMode;
  rateData?: ServiceRate | null;
  organizationId?: string;
  branchId?: string;
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
  { value: "fix_flat_rate", label: "Fix Flat Rate" },
];

const typeOptions = [
  { value: "client", label: "Client Rate" },
  { value: "staff", label: "Staff Rate" },
  { value: "authority", label: "Authority Rate" },
  { value: "fees", label: "Fees" },
];

const NewAddRateDialog: React.FC<NewAddRateDialogProps> = ({
  open,
  onClose,
  onSave,
  mode = 'create',
  rateData,
  organizationId,
  branchId,
}) => {
  // Basic Rate Information
  const [type, setType] = useState<string>("");
  const [authority, setAuthority] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endDateOptional, setEndDateOptional] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("active");

  // Rate Blocks
  const [rateBlocks, setRateBlocks] = useState<RateBlock[]>([]);

  // Get authorities from context
  const { authorities, isLoading: authoritiesLoading } = useAuthorities();

  // Get services from database
  const { data: services = [], isLoading: servicesLoading } = useServices(organizationId);

  // Transform services for MultiSelect
  const servicesOptions = services.map(service => ({
    label: service.title,
    value: service.id
  }));

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  // Populate form when editing or viewing existing rate
  useEffect(() => {
    if ((isEditMode || isViewMode) && rateData && open) {
      setCaption(rateData.service_name || "");
      setAuthority(rateData.funding_source || "");
      setType(rateData.client_type || "");
      setStartDate(rateData.effective_from ? new Date(rateData.effective_from) : undefined);
      
      if (rateData.effective_to) {
        setEndDate(new Date(rateData.effective_to));
        setEndDateOptional(false);
      } else {
        setEndDate(undefined);
        setEndDateOptional(true);
      }

      // Set status for edit mode
      if (rateData.status) {
        setStatus(rateData.status);
      }

      // Map database pay_based_on to UI chargeBasedOn
      const mapPayBasedOnToChargeBasedOn = (payBasedOn?: string): string => {
        switch (payBasedOn) {
          case 'service': return 'services';
          case 'hours_minutes': return 'hours_minutes';
          case 'fixed': return 'fix_flat_rate';
          default: return 'services';
        }
      };

      // Map database charge_type to UI rateChargingMethod and rateCalculationType
      const mapChargeType = (chargeType?: string): { rateChargingMethod: string; rateCalculationType: string } => {
        switch (chargeType) {
          case 'flat_rate': return { rateChargingMethod: 'flat', rateCalculationType: '' };
          case 'pro_rata': return { rateChargingMethod: 'pro', rateCalculationType: '' };
          case 'hourly_rate': return { rateChargingMethod: 'hourly', rateCalculationType: '' };
          case 'rate_per_hour': return { rateChargingMethod: '', rateCalculationType: 'rate_per_hour' };
          case 'rate_per_minutes_pro_rata': return { rateChargingMethod: '', rateCalculationType: 'rate_per_minutes_pro' };
          case 'rate_per_minutes_flat_rate': return { rateChargingMethod: '', rateCalculationType: 'rate_per_minutes_flat' };
          default: return { rateChargingMethod: 'flat', rateCalculationType: '' };
        }
      };

      const chargeBasedOn = mapPayBasedOnToChargeBasedOn(rateData.pay_based_on);
      const { rateChargingMethod, rateCalculationType } = mapChargeType(rateData.charge_type);

      // Create a rate block from existing data with proper mapping
      const existingBlock: RateBlock = {
        id: crypto.randomUUID(),
        applicableDays: rateData.applicable_days || [],
        rateType: rateData.rate_category || rateData.rate_type || "",
        effectiveFrom: rateData.time_from || "",
        effectiveUntil: rateData.time_until || "",
        chargeBasedOn: chargeBasedOn,
        rateChargingMethod: rateChargingMethod,
        rateCalculationType: rateCalculationType,
        services: rateData.service_id ? [rateData.service_id] : [],
        rate: rateData.amount?.toString() || "",
        rateAt15Minutes: rateData.rate_15_minutes?.toString() || "",
        rateAt30Minutes: rateData.rate_30_minutes?.toString() || "",
        rateAt45Minutes: rateData.rate_45_minutes?.toString() || "",
        rateAt60Minutes: rateData.rate_60_minutes?.toString() || "",
        consecutiveHours: rateData.consecutive_hours?.toString() || "",
        isVatable: rateData.service_type === 'vatable',
      };
      setRateBlocks([existingBlock]);
    }
  }, [isEditMode, isViewMode, rateData, open]);

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
    rate: "",
    rateAt15Minutes: "",
    rateAt30Minutes: "",
    rateAt45Minutes: "",
    rateAt60Minutes: "",
    consecutiveHours: "",
    isVatable: false,
  });

  const handleAddRateBlock = () => {
    if (isViewMode) return;
    setRateBlocks((prev) => [...prev, createNewRateBlock()]);
  };

  const handleRemoveRateBlock = (id: string) => {
    if (isViewMode) return;
    setRateBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const handleRateBlockChange = (id: string, field: keyof RateBlock, value: any) => {
    if (isViewMode) return;
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, [field]: value } : block
      )
    );
  };

  const handleDayToggle = (blockId: string, dayId: string) => {
    if (isViewMode) return;
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
    if (isViewMode) return;
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? { ...block, applicableDays: dayOptions.map((d) => d.id) }
          : block
      )
    );
  };

  const handleClearAllDays = (blockId: string) => {
    if (isViewMode) return;
    setRateBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, applicableDays: [] } : block
      )
    );
  };

  const handleEndDateOptionalChange = (checked: boolean) => {
    if (isViewMode) return;
    setEndDateOptional(checked);
    if (checked) {
      setEndDate(undefined);
    }
  };

  const handleSave = () => {
    if (isViewMode) return;

    // Transform form data to match database schema
    const rateBlock = rateBlocks[0]; // Primary rate block

    // Helper function to map UI values to database charge_type
    const mapToChargeType = (chargeBasedOn: string, rateChargingMethod: string, rateCalculationType: string): string => {
      if (chargeBasedOn === 'services') {
        switch (rateChargingMethod) {
          case 'flat': return 'flat_rate';
          case 'pro': return 'pro_rata';
          case 'hourly': return 'hourly_rate';
          default: return 'flat_rate';
        }
      } else if (chargeBasedOn === 'fix_flat_rate') {
        // Fix Flat Rate always maps to flat_rate
        return 'flat_rate';
      } else if (chargeBasedOn === 'hours_minutes') {
        switch (rateCalculationType) {
          case 'rate_per_hour': return 'rate_per_hour';
          case 'rate_per_minutes_pro': return 'rate_per_minutes_pro_rata';
          case 'rate_per_minutes_flat': return 'rate_per_minutes_flat_rate';
          default: return 'rate_per_hour';
        }
      }
      return 'flat_rate';
    };

    // Helper function to map UI values to database pay_based_on
    const mapToPayBasedOn = (chargeBasedOn: string): string => {
      switch (chargeBasedOn) {
        case 'services': return 'service';
        case 'fix_flat_rate': return 'fixed';
        case 'hours_minutes': return 'hours_minutes';
        default: return 'service';
      }
    };
    
    // Determine amount from rate block
    let amount = 0;
    if (rateBlock) {
      if (rateBlock.rateChargingMethod === "flat" || rateBlock.rateChargingMethod === "hourly") {
        amount = parseFloat(rateBlock.rate) || 0;
      } else if (rateBlock.rateAt60Minutes) {
        amount = parseFloat(rateBlock.rateAt60Minutes) || 0;
      }
    }

    // Get service name from selected services
    let serviceName = caption;
    let serviceCode = caption.toLowerCase().replace(/\s+/g, '_');
    let serviceId: string | undefined;

    if (rateBlock?.services?.length > 0) {
      const selectedService = services.find(s => s.id === rateBlock.services[0]);
      if (selectedService) {
        serviceName = serviceName || selectedService.title;
        serviceCode = selectedService.code || serviceCode;
        serviceId = selectedService.id;
      }
    }

    const dbRateData = {
      service_name: serviceName || "Unnamed Rate",
      service_code: serviceCode || "unknown",
      service_id: serviceId,
      rate_type: rateBlock?.rateChargingMethod || rateBlock?.rateType || "hourly",
      amount: amount,
      currency: "GBP",
      effective_from: startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      effective_to: endDateOptional ? null : (endDate ? format(endDate, 'yyyy-MM-dd') : null),
      client_type: type || "standard",
      funding_source: authority || "self_funded",
      applicable_days: rateBlock?.applicableDays || [],
      is_default: false,
      status: isEditMode ? status : "active",
      description: `Rate for ${serviceName}`,
      // Rate minute fields (for pro rate)
      rate_15_minutes: rateBlock?.rateAt15Minutes ? parseFloat(rateBlock.rateAt15Minutes) : null,
      rate_30_minutes: rateBlock?.rateAt30Minutes ? parseFloat(rateBlock.rateAt30Minutes) : null,
      rate_45_minutes: rateBlock?.rateAt45Minutes ? parseFloat(rateBlock.rateAt45Minutes) : null,
      rate_60_minutes: rateBlock?.rateAt60Minutes ? parseFloat(rateBlock.rateAt60Minutes) : null,
      consecutive_hours: rateBlock?.consecutiveHours ? parseFloat(rateBlock.consecutiveHours) : null,
      service_type: rateBlock?.isVatable ? 'vatable' : 'standard',
      charge_type: mapToChargeType(
        rateBlock?.chargeBasedOn || 'services',
        rateBlock?.rateChargingMethod || 'flat',
        rateBlock?.rateCalculationType || 'rate_per_hour'
      ),
      pay_based_on: mapToPayBasedOn(rateBlock?.chargeBasedOn || 'services'),
    };

    // If editing, include the rate ID
    if (isEditMode && rateData?.id) {
      onSave?.({ ...dbRateData, id: rateData.id });
    } else {
      onSave?.(dbRateData);
    }
    
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
    setStatus("active");
    setRateBlocks([]);
    onClose();
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'view':
        return 'View Rate';
      case 'edit':
        return 'Edit Rate';
      default:
        return 'Add New Rate';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
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
              <Select value={type} onValueChange={setType} disabled={isViewMode}>
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
              <Select value={authority} onValueChange={setAuthority} disabled={authoritiesLoading || isViewMode}>
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
                disabled={isViewMode}
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
                      disabled={isViewMode}
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
                      disabled={isViewMode}
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
                        disabled={isViewMode}
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

            {/* Status - Only show in Edit mode */}
            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Rates Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-foreground">Rates</h3>
              {!isViewMode && (
                <Button variant="outline" size="sm" onClick={handleAddRateBlock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate
                </Button>
              )}
            </div>

            {rateBlocks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isViewMode ? "No rate configuration" : "Click \"Add Rate\" to add rate configuration"}
              </p>
            )}

            {/* Rate Blocks */}
            {rateBlocks.map((block, index) => (
              <Card key={block.id} className="p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rate #{index + 1}</span>
                  {!isViewMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRateBlock(block.id)}
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
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {dayOptions.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${block.id}-${day.id}`}
                          checked={block.applicableDays.includes(day.id)}
                          onCheckedChange={() => handleDayToggle(block.id, day.id)}
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
                    onValueChange={(value) =>
                      handleRateBlockChange(block.id, "rateType", value)
                    }
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
                        onChange={(e) =>
                          handleRateBlockChange(block.id, "effectiveFrom", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleRateBlockChange(block.id, "effectiveUntil", e.target.value)
                        }
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
                    onValueChange={(value) =>
                      handleRateBlockChange(block.id, "chargeBasedOn", value)
                    }
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
                        onValueChange={(value) =>
                          handleRateBlockChange(block.id, "rateCalculationType", value)
                        }
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

                    {/* Rate per Hour - Single Rate Field */}
                    {block.rateCalculationType === "rate_per_hour" && (
                      <div className="space-y-2">
                        <Label>
                          Rate <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={block.rate}
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rate", e.target.value)
                          }
                          placeholder="Enter rate"
                          type="number"
                          disabled={isViewMode}
                        />
                      </div>
                    )}

                    {/* Rate per Minutes (Pro/Flat) - 15/30/45/60 Minute Fields */}
                    {(block.rateCalculationType === "rate_per_minutes_pro" || 
                      block.rateCalculationType === "rate_per_minutes_flat") && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rate at 15 Minutes</Label>
                          <Input
                            value={block.rateAt15Minutes}
                            onChange={(e) =>
                              handleRateBlockChange(block.id, "rateAt15Minutes", e.target.value)
                            }
                            placeholder="Enter rate"
                            type="number"
                            disabled={isViewMode}
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
                            type="number"
                            disabled={isViewMode}
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
                            type="number"
                            disabled={isViewMode}
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
                            type="number"
                            disabled={isViewMode}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Consecutive Hours</Label>
                      <Input
                        value={block.consecutiveHours}
                        onChange={(e) =>
                          handleRateBlockChange(block.id, "consecutiveHours", e.target.value)
                        }
                        placeholder="Enter hours"
                        disabled={isViewMode}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${block.id}-vatable-hours`}
                        checked={block.isVatable}
                        onCheckedChange={(checked) =>
                          handleRateBlockChange(block.id, "isVatable", checked === true)
                        }
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
                        onValueChange={(value) =>
                          handleRateBlockChange(block.id, "rateChargingMethod", value)
                        }
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
                          onSelectionChange={(selected) =>
                            handleRateBlockChange(block.id, "services", selected)
                          }
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
                          onChange={(e) =>
                            handleRateBlockChange(block.id, "rate", e.target.value)
                          }
                          placeholder="Enter rate"
                          type="number"
                          disabled={isViewMode}
                        />
                      </div>
                    )}

                    {/* Pro Rate - Single Rate Field */}
                    {block.rateChargingMethod === "pro" && (
                      <>
                        <div className="space-y-2">
                          <Label>
                            Rate <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={block.rate}
                            onChange={(e) =>
                              handleRateBlockChange(block.id, "rate", e.target.value)
                            }
                            placeholder="Enter rate"
                            type="number"
                            disabled={isViewMode}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Consecutive Hours</Label>
                          <Input
                            value={block.consecutiveHours}
                            onChange={(e) =>
                              handleRateBlockChange(block.id, "consecutiveHours", e.target.value)
                            }
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
                        onCheckedChange={(checked) =>
                          handleRateBlockChange(block.id, "isVatable", checked === true)
                        }
                        disabled={isViewMode}
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
          {isViewMode ? (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {isEditMode ? 'Update Rate' : 'Save Rate'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewAddRateDialog;
