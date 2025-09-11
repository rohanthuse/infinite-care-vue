
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ServiceRate, useServiceRates } from "@/hooks/useAccountingData";
import { useServices } from "@/data/hooks/useServices";
import { toast } from "sonner";
import { createDateValidation, createPositiveNumberValidation } from "@/utils/validationUtils";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

const rateSchema = z.object({
  service_name: z.string().min(1, "Service name is required"),
  service_code: z.string().min(1, "Service code is required"),
  rate_type: z.enum(["hourly", "daily", "weekly", "monthly", "fixed"]),
  amount: createPositiveNumberValidation("Amount", 0.01),
  effective_from: createDateValidation("Effective from date"),
  effective_to: z.string().optional(),
  client_type: z.enum(["private", "local_authority", "nhs", "insurance", "other"]),
  funding_source: z.enum(["self_funded", "direct_payment", "local_authority", "nhs", "insurance", "other"]),
  applicable_days: z.array(z.string()).min(1, "At least one day must be selected"),
  status: z.enum(["active", "pending", "expired", "discontinued"]),
  description: z.string().optional(),
  is_default: z.boolean(),
}).refine((data) => {
  // Validate effective date range
  if (!data.effective_to) return true;
  const fromDate = new Date(data.effective_from);
  const toDate = new Date(data.effective_to);
  return fromDate <= toDate;
}, {
  message: "Effective from date must be before or equal to effective to date",
  path: ["effective_to"]
}).refine((data) => {
  // Validate effective period is not too long (max 5 years)
  if (!data.effective_to) return true;
  const fromDate = new Date(data.effective_from);
  const toDate = new Date(data.effective_to);
  const diffYears = (toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24 * 365);
  return diffYears <= 5;
}, {
  message: "Effective period cannot exceed 5 years",
  path: ["effective_to"]
});

type RateFormData = z.infer<typeof rateSchema>;

interface AddRateDialogProps {
  open: boolean;
  onClose: () => void;
  onAddRate: (rate: Partial<ServiceRate>) => void;
  initialRate?: ServiceRate;
  branchId?: string;
  variant?: 'full' | 'optionsOnly';
}

const rateTypeLabels = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  fixed: "Fixed Rate"
};

const clientTypeLabels = {
  private: "Private",
  local_authority: "Local Authority",
  nhs: "NHS",
  insurance: "Insurance",
  other: "Other"
};

const fundingSourceLabels = {
  self_funded: "Self-funded",
  direct_payment: "Direct Payment",
  local_authority: "Local Authority",
  nhs: "NHS",
  insurance: "Insurance",
  other: "Other"
};

