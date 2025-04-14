
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TravelRecord, VehicleType, vehicleTypeLabels } from "@/types/travel";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddTravelRecordDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (travelData: Omit<TravelRecord, "id" | "status" | "createdBy">) => void;
  initialData?: TravelRecord;
  isEditing?: boolean;
}

const AddTravelRecordDialog: React.FC<AddTravelRecordDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditing = false,
}) => {
  const [date, setDate] = useState<Date | undefined>(
    initialData ? new Date(initialData.date) : new Date()
  );
  const [startLocation, setStartLocation] = useState(initialData?.startLocation || "");
  const [endLocation, setEndLocation] = useState(initialData?.endLocation || "");
  const [distance, setDistance] = useState<number>(initialData?.distance || 0);
  const [duration, setDuration] = useState<number>(initialData?.duration || 0);
  const [purpose, setPurpose] = useState(initialData?.purpose || "");
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    initialData?.vehicleType || "car_personal"
  );
  const [costPerMile, setCostPerMile] = useState<number>(
    initialData?.costPerMile || 0.45
  );
  const [totalCost, setTotalCost] = useState<number>(initialData?.totalCost || 0);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [clientName, setClientName] = useState(initialData?.clientName || "");
  const [carerName, setCarerName] = useState(initialData?.carerName || "");

  // Calculate total cost based on distance and cost per mile
  useEffect(() => {
    if (vehicleType === 'car_personal' || vehicleType === 'car_company') {
      setTotalCost(parseFloat((distance * costPerMile).toFixed(2)));
    }
  }, [distance, costPerMile, vehicleType]);

  const handleSave = () => {
    if (!date || !startLocation || !endLocation || distance <= 0 || !purpose) {
      return; // Form validation failed
    }

    const travelData: Omit<TravelRecord, "id" | "status" | "createdBy"> = {
      date: format(date, "yyyy-MM-dd"),
      startLocation,
      endLocation,
      distance,
      duration,
      purpose,
      vehicleType,
      costPerMile,
      totalCost,
      notes: notes || undefined,
      clientName: clientName || undefined,
      carerName: carerName || undefined,
      carerId: undefined,
      receiptImage: undefined,
    };

    onSave(travelData);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Travel Record" : "Add New Travel Record"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={(value: VehicleType) => setVehicleType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startLocation">Start Location</Label>
              <Input
                id="startLocation"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Starting point"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endLocation">End Location</Label>
              <Input
                id="endLocation"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                placeholder="Destination"
              />
            </div>
          </div>

          {/* Distance and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (miles)</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                min="0"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                step="1"
                min="0"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Cost section */}
            {(vehicleType === 'car_personal' || vehicleType === 'car_company') ? (
              <div className="space-y-2">
                <Label htmlFor="costPerMile">Cost per Mile (£)</Label>
                <Input
                  id="costPerMile"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerMile}
                  onChange={(e) => setCostPerMile(parseFloat(e.target.value) || 0)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="totalCost">Total Cost (£)</Label>
                <Input
                  id="totalCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalCost}
                  onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Reason for travel"
            />
          </div>

          {/* Client and Carer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name (if applicable)</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carerName">Carer Name</Label>
              <Input
                id="carerName"
                value={carerName}
                onChange={(e) => setCarerName(e.target.value)}
                placeholder="Who made this journey"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details"
              rows={3}
            />
          </div>

          {/* Calculated total */}
          {vehicleType === 'car_personal' || vehicleType === 'car_company' ? (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Cost:</span>
                <span className="font-bold">£{totalCost.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Calculated as {distance.toFixed(1)} miles × £{costPerMile.toFixed(2)} per mile
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? "Update" : "Save"} Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTravelRecordDialog;
