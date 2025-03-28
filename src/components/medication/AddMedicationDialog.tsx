
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Clock, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  // Patient information
  patient: z.string({
    required_error: "Patient is required.",
  }),
  
  // Medication type
  medicationType: z.enum(["prescription", "nonPrescription", "controlled"], {
    required_error: "Medication type is required.",
  }),
  
  // Medication details
  name: z.string().min(2, {
    message: "Medication name must be at least 2 characters.",
  }),
  dosage: z.string().min(1, {
    message: "Dosage is required.",
  }),
  route: z.string({
    required_error: "Administration route is required."
  }),
  form: z.string().optional(),
  shape: z.string().optional(),
  color: z.string().optional(),
  strengthAmount: z.string().optional(),
  strengthUnit: z.string().optional(),
  
  // Dates
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
  
  // Prescription details
  prescribedBy: z.string().optional(),
  instructions: z.string().optional(),
  
  // Quantity tracking
  trackQuantity: z.boolean().default(false),
  quantity: z.string().optional(),
  reorderLevel: z.string().optional(),
  
  // Additional information
  notes: z.string().optional(),
  
  // This will be managed separately for dynamic shifts
  shifts: z.array(z.object({
    time: z.string(),
    days: z.array(z.string())
  })).optional(),
});

// Form sub-components
const MedicationTypeSection = ({ form }: { form: any }) => (
  <FormField
    control={form.control}
    name="medicationType"
    render={({ field }) => (
      <FormItem className="space-y-3">
        <FormLabel className="text-base font-semibold">Medication Type</FormLabel>
        <FormControl>
          <RadioGroup
            onValueChange={field.onChange}
            defaultValue={field.value}
            className="flex flex-col space-y-1"
          >
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <RadioGroupItem value="prescription" />
              </FormControl>
              <FormLabel className="font-normal">
                Prescription Medication
              </FormLabel>
            </FormItem>
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <RadioGroupItem value="nonPrescription" />
              </FormControl>
              <FormLabel className="font-normal">
                Non-Prescription Medication
              </FormLabel>
            </FormItem>
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <RadioGroupItem value="controlled" />
              </FormControl>
              <FormLabel className="font-normal">
                Controlled Substance
              </FormLabel>
            </FormItem>
          </RadioGroup>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

// Mock data
const mockPatients = [
  { id: "CL-3421", name: "Wendy Smith" },
  { id: "CL-2356", name: "John Michael" },
  { id: "CL-9876", name: "Lisa Rodrigues" },
  { id: "CL-5432", name: "Kate Williams" },
  { id: "CL-7890", name: "Robert Johnson" },
  { id: "CL-1122", name: "Emma Thompson" },
  { id: "CL-3344", name: "David Wilson" },
  { id: "CL-5566", name: "Olivia Parker" },
];

const mockPrescribers = [
  { id: "DOC-001", name: "Dr. James Wilson" },
  { id: "DOC-002", name: "Dr. Emma Thompson" },
  { id: "DOC-003", name: "Dr. Michael Scott" },
];

const administrationRoutes = [
  { value: "oral", label: "Oral" },
  { value: "topical", label: "Topical" },
  { value: "sublingual", label: "Sublingual" },
  { value: "inhalation", label: "Inhalation" },
  { value: "rectal", label: "Rectal" },
  { value: "intravenous", label: "Intravenous (IV)" },
  { value: "intramuscular", label: "Intramuscular (IM)" },
  { value: "subcutaneous", label: "Subcutaneous" },
  { value: "ophthalmic", label: "Ophthalmic (Eye)" },
  { value: "otic", label: "Otic (Ear)" },
  { value: "nasal", label: "Nasal" },
];

const medicationForms = [
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "liquid", label: "Liquid" },
  { value: "cream", label: "Cream" },
  { value: "ointment", label: "Ointment" },
  { value: "patch", label: "Patch" },
  { value: "inhaler", label: "Inhaler" },
  { value: "injection", label: "Injection" },
  { value: "suppository", label: "Suppository" },
  { value: "drops", label: "Drops" },
];

const strengthUnits = [
  { value: "mg", label: "mg" },
  { value: "mcg", label: "mcg" },
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "percentage", label: "%" },
  { value: "units", label: "units" },
];

export const AddMedicationDialog = ({ open, onOpenChange }: AddMedicationDialogProps) => {
  const [shifts, setShifts] = useState<{ time: string; days: string[] }[]>([
    { time: "", days: [] }
  ]);
  
  const [trackQuantity, setTrackQuantity] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicationType: "prescription",
      name: "",
      dosage: "",
      route: "",
      form: "",
      shape: "",
      color: "",
      strengthAmount: "",
      strengthUnit: "",
      instructions: "",
      notes: "",
      trackQuantity: false,
      quantity: "",
      reorderLevel: "",
    },
  });

  const medicationType = form.watch("medicationType");

  const handleAddShift = () => {
    setShifts([...shifts, { time: "", days: [] }]);
  };

  const handleRemoveShift = (index: number) => {
    if (shifts.length > 1) {
      const newShifts = [...shifts];
      newShifts.splice(index, 1);
      setShifts(newShifts);
    }
  };

  const handleShiftTimeChange = (index: number, time: string) => {
    const newShifts = [...shifts];
    newShifts[index].time = time;
    setShifts(newShifts);
  };

  const handleDayToggle = (index: number, day: string) => {
    const newShifts = [...shifts];
    const dayIndex = newShifts[index].days.indexOf(day);
    
    if (dayIndex === -1) {
      newShifts[index].days.push(day);
    } else {
      newShifts[index].days.splice(dayIndex, 1);
    }
    
    setShifts(newShifts);
  };

  const isDaySelected = (shiftIndex: number, day: string) => {
    return shifts[shiftIndex].days.includes(day);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Add shifts to the form data
    const formData = {
      ...values,
      shifts
    };
    
    console.log(formData);
    toast.success("Medication added successfully", {
      description: `${values.name} has been added for ${mockPatients.find(p => p.id === values.patient)?.name}.`,
    });
    form.reset();
    setShifts([{ time: "", days: [] }]);
    setTrackQuantity(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Add New Medication</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Patient Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Patient</h3>
              <FormField
                control={form.control}
                name="patient"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockPatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} ({patient.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 2: Medication Type */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <MedicationTypeSection form={form} />
            </div>

            {/* Section 3: Medication Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medication Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter medication name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="form"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select form" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {medicationForms.map((form) => (
                            <SelectItem key={form.value} value={form.value}>
                              {form.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shape"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shape</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Round, Oval" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. White, Blue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="strengthAmount"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Strength/Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter strength amount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strengthUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {strengthUnits.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Administration Route*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a route" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {administrationRoutes.map((route) => (
                            <SelectItem key={route.value} value={route.value}>
                              {route.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 1 tablet, 5ml" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 4: Duration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Duration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 5: Prescription Details (conditional based on medication type) */}
            {medicationType === "prescription" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Prescription Details</h3>
                
                <FormField
                  control={form.control}
                  name="prescribedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prescribed By</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a prescriber" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockPrescribers.map((prescriber) => (
                            <SelectItem key={prescriber.id} value={prescriber.id}>
                              {prescriber.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Special instructions from prescriber"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Section 6: Shift Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Shift Management</h3>
              <p className="text-sm text-gray-500">When should this medication be administered?</p>

              {shifts.map((shift, index) => (
                <div key={index} className="p-4 border rounded-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Shift {index + 1}</h4>
                    {shifts.length > 1 && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveShift(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-4">
                    <div>
                      <label className="text-sm font-medium">Time</label>
                      <div className="relative">
                        <Input 
                          type="time" 
                          value={shift.time} 
                          onChange={(e) => handleShiftTimeChange(index, e.target.value)}
                        />
                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Days</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <button
                            key={day}
                            type="button"
                            className={`px-3 py-1 text-sm rounded-full ${
                              isDaySelected(index, day)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => handleDayToggle(index, day)}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddShift}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Another Shift
              </Button>
            </div>

            {/* Section 7: Quantity Tracking */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="trackQuantity" 
                  checked={trackQuantity}
                  onCheckedChange={(checked) => {
                    setTrackQuantity(checked as boolean);
                    form.setValue("trackQuantity", checked as boolean);
                  }}
                />
                <label
                  htmlFor="trackQuantity"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Track Quantity
                </label>
              </div>

              {trackQuantity && (
                <div className="grid grid-cols-2 gap-4 pt-3">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reorderLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Level</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 5" {...field} />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          You'll be notified when stock reaches this level
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Section 8: Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information about this medication"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Medication</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