const AddRateDialog: React.FC<AddRateDialogProps> = ({
  open,
  onClose,
  onAddRate,
  initialRate,
  branchId,
  variant = 'full',
}) => {
  console.log('[AddRateDialog] Received props:', { branchId, open, initialRate });
  const isEditing = Boolean(initialRate);
  const { data: currentUser } = useUserRole();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RateFormData>({
    resolver: zodResolver(rateSchema),
    defaultValues: initialRate ? {
      service_name: initialRate.service_name,
      service_code: initialRate.service_code,
      rate_type: initialRate.rate_type as any,
      amount: initialRate.amount,
      effective_from: initialRate.effective_from,
      effective_to: initialRate.effective_to || "",
      client_type: initialRate.client_type as any,
      funding_source: initialRate.funding_source as any,
      applicable_days: initialRate.applicable_days,
      status: initialRate.status as any,
      description: initialRate.description || "",
      is_default: initialRate.is_default,
    } : {
      service_name: "",
      service_code: "",
      rate_type: "hourly",
      amount: 0,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: "",
      client_type: "private",
      funding_source: "self_funded",
      applicable_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      status: "active",
      description: "",
      is_default: false,
    },
  });

  const watchedValues = watch();

  const dayOptions = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ];

  const handleDayToggle = (day: string) => {
    const currentDays = watchedValues.applicable_days || [];
    if (currentDays.includes(day)) {
      setValue("applicable_days", currentDays.filter((d) => d !== day));
    } else {
      setValue("applicable_days", [...currentDays, day]);
    }
  };

  const selectAllDays = () => {
    setValue("applicable_days", dayOptions.map((day) => day.id));
  };

  const clearAllDays = () => {
    setValue("applicable_days", []);
  };

  const onSubmit = async (data: RateFormData) => {
    try {
      if (!branchId) {
        toast.error('Branch ID is required');
        return;
      }

      if (!currentUser?.id) {
        toast.error('User authentication required');
        return;
      }

      const newRate: Partial<ServiceRate> = {
        service_id: undefined,
        service_name: data.service_name,
        service_code: data.service_code,
        rate_type: data.rate_type,
        amount: data.amount,
        currency: "GBP",
        effective_from: data.effective_from,
        effective_to: data.effective_to || undefined,
        client_type: data.client_type,
        funding_source: data.funding_source,
        applicable_days: data.applicable_days,
        is_default: data.is_default,
        status: data.status,
        description: data.description || undefined,
        // Branch ID and created_by will be set by RateManagementTab
      };

      onAddRate(newRate);
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving service rate:', error);
      toast.error('Failed to save service rate');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (variant === 'optionsOnly') {
    const [selectedOption, setSelectedOption] = React.useState<string>('');
    const [showDefinedRateForm, setShowDefinedRateForm] = React.useState(false);
    const [showCreateNewForm, setShowCreateNewForm] = React.useState(false);
    const [showChangeByPercentForm, setShowChangeByPercentForm] = React.useState(false);
    const [selectedAuthority, setSelectedAuthority] = React.useState<string>('');
    const [selectedRate, setSelectedRate] = React.useState<string>('');
    const [startDate, setStartDate] = React.useState<Date>();
    const [endDate, setEndDate] = React.useState<Date>();
    const [errors, setErrors] = React.useState<{[key: string]: string}>({});

    // Change by % form state
    const [percentChangeData, setPercentChangeData] = React.useState({
      authority: '',
      type: '', // 'increment' or 'decrement'
      amount: '', // percentage amount
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
    });

    // Create new rate form state
    const [createFormData, setCreateFormData] = React.useState({
      authority: '',
      payBasedOn: '',
      serviceRateMode: '', // For Flat Rate, Pro Rata, Hourly Rate
      serviceId: '', // Selected service
      rateAmount: '', // Rate amount when Service is selected
      hoursMinutesMode: '', // For Rate per Hour, Rate per Minutes (Pro Rata), Rate per Minutes (Flat Rate)
      hourlyRate: '', // Rate when Rate per Hour is selected
      consecutiveHours: '', // Consecutive Hours field
      rate15Minutes: '', // Rate at 15 Minutes
      rate30Minutes: '', // Rate at 30 Minutes
      rate45Minutes: '', // Rate at 45 Minutes
      rate60Minutes: '', // Rate at 60 Minutes
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
      selectedDays: [] as string[],
      effectiveFrom: '',
      effectiveUntil: '',
      isVatable: ''
    });

    // Get available rates for the dropdowns
    const { data: availableRates = [] } = useServiceRates(branchId);
    
    // Get available services for the services dropdown
    const { data: availableServices = [] } = useServices();

    // Get unique authorities from available rates
    const authorities = React.useMemo(() => {
      const uniqueAuthorities = [...new Set(availableRates.map(rate => rate.client_type))];
      return uniqueAuthorities.filter(Boolean);
    }, [availableRates]);

    // Get rates for selected authority
    const ratesForAuthority = React.useMemo(() => {
      if (!selectedAuthority) return [];
      return availableRates.filter(rate => rate.client_type === selectedAuthority);
    }, [availableRates, selectedAuthority]);

    const handleOptionSelect = (option: string) => {
      setSelectedOption(option);
      if (option === 'use-defined') {
        setShowDefinedRateForm(true);
      } else if (option === 'create-new') {
        setShowCreateNewForm(true);
      } else if (option === 'change-by-percent') {
        setShowChangeByPercentForm(true);
      } else {
        // For now, just close the dialog for other options
        setTimeout(() => {
          onClose();
        }, 100);
      }
    };

    const validateForm = () => {
      const newErrors: {[key: string]: string} = {};
      
      if (!selectedAuthority) {
        newErrors.authority = 'This field is required';
      }
      if (!selectedRate) {
        newErrors.rate = 'This field is required';
      }
      if (!startDate) {
        newErrors.startDate = 'This field is required';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleAddRate = () => {
      if (!validateForm()) return;

      const rateData = availableRates.find(rate => rate.id === selectedRate);
      if (!rateData) {
        toast.error('Selected rate not found');
        return;
      }

      // Create new rate with overridden dates
      const newRate: Partial<ServiceRate> = {
        ...rateData,
        effective_from: startDate!.toISOString().split('T')[0],
        effective_to: endDate?.toISOString().split('T')[0],
      };

      onAddRate(newRate);
      onClose();
    };

    const handleBack = () => {
      setShowDefinedRateForm(false);
      setShowCreateNewForm(false);
      setShowChangeByPercentForm(false);
      setSelectedOption('');
      setSelectedAuthority('');
      setSelectedRate('');
      setStartDate(undefined);
      setEndDate(undefined);
      setErrors({});
      setPercentChangeData({
        authority: '',
        type: '',
        amount: '',
        startDate: undefined,
        endDate: undefined,
      });
      setCreateFormData({
        authority: '',
        payBasedOn: '',
        serviceRateMode: '',
        serviceId: '',
        rateAmount: '',
        hoursMinutesMode: '',
        hourlyRate: '',
        consecutiveHours: '',
        rate15Minutes: '',
        rate30Minutes: '',
        rate45Minutes: '',
        rate60Minutes: '',
        startDate: undefined,
        endDate: undefined,
        selectedDays: [],
        effectiveFrom: '',
        effectiveUntil: '',
        isVatable: ''
      });
    };

    const validateCreateForm = () => {
      const newErrors: {[key: string]: string} = {};
      
      if (!createFormData.authority) newErrors.authority = 'This field is required';
      if (!createFormData.payBasedOn) newErrors.payBasedOn = 'This field is required';
      if (!createFormData.startDate) newErrors.startDate = 'This field is required';
      if (!createFormData.effectiveFrom) newErrors.effectiveFrom = 'This field is required';
      if (!createFormData.effectiveUntil) newErrors.effectiveUntil = 'This field is required';
      if (createFormData.selectedDays.length === 0) newErrors.selectedDays = 'At least one day must be selected';
      if (!createFormData.isVatable) newErrors.isVatable = 'This field is required';
      
      // Additional validation when Service is selected
      if (createFormData.payBasedOn === 'service') {
        if (!createFormData.serviceRateMode) newErrors.serviceRateMode = 'This field is required';
        if (!createFormData.serviceId) newErrors.serviceId = 'This field is required';
        if (!createFormData.rateAmount || parseFloat(createFormData.rateAmount) <= 0) {
          newErrors.rateAmount = 'Rate amount is required and must be greater than 0';
        }
      }
      
      // Additional validation when Hours/Minutes is selected
      if (createFormData.payBasedOn === 'hours_minutes') {
        if (!createFormData.hoursMinutesMode) newErrors.hoursMinutesMode = 'This field is required';
        
        if (createFormData.hoursMinutesMode === 'rate_per_hour') {
          if (!createFormData.hourlyRate || parseFloat(createFormData.hourlyRate) <= 0) {
            newErrors.hourlyRate = 'Hourly rate is required and must be greater than 0';
          }
          if (!createFormData.consecutiveHours || parseFloat(createFormData.consecutiveHours) <= 0) {
            newErrors.consecutiveHours = 'Consecutive hours is required and must be greater than 0';
          }
        }
        
        if (createFormData.hoursMinutesMode === 'rate_per_minutes_pro_rata' || createFormData.hoursMinutesMode === 'rate_per_minutes_flat_rate') {
          if (!createFormData.rate30Minutes || parseFloat(createFormData.rate30Minutes) <= 0) {
            newErrors.rate30Minutes = '30 minutes rate is required and must be greater than 0';
          }
          if (!createFormData.rate45Minutes || parseFloat(createFormData.rate45Minutes) <= 0) {
            newErrors.rate45Minutes = '45 minutes rate is required and must be greater than 0';
          }
          if (!createFormData.rate60Minutes || parseFloat(createFormData.rate60Minutes) <= 0) {
            newErrors.rate60Minutes = '60 minutes rate is required and must be greater than 0';
          }
          if (!createFormData.consecutiveHours || parseFloat(createFormData.consecutiveHours) <= 0) {
            newErrors.consecutiveHours = 'Consecutive hours is required and must be greater than 0';
          }
        }
      }
      
      // Validate time range
      if (createFormData.effectiveFrom && createFormData.effectiveUntil) {
        const fromTime = new Date(`2000-01-01T${createFormData.effectiveFrom}`);
        const untilTime = new Date(`2000-01-01T${createFormData.effectiveUntil}`);
        if (fromTime >= untilTime) {
          newErrors.effectiveUntil = 'Effective until must be after effective from';
        }
      }
      
      // Validate date range
      if (createFormData.startDate && createFormData.endDate) {
        if (createFormData.startDate > createFormData.endDate) {
          newErrors.endDate = 'End date must be on or after start date';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const validatePercentChangeForm = () => {
      const newErrors: {[key: string]: string} = {};
      
      if (!percentChangeData.authority) {
        newErrors.authority = 'This field is required';
      }
      if (!percentChangeData.type) {
        newErrors.type = 'This field is required';
      }
      if (!percentChangeData.amount || parseFloat(percentChangeData.amount) <= 0) {
        newErrors.amount = 'Amount is required and must be greater than 0';
      }
      if (!percentChangeData.startDate) {
        newErrors.startDate = 'This field is required';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleApplyPercentChange = () => {
      if (!validatePercentChangeForm()) return;

      // Find existing rates for the selected authority
      const ratesForAuthority = availableRates.filter(rate => rate.client_type === percentChangeData.authority);
      
      if (ratesForAuthority.length === 0) {
        toast.error('No rates found for the selected authority');
        return;
      }

      const percentage = parseFloat(percentChangeData.amount) / 100;
      const isIncrement = percentChangeData.type === 'increment';
      
      // Create new rates with percentage adjustments
      ratesForAuthority.forEach(rate => {
        const multiplier = isIncrement ? (1 + percentage) : (1 - percentage);
        const newAmount = Math.round(rate.amount * multiplier * 100) / 100; // Round to 2 decimal places
        
        const newRate: Partial<ServiceRate> = {
          ...rate,
          amount: newAmount,
          effective_from: percentChangeData.startDate!.toISOString().split('T')[0],
          effective_to: percentChangeData.endDate?.toISOString().split('T')[0],
          description: `${rate.description || ''} ${rate.description ? ' | ' : ''}Rate adjusted by ${isIncrement ? '+' : '-'}${percentChangeData.amount}% from £${rate.amount} to £${newAmount}`.trim(),
        };
        
        onAddRate(newRate);
      });
      
      toast.success(`Applied ${isIncrement ? 'increment' : 'decrement'} of ${percentChangeData.amount}% to ${ratesForAuthority.length} rate(s)`);
      onClose();
    };

    const handleCreateNewRate = () => {
      if (!validateCreateForm()) return;

      const authorityLabels = {
        'private': 'Private',
        'local_authority': 'Local Authority', 
        'nhs': 'NHS',
        'insurance': 'Insurance',
        'other': 'Other'
      };

      const payBasedOnLabels = {
        'service': 'Service',
        'hours_minutes': 'Hours/Minutes',
        'daily_flat_rate': 'Daily Flat Rate'
      };

      // Map Pay Based On to rate_type
      let mappedRateType = '';
      let rateAmount = 0;
      
      if (createFormData.payBasedOn === 'service') {
        // Map service rate modes to rate types
        const serviceRateModeMap = {
          'flat_rate': 'fixed',
          'pro_rata': 'per_visit',
          'hourly_rate': 'hourly'
        };
        mappedRateType = serviceRateModeMap[createFormData.serviceRateMode as keyof typeof serviceRateModeMap] || 'per_visit';
        rateAmount = parseFloat(createFormData.rateAmount) || 0;
      } else if (createFormData.payBasedOn === 'hours_minutes') {
        mappedRateType = 'hourly';
        if (createFormData.hoursMinutesMode === 'rate_per_hour') {
          rateAmount = parseFloat(createFormData.hourlyRate) || 0;
        } else {
          // For per minutes options, we'll use the 60-minute rate as the primary amount
          rateAmount = parseFloat(createFormData.rate60Minutes) || 0;
        }
      } else {
        const rateTypeMap = {
          'daily_flat_rate': 'daily'
        };
        mappedRateType = rateTypeMap[createFormData.payBasedOn as keyof typeof rateTypeMap] || 'hourly';
      }

      // Get service name if service is selected
      const selectedService = availableServices.find(service => service.id === createFormData.serviceId);
      const serviceName = selectedService ? selectedService.title : '';

      // Create service rate payload
      const timestamp = Date.now();
      const newRate: Partial<ServiceRate> = {
        service_name: createFormData.payBasedOn === 'service' && serviceName 
          ? `${serviceName} - ${authorityLabels[createFormData.authority as keyof typeof authorityLabels]}`
          : `Client Rate - ${authorityLabels[createFormData.authority as keyof typeof authorityLabels]} (${payBasedOnLabels[createFormData.payBasedOn as keyof typeof payBasedOnLabels]})`,
        service_code: `CR-${timestamp}`,
        rate_type: mappedRateType as any,
        amount: rateAmount,
        currency: "GBP",
        effective_from: createFormData.startDate!.toISOString().split('T')[0],
        effective_to: createFormData.endDate?.toISOString().split('T')[0],
        client_type: createFormData.authority as any,
        funding_source: createFormData.authority === 'private' ? 'self_funded' : createFormData.authority as any,
        applicable_days: createFormData.selectedDays,
        is_default: false,
        status: 'active' as any,
        description: (() => {
          const baseInfo = `VATable: ${createFormData.isVatable}; Effective Hours: ${createFormData.effectiveFrom}–${createFormData.effectiveUntil}; Days: ${createFormData.selectedDays.join(', ')}`;
          
          if (createFormData.payBasedOn === 'service') {
            return `Service: ${serviceName}; Rate Mode: ${createFormData.serviceRateMode}; ${baseInfo}`;
          } else if (createFormData.payBasedOn === 'hours_minutes') {
            if (createFormData.hoursMinutesMode === 'rate_per_hour') {
              return `Hours/Minutes: Rate per Hour (£${createFormData.hourlyRate}/hr); Consecutive Hours: ${createFormData.consecutiveHours}; ${baseInfo}`;
            } else if (createFormData.hoursMinutesMode === 'rate_per_minutes_pro_rata') {
              return `Hours/Minutes: Rate per Minutes (Pro Rata) - 15min: £${createFormData.rate15Minutes}, 30min: £${createFormData.rate30Minutes}, 45min: £${createFormData.rate45Minutes}, 60min: £${createFormData.rate60Minutes}; Consecutive Hours: ${createFormData.consecutiveHours}; ${baseInfo}`;
            } else if (createFormData.hoursMinutesMode === 'rate_per_minutes_flat_rate') {
              return `Hours/Minutes: Rate per Minutes (Flat Rate) - 15min: £${createFormData.rate15Minutes}, 30min: £${createFormData.rate30Minutes}, 45min: £${createFormData.rate45Minutes}, 60min: £${createFormData.rate60Minutes}; Consecutive Hours: ${createFormData.consecutiveHours}; ${baseInfo}`;
            }
          }
          
          return `Amount TBD - pricing based on ${payBasedOnLabels[createFormData.payBasedOn as keyof typeof payBasedOnLabels]} selection; ${baseInfo}`;
        })()
      };

      onAddRate(newRate);
      onClose();
    };

    const dayOptions = [
      { id: "monday", label: "Mon" },
      { id: "tuesday", label: "Tue" },
      { id: "wednesday", label: "Wed" },
      { id: "thursday", label: "Thu" },
      { id: "friday", label: "Fri" },
      { id: "saturday", label: "Sat" },
      { id: "sunday", label: "Sun" },
    ];

    const handleDayToggle = (dayId: string) => {
      const newDays = createFormData.selectedDays.includes(dayId)
        ? createFormData.selectedDays.filter(d => d !== dayId)
        : [...createFormData.selectedDays, dayId];
      
      setCreateFormData(prev => ({ ...prev, selectedDays: newDays }));
      if (errors.selectedDays) {
        setErrors(prev => ({ ...prev, selectedDays: '' }));
      }
    };

    if (showCreateNewForm) {
      return (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create a New Rate</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Authority */}
              <div className="space-y-2">
                <Label htmlFor="authority">Authorities *</Label>
                <Select value={createFormData.authority} onValueChange={(value) => {
                  setCreateFormData(prev => ({ ...prev, authority: value }));
                  if (errors.authority) setErrors(prev => ({ ...prev, authority: '' }));
                }}>
                  <SelectTrigger className={errors.authority ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="local_authority">Local Authority</SelectItem>
                    <SelectItem value="nhs">NHS</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.authority && <p className="text-sm text-red-600">{errors.authority}</p>}
              </div>

              {/* Start & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !createFormData.startDate && "text-muted-foreground",
                          errors.startDate && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {createFormData.startDate ? format(createFormData.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={createFormData.startDate}
                        onSelect={(date) => {
                          setCreateFormData(prev => ({ ...prev, startDate: date }));
                          if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !createFormData.endDate && "text-muted-foreground",
                          errors.endDate && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {createFormData.endDate ? format(createFormData.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={createFormData.endDate}
                        onSelect={(date) => {
                          setCreateFormData(prev => ({ ...prev, endDate: date }));
                          if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }));
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
                </div>
              </div>

              {/* Rates Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Rates</Label>
                
                {/* Pay Based On */}
                <div className="space-y-2">
                  <Label htmlFor="payBasedOn">Pay Based On *</Label>
                  <Select value={createFormData.payBasedOn} onValueChange={(value) => {
                    setCreateFormData(prev => ({ ...prev, payBasedOn: value }));
                    if (errors.payBasedOn) setErrors(prev => ({ ...prev, payBasedOn: '' }));
                  }}>
                    <SelectTrigger className={cn("z-10", errors.payBasedOn ? "border-red-500" : "")}>
                      <SelectValue placeholder="Select pay type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="hours_minutes">Hours/Minutes</SelectItem>
                      <SelectItem value="daily_flat_rate">Daily Flat Rate</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.payBasedOn && <p className="text-sm text-red-600">{errors.payBasedOn}</p>}
                </div>

                {/* Service-specific fields - only show when Service is selected */}
                {createFormData.payBasedOn === 'service' && (
                  <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                    {/* Service Rate Mode - Radio Group */}
                    <div className="space-y-3">
                      <Label>Service Rate Mode *</Label>
                      <RadioGroup
                        value={createFormData.serviceRateMode}
                        onValueChange={(value) => {
                          setCreateFormData(prev => ({ ...prev, serviceRateMode: value }));
                          if (errors.serviceRateMode) setErrors(prev => ({ ...prev, serviceRateMode: '' }));
                        }}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="flat_rate" id="flat-rate" />
                          <Label htmlFor="flat-rate" className="cursor-pointer">Flat Rate</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pro_rata" id="pro-rata" />
                          <Label htmlFor="pro-rata" className="cursor-pointer">Pro Rata</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hourly_rate" id="hourly-rate" />
                          <Label htmlFor="hourly-rate" className="cursor-pointer">Hourly Rate</Label>
                        </div>
                      </RadioGroup>
                      {errors.serviceRateMode && <p className="text-sm text-red-600">{errors.serviceRateMode}</p>}
                    </div>

                    {/* Services Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="services">Services: *</Label>
                      <Select value={createFormData.serviceId} onValueChange={(value) => {
                        setCreateFormData(prev => ({ ...prev, serviceId: value }));
                        if (errors.serviceId) setErrors(prev => ({ ...prev, serviceId: '' }));
                      }}>
                        <SelectTrigger className={cn("z-10", errors.serviceId ? "border-red-500" : "")}>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {availableServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.serviceId && <p className="text-sm text-red-600">{errors.serviceId}</p>}
                    </div>

                    {/* Rate Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="rateAmount">Rate: *</Label>
                      <Input
                        id="rateAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={createFormData.rateAmount}
                        onChange={(e) => {
                          setCreateFormData(prev => ({ ...prev, rateAmount: e.target.value }));
                          if (errors.rateAmount) setErrors(prev => ({ ...prev, rateAmount: '' }));
                        }}
                        placeholder="0.00"
                        className={errors.rateAmount ? "border-red-500" : ""}
                      />
                      {errors.rateAmount && <p className="text-sm text-red-600">{errors.rateAmount}</p>}
                    </div>
                  </div>
                )}
                
                {/* Hours/Minutes-specific fields - only show when Hours/Minutes is selected */}
                {createFormData.payBasedOn === 'hours_minutes' && (
                  <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                    {/* Hours/Minutes Rate Mode - Radio Group */}
                    <div className="space-y-3">
                      <Label>Rate Type *</Label>
                      <RadioGroup
                        value={createFormData.hoursMinutesMode}
                        onValueChange={(value) => {
                          setCreateFormData(prev => ({ ...prev, hoursMinutesMode: value }));
                          if (errors.hoursMinutesMode) setErrors(prev => ({ ...prev, hoursMinutesMode: '' }));
                        }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rate_per_hour" id="rate-per-hour" />
                          <Label htmlFor="rate-per-hour" className="cursor-pointer">Rate per Hour</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rate_per_minutes_pro_rata" id="rate-per-minutes-pro-rata" />
                          <Label htmlFor="rate-per-minutes-pro-rata" className="cursor-pointer">Rate per Minutes (Pro Rata)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rate_per_minutes_flat_rate" id="rate-per-minutes-flat-rate" />
                          <Label htmlFor="rate-per-minutes-flat-rate" className="cursor-pointer">Rate per Minutes (Flat Rate)</Label>
                        </div>
                      </RadioGroup>
                      {errors.hoursMinutesMode && <p className="text-sm text-red-600">{errors.hoursMinutesMode}</p>}
                    </div>

                    {/* Rate per Hour fields */}
                    {createFormData.hoursMinutesMode === 'rate_per_hour' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="hourlyRate">Rate: *</Label>
                          <Input
                            id="hourlyRate"
                            type="number"
                            step="0.01"
                            min="0"
                            value={createFormData.hourlyRate}
                            onChange={(e) => {
                              setCreateFormData(prev => ({ ...prev, hourlyRate: e.target.value }));
                              if (errors.hourlyRate) setErrors(prev => ({ ...prev, hourlyRate: '' }));
                            }}
                            placeholder="0.00"
                            className={errors.hourlyRate ? "border-red-500" : ""}
                          />
                          {errors.hourlyRate && <p className="text-sm text-red-600">{errors.hourlyRate}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="consecutiveHours">Consecutive Hours: *</Label>
                          <Input
                            id="consecutiveHours"
                            type="number"
                            step="0.01"
                            min="0"
                            value={createFormData.consecutiveHours}
                            onChange={(e) => {
                              setCreateFormData(prev => ({ ...prev, consecutiveHours: e.target.value }));
                              if (errors.consecutiveHours) setErrors(prev => ({ ...prev, consecutiveHours: '' }));
                            }}
                            placeholder="0.00"
                            className={errors.consecutiveHours ? "border-red-500" : ""}
                          />
                          {errors.consecutiveHours && <p className="text-sm text-red-600">{errors.consecutiveHours}</p>}
                        </div>
                      </div>
                    )}

                    {/* Rate per Minutes fields */}
                    {(createFormData.hoursMinutesMode === 'rate_per_minutes_pro_rata' || createFormData.hoursMinutesMode === 'rate_per_minutes_flat_rate') && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Rate at Minutes: *</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="rate15Minutes" className="text-xs text-muted-foreground">15 Minutes</Label>
                              <Input
                                id="rate15Minutes"
                                type="number"
                                step="0.01"
                                min="0"
                                value={createFormData.rate15Minutes}
                                onChange={(e) => {
                                  setCreateFormData(prev => ({ ...prev, rate15Minutes: e.target.value }));
                                  if (errors.rate15Minutes) setErrors(prev => ({ ...prev, rate15Minutes: '' }));
                                }}
                                placeholder="0.00"
                                className={errors.rate15Minutes ? "border-red-500" : ""}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="rate30Minutes" className="text-xs text-muted-foreground">30 Minutes</Label>
                              <Input
                                id="rate30Minutes"
                                type="number"
                                step="0.01"
                                min="0"
                                value={createFormData.rate30Minutes}
                                onChange={(e) => {
                                  setCreateFormData(prev => ({ ...prev, rate30Minutes: e.target.value }));
                                  if (errors.rate30Minutes) setErrors(prev => ({ ...prev, rate30Minutes: '' }));
                                }}
                                placeholder="0.00"
                                className={errors.rate30Minutes ? "border-red-500" : ""}
                              />
                              {errors.rate30Minutes && <p className="text-xs text-red-600">{errors.rate30Minutes}</p>}
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="rate45Minutes" className="text-xs text-muted-foreground">45 Minutes</Label>
                              <Input
                                id="rate45Minutes"
                                type="number"
                                step="0.01"
                                min="0"
                                value={createFormData.rate45Minutes}
                                onChange={(e) => {
                                  setCreateFormData(prev => ({ ...prev, rate45Minutes: e.target.value }));
                                  if (errors.rate45Minutes) setErrors(prev => ({ ...prev, rate45Minutes: '' }));
                                }}
                                placeholder="0.00"
                                className={errors.rate45Minutes ? "border-red-500" : ""}
                              />
                              {errors.rate45Minutes && <p className="text-xs text-red-600">{errors.rate45Minutes}</p>}
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="rate60Minutes" className="text-xs text-muted-foreground">60 Minutes</Label>
                              <Input
                                id="rate60Minutes"
                                type="number"
                                step="0.01"
                                min="0"
                                value={createFormData.rate60Minutes}
                                onChange={(e) => {
                                  setCreateFormData(prev => ({ ...prev, rate60Minutes: e.target.value }));
                                  if (errors.rate60Minutes) setErrors(prev => ({ ...prev, rate60Minutes: '' }));
                                }}
                                placeholder="0.00"
                                className={errors.rate60Minutes ? "border-red-500" : ""}
                              />
                              {errors.rate60Minutes && <p className="text-xs text-red-600">{errors.rate60Minutes}</p>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="consecutiveHoursMinutes">Consecutive Hours: *</Label>
                          <Input
                            id="consecutiveHoursMinutes"
                            type="number"
                            step="0.01"
                            min="0"
                            value={createFormData.consecutiveHours}
                            onChange={(e) => {
                              setCreateFormData(prev => ({ ...prev, consecutiveHours: e.target.value }));
                              if (errors.consecutiveHours) setErrors(prev => ({ ...prev, consecutiveHours: '' }));
                            }}
                            placeholder="0.00"
                            className={errors.consecutiveHours ? "border-red-500" : ""}
                          />
                          {errors.consecutiveHours && <p className="text-sm text-red-600">{errors.consecutiveHours}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Days Selection */}
                <div className="space-y-2">
                  <Label>Days *</Label>
                  <div className="flex gap-2 flex-wrap">
                    {dayOptions.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.id}`}
                          checked={createFormData.selectedDays.includes(day.id)}
                          onCheckedChange={() => handleDayToggle(day.id)}
                        />
                        <Label htmlFor={`day-${day.id}`} className="cursor-pointer text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.selectedDays && <p className="text-sm text-red-600">{errors.selectedDays}</p>}
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="effectiveFrom">Effective From *</Label>
                    <Input
                      id="effectiveFrom"
                      type="time"
                      value={createFormData.effectiveFrom}
                      onChange={(e) => {
                        setCreateFormData(prev => ({ ...prev, effectiveFrom: e.target.value }));
                        if (errors.effectiveFrom) setErrors(prev => ({ ...prev, effectiveFrom: '' }));
                      }}
                      className={errors.effectiveFrom ? "border-red-500" : ""}
                    />
                    {errors.effectiveFrom && <p className="text-sm text-red-600">{errors.effectiveFrom}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="effectiveUntil">Effective Until *</Label>
                    <Input
                      id="effectiveUntil"
                      type="time"
                      value={createFormData.effectiveUntil}
                      onChange={(e) => {
                        setCreateFormData(prev => ({ ...prev, effectiveUntil: e.target.value }));
                        if (errors.effectiveUntil) setErrors(prev => ({ ...prev, effectiveUntil: '' }));
                      }}
                      className={errors.effectiveUntil ? "border-red-500" : ""}
                    />
                    {errors.effectiveUntil && <p className="text-sm text-red-600">{errors.effectiveUntil}</p>}
                  </div>
                </div>


                {/* VAT Question */}
                <div className="space-y-3">
                  <Label>Is this rate VATable? *</Label>
                  <RadioGroup
                    value={createFormData.isVatable}
                    onValueChange={(value) => {
                      setCreateFormData(prev => ({ ...prev, isVatable: value }));
                      if (errors.isVatable) setErrors(prev => ({ ...prev, isVatable: '' }));
                    }}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="vat-yes" />
                      <Label htmlFor="vat-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="vat-no" />
                      <Label htmlFor="vat-no" className="cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                  {errors.isVatable && <p className="text-sm text-red-600">{errors.isVatable}</p>}
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleCreateNewRate}>
                  + Add
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (showDefinedRateForm) {
      return (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Use a Defined Rate</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="authority">Authority *</Label>
                <Select value={selectedAuthority} onValueChange={(value) => {
                  setSelectedAuthority(value);
                  setSelectedRate(''); // Reset rate when authority changes
                  if (errors.authority) {
                    setErrors(prev => ({ ...prev, authority: '' }));
                  }
                }}>
                  <SelectTrigger className={errors.authority ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorities.map((authority) => (
                      <SelectItem key={authority} value={authority}>
                        {authority === 'local_authority' ? 'Local Authority' :
                         authority === 'nhs' ? 'NHS' :
                         authority === 'private' ? 'Private' :
                         authority === 'insurance' ? 'Insurance' :
                         authority === 'other' ? 'Other' : authority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.authority && (
                  <p className="text-sm text-red-600">{errors.authority}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate *</Label>
                <Select value={selectedRate} onValueChange={(value) => {
                  setSelectedRate(value);
                  if (errors.rate) {
                    setErrors(prev => ({ ...prev, rate: '' }));
                  }
                }} disabled={!selectedAuthority}>
                  <SelectTrigger className={errors.rate ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratesForAuthority.map((rate) => (
                      <SelectItem key={rate.id} value={rate.id}>
                        {rate.service_name} - £{rate.amount} ({rate.rate_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.rate && (
                  <p className="text-sm text-red-600">{errors.rate}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                          errors.startDate && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          if (errors.startDate) {
                            setErrors(prev => ({ ...prev, startDate: '' }));
                          }
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleAddRate}>
                  Add Rate
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    // Show Change by % form
    if (showChangeByPercentForm) {
      return (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Change by %</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Authority</Label>
                <Select 
                  value={percentChangeData.authority} 
                  onValueChange={(value) => setPercentChangeData({...percentChangeData, authority: value})}
                >
                  <SelectTrigger className={errors.authority ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select Authority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="local_authority">Local Authority</SelectItem>
                    <SelectItem value="nhs">NHS</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.authority && <p className="text-sm text-red-600">{errors.authority}</p>}
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <RadioGroup 
                  value={percentChangeData.type} 
                  onValueChange={(value) => setPercentChangeData({...percentChangeData, type: value})}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="increment" id="increment" />
                    <Label htmlFor="increment">Increment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="decrement" id="decrement" />
                    <Label htmlFor="decrement">Decrement</Label>
                  </div>
                </RadioGroup>
                {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label>Amount (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter percentage"
                  value={percentChangeData.amount}
                  onChange={(e) => setPercentChangeData({...percentChangeData, amount: e.target.value})}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !percentChangeData.startDate && "text-muted-foreground",
                          errors.startDate && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {percentChangeData.startDate ? format(percentChangeData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={percentChangeData.startDate}
                        onSelect={(date) => setPercentChangeData({...percentChangeData, startDate: date})}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !percentChangeData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {percentChangeData.endDate ? format(percentChangeData.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={percentChangeData.endDate}
                        onSelect={(date) => setPercentChangeData({...percentChangeData, endDate: date})}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleApplyPercentChange}>
                  Apply Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Rate</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rate-option">Set a new rate:</Label>
              <Select value={selectedOption} onValueChange={handleOptionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="use-defined">Use a Defined Rate</SelectItem>
                  <SelectItem value="create-new">Create a new rate</SelectItem>
                  <SelectItem value="change-by-percent">Change by %</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rate" : "Add New Rate"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_name">Service Name *</Label>
              <Input
                id="service_name"
                {...register("service_name")}
                placeholder="e.g. Standard Care"
                className={errors.service_name ? "border-red-500" : ""}
              />
              {errors.service_name && (
                <p className="text-sm text-red-600">{errors.service_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_code">Service Code *</Label>
              <Input
                id="service_code"
                {...register("service_code")}
                placeholder="e.g. SC001"
                className={errors.service_code ? "border-red-500" : ""}
              />
              {errors.service_code && (
                <p className="text-sm text-red-600">{errors.service_code.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate_type">Rate Type *</Label>
              <Select
                value={watchedValues.rate_type}
                onValueChange={(value) => setValue("rate_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rate type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rateTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rate_type && (
                <p className="text-sm text-red-600">{errors.rate_type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register("amount", { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective_from">Effective From *</Label>
              <Input
                id="effective_from"
                type="date"
                {...register("effective_from")}
                className={errors.effective_from ? "border-red-500" : ""}
              />
              {errors.effective_from && (
                <p className="text-sm text-red-600">{errors.effective_from.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="effective_to">Effective To</Label>
              <Input
                id="effective_to"
                type="date"
                {...register("effective_to")}
                className={errors.effective_to ? "border-red-500" : ""}
              />
              {errors.effective_to && (
                <p className="text-sm text-red-600">{errors.effective_to.message}</p>
              )}
              <div className="text-xs text-gray-500">Leave blank if no end date</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_type">Client Type *</Label>
              <Select
                value={watchedValues.client_type}
                onValueChange={(value) => setValue("client_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(clientTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_type && (
                <p className="text-sm text-red-600">{errors.client_type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="funding_source">Funding Source *</Label>
              <Select
                value={watchedValues.funding_source}
                onValueChange={(value) => setValue("funding_source", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funding source" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fundingSourceLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.funding_source && (
                <p className="text-sm text-red-600">{errors.funding_source.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Applicable Days *</Label>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Select the days this rate applies to</span>
              <div className="space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllDays}>
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAllDays}>
                  Clear All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {dayOptions.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.id}`}
                    checked={(watchedValues.applicable_days || []).includes(day.id)}
                    onCheckedChange={() => handleDayToggle(day.id)}
                  />
                  <Label htmlFor={`day-${day.id}`} className="cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.applicable_days && (
              <p className="text-sm text-red-600">{errors.applicable_days.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={watchedValues.status}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter additional details about this rate"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="is_default"
              checked={watchedValues.is_default}
              onCheckedChange={(checked) => setValue("is_default", !!checked)}
            />
            <Label htmlFor="is_default" className="cursor-pointer">
              Set as default rate for this service and client type
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? "Save Changes" : "Add Rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRateDialog;
