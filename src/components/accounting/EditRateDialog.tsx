
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  ServiceRate, RateType, ClientType, FundingSource, RateStatus, 
  rateTypeLabels, clientTypeLabels, fundingSourceLabels, rateStatusLabels 
} from "@/types/rate";
import { CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EditRateDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdateRate: (rateId: string, rateData: any) => void;
  rate: ServiceRate | null;
}

// Form data interface with proper typing for dates
interface RateFormData extends Omit<Partial<ServiceRate>, 'effectiveFrom' | 'effectiveTo'> {
  effectiveFromDate?: Date;
  effectiveToDate?: Date;
}

const dayOptions = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" }
];

const EditRateDialog: React.FC<EditRateDialogProps> = ({
  open,
  onClose,
  onUpdateRate,
  rate
}) => {
  const [formData, setFormData] = useState<RateFormData>({});
  const [isAllDaysSelected, setIsAllDaysSelected] = useState(false);

  useEffect(() => {
    if (rate) {
      setFormData({
        ...rate,
        effectiveFromDate: rate.effectiveFrom ? new Date(rate.effectiveFrom) : undefined,
        effectiveToDate: rate.effectiveTo ? new Date(rate.effectiveTo) : undefined,
        amount: rate.amount,
      });
      setIsAllDaysSelected(rate.applicableDays.length === 7);
    }
  }, [rate]);

  if (!rate) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day: string) => {
    const applicableDays = formData.applicableDays || [];
    const updatedDays = applicableDays.includes(day) 
      ? applicableDays.filter(d => d !== day)
      : [...applicableDays, day];
    
    setFormData(prev => ({ ...prev, applicableDays: updatedDays }));
    setIsAllDaysSelected(updatedDays.length === 7);
  };

  const toggleAllDays = () => {
    const newValue = !isAllDaysSelected;
    setIsAllDaysSelected(newValue);

    if (newValue) {
      setFormData(prev => ({ ...prev, applicableDays: dayOptions.map(day => day.id) }));
    } else {
      setFormData(prev => ({ ...prev, applicableDays: [] }));
    }
  };

  const handleEffectiveFromChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, effectiveFromDate: date }));
  };

  const handleEffectiveToChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, effectiveToDate: date }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceName || !formData.serviceCode || !formData.amount || !formData.effectiveFromDate) {
      alert("Please fill in all required fields");
      return;
    }

    // Convert Date objects to ISO strings for submission
    const submissionData = {
      ...formData,
      effectiveFrom: formData.effectiveFromDate?.toISOString(),
      effectiveTo: formData.effectiveToDate?.toISOString(),
      lastUpdated: new Date().toISOString(),
      amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
    };

    // Remove the Date objects from submission
    delete (submissionData as any).effectiveFromDate;
    delete (submissionData as any).effectiveToDate;

    onUpdateRate(rate.id, submissionData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Rate</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceName" className="text-sm font-medium">
                Service Name*
              </Label>
              <Input
                id="serviceName"
                name="serviceName"
                value={formData.serviceName || ''}
                onChange={handleInputChange}
                placeholder="Enter service name"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="serviceCode" className="text-sm font-medium">
                Service Code*
              </Label>
              <Input
                id="serviceCode"
                name="serviceCode"
                value={formData.serviceCode || ''}
                onChange={handleInputChange}
                placeholder="Enter service code"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rateType" className="text-sm font-medium">
                Rate Type*
              </Label>
              <Select
                value={formData.rateType}
                onValueChange={handleSelectChange("rateType")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">{rateTypeLabels.hourly}</SelectItem>
                  <SelectItem value="daily">{rateTypeLabels.daily}</SelectItem>
                  <SelectItem value="weekly">{rateTypeLabels.weekly}</SelectItem>
                  <SelectItem value="per_visit">{rateTypeLabels.per_visit}</SelectItem>
                  <SelectItem value="fixed">{rateTypeLabels.fixed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount (£)*
              </Label>
              <Input
                id="amount"
                name="amount"
                value={formData.amount?.toString() || ''}
                onChange={handleInputChange}
                placeholder="0.00"
                className="mt-1"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Status*
              </Label>
              <Select
                value={formData.status}
                onValueChange={handleSelectChange("status")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{rateStatusLabels.active}</SelectItem>
                  <SelectItem value="pending">{rateStatusLabels.pending}</SelectItem>
                  <SelectItem value="expired">{rateStatusLabels.expired}</SelectItem>
                  <SelectItem value="discontinued">{rateStatusLabels.discontinued}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effectiveFrom" className="text-sm font-medium">
                Effective From*
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !formData.effectiveFromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.effectiveFromDate ? format(formData.effectiveFromDate, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.effectiveFromDate}
                    onSelect={handleEffectiveFromChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="effectiveTo" className="text-sm font-medium">
                Effective To (optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !formData.effectiveToDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.effectiveToDate ? format(formData.effectiveToDate, "PPP") : <span>Ongoing</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.effectiveToDate}
                    onSelect={handleEffectiveToChange}
                    initialFocus
                    fromDate={formData.effectiveFromDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientType" className="text-sm font-medium">
                Client Type*
              </Label>
              <Select
                value={formData.clientType}
                onValueChange={handleSelectChange("clientType")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">{clientTypeLabels.private}</SelectItem>
                  <SelectItem value="local_authority">{clientTypeLabels.local_authority}</SelectItem>
                  <SelectItem value="nhs">{clientTypeLabels.nhs}</SelectItem>
                  <SelectItem value="insurance">{clientTypeLabels.insurance}</SelectItem>
                  <SelectItem value="charity">{clientTypeLabels.charity}</SelectItem>
                  <SelectItem value="other">{clientTypeLabels.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fundingSource" className="text-sm font-medium">
                Funding Source*
              </Label>
              <Select
                value={formData.fundingSource}
                onValueChange={handleSelectChange("fundingSource")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_funded">{fundingSourceLabels.self_funded}</SelectItem>
                  <SelectItem value="local_authority">{fundingSourceLabels.local_authority}</SelectItem>
                  <SelectItem value="nhs">{fundingSourceLabels.nhs}</SelectItem>
                  <SelectItem value="insurance">{fundingSourceLabels.insurance}</SelectItem>
                  <SelectItem value="combined">{fundingSourceLabels.combined}</SelectItem>
                  <SelectItem value="other">{fundingSourceLabels.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Applicable Days</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="allDays" className="text-xs text-gray-500">
                  All days
                </Label>
                <Switch
                  id="allDays"
                  checked={isAllDaysSelected}
                  onCheckedChange={toggleAllDays}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {dayOptions.map(day => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.id}
                    checked={formData.applicableDays?.includes(day.id) || false}
                    onCheckedChange={() => handleDayToggle(day.id)}
                  />
                  <Label htmlFor={day.id} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Add a description for this rate"
              className="mt-1 h-20"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isDefault: checked === true }))
              }
            />
            <Label htmlFor="isDefault" className="text-sm">
              Set as default rate for this service
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRateDialog;
