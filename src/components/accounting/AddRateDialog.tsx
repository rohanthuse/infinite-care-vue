
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RateType,
  ClientType,
  FundingSource,
  RateStatus,
  rateTypeLabels,
  clientTypeLabels,
  fundingSourceLabels,
  ServiceRate
} from "@/types/rate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { v4 as uuidv4 } from "uuid";

interface AddRateDialogProps {
  open: boolean;
  onClose: () => void;
  onAddRate: (rate: ServiceRate) => void;
  initialRate?: ServiceRate;
}

const AddRateDialog: React.FC<AddRateDialogProps> = ({
  open,
  onClose,
  onAddRate,
  initialRate
}) => {
  const isEditing = Boolean(initialRate);
  const [formData, setFormData] = useState<Partial<ServiceRate>>(
    initialRate || {
      serviceName: "",
      serviceCode: "",
      rateType: "hourly",
      amount: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: undefined,
      description: "",
      applicableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      clientType: "private",
      fundingSource: "self_funded",
      status: "active",
      isDefault: false
    }
  );

  const dayOptions = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ];

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const days = prev.applicableDays || [];
      if (days.includes(day)) {
        return {
          ...prev,
          applicableDays: days.filter((d) => d !== day),
        };
      } else {
        return {
          ...prev,
          applicableDays: [...days, day],
        };
      }
    });
  };

  const selectAllDays = () => {
    setFormData((prev) => ({
      ...prev,
      applicableDays: dayOptions.map((day) => day.id),
    }));
  };

  const clearAllDays = () => {
    setFormData((prev) => ({
      ...prev,
      applicableDays: [],
    }));
  };

  const handleSubmit = () => {
    const newRate: ServiceRate = {
      id: initialRate?.id || uuidv4(),
      serviceName: formData.serviceName || "",
      serviceCode: formData.serviceCode || "",
      rateType: formData.rateType as RateType || "hourly",
      amount: Number(formData.amount) || 0,
      effectiveFrom: formData.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: formData.effectiveTo,
      description: formData.description,
      applicableDays: formData.applicableDays || [],
      clientType: formData.clientType as ClientType || "private",
      fundingSource: formData.fundingSource as FundingSource || "self_funded",
      status: formData.status as RateStatus || "active",
      lastUpdated: new Date().toISOString().split('T')[0],
      createdBy: "Admin User",
      isDefault: Boolean(formData.isDefault)
    };

    onAddRate(newRate);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rate" : "Add New Rate"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name*</Label>
              <Input
                id="serviceName"
                value={formData.serviceName}
                onChange={(e) => handleChange("serviceName", e.target.value)}
                placeholder="e.g. Standard Care"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceCode">Service Code*</Label>
              <Input
                id="serviceCode"
                value={formData.serviceCode}
                onChange={(e) => handleChange("serviceCode", e.target.value)}
                placeholder="e.g. SC001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rateType">Rate Type*</Label>
              <Select
                value={formData.rateType}
                onValueChange={(value) => handleChange("rateType", value)}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£)*</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From*</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={formData.effectiveFrom?.toString().split('T')[0]}
                onChange={(e) => handleChange("effectiveFrom", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective To</Label>
              <Input
                id="effectiveTo"
                type="date"
                value={formData.effectiveTo?.toString().split('T')[0] || ""}
                onChange={(e) => handleChange("effectiveTo", e.target.value || undefined)}
              />
              <div className="text-xs text-gray-500">Leave blank if no end date</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientType">Client Type*</Label>
              <Select
                value={formData.clientType}
                onValueChange={(value) => handleChange("clientType", value)}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="fundingSource">Funding Source*</Label>
              <Select
                value={formData.fundingSource}
                onValueChange={(value) => handleChange("fundingSource", value)}
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
            </div>
          </div>

          <div className="space-y-2">
            <Label>Applicable Days*</Label>
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
                    checked={(formData.applicableDays || []).includes(day.id)}
                    onCheckedChange={() => handleDayToggle(day.id)}
                  />
                  <Label htmlFor={`day-${day.id}`} className="cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status*</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter additional details about this rate"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="isDefault"
              checked={Boolean(formData.isDefault)}
              onCheckedChange={(checked) => handleChange("isDefault", checked)}
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default rate for this service and client type
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Save Changes" : "Add Rate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRateDialog;
