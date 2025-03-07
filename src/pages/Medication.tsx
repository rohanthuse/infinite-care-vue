
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import { 
  Plus, Search, Trash2, Edit, Calendar, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Sample medication data
const initialMedications = [
  {
    id: "1",
    name: "Paracetamol",
    dosage: "500mg",
    morning: { enabled: true, time: "08:00" },
    lunch: { enabled: false, time: "13:00" },
    evening: { enabled: true, time: "19:00" },
    night: { enabled: false, time: "22:00" },
    startDate: "2023-03-15",
    endDate: "2023-04-15",
    notes: "Take with food"
  },
  {
    id: "2",
    name: "Ibuprofen",
    dosage: "400mg",
    morning: { enabled: false, time: "08:00" },
    lunch: { enabled: true, time: "13:00" },
    evening: { enabled: true, time: "19:00" },
    night: { enabled: false, time: "22:00" },
    startDate: "2023-03-10",
    endDate: "2023-03-25",
    notes: "Take after meals"
  },
  {
    id: "3",
    name: "Amoxicillin",
    dosage: "250mg",
    morning: { enabled: true, time: "07:30" },
    lunch: { enabled: true, time: "12:30" },
    evening: { enabled: true, time: "18:30" },
    night: { enabled: false, time: "21:30" },
    startDate: "2023-03-05",
    endDate: "2023-03-15",
    notes: "Complete full course"
  }
];

// Form schema for adding/editing medications
const medicationFormSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  morning: z.object({
    enabled: z.boolean().default(false),
    time: z.string().optional()
  }),
  lunch: z.object({
    enabled: z.boolean().default(false),
    time: z.string().optional()
  }),
  evening: z.object({
    enabled: z.boolean().default(false),
    time: z.string().optional()
  }),
  night: z.object({
    enabled: z.boolean().default(false),
    time: z.string().optional()
  }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  notes: z.string().optional()
});

type MedicationFormValues = z.infer<typeof medicationFormSchema>;

const Medication = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [medications, setMedications] = useState(initialMedications);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<string | null>(null);
  
  // Handle tab navigation
  const handleChangeTab = (value: string) => {
    if (id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      navigate(`/${value}`);
    }
  };

  // Initialize the form with react-hook-form
  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: "",
      dosage: "",
      morning: { enabled: false, time: "08:00" },
      lunch: { enabled: false, time: "13:00" },
      evening: { enabled: false, time: "19:00" },
      night: { enabled: false, time: "22:00" },
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      notes: ""
    }
  });

  // Filter medications based on search query
  const filteredMedications = medications.filter(medication => 
    medication.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medication.dosage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open edit dialog and populate form with medication data
  const handleEditMedication = (medicationId: string) => {
    const medication = medications.find(med => med.id === medicationId);
    if (medication) {
      form.reset({
        name: medication.name,
        dosage: medication.dosage,
        morning: medication.morning,
        lunch: medication.lunch,
        evening: medication.evening,
        night: medication.night,
        startDate: medication.startDate,
        endDate: medication.endDate,
        notes: medication.notes
      });
      setEditingMedication(medicationId);
      setIsAddDialogOpen(true);
    }
  };

  // Delete medication
  const handleDeleteMedication = (medicationId: string) => {
    setMedications(medications.filter(med => med.id !== medicationId));
    toast.success("Medication deleted successfully");
  };

  // Submit form handler
  const onSubmit = (data: MedicationFormValues) => {
    if (editingMedication) {
      // Update existing medication
      setMedications(medications.map(med => 
        med.id === editingMedication ? { ...data, id: med.id } : med
      ));
      toast.success("Medication updated successfully");
    } else {
      // Add new medication
      const newMedication = {
        ...data,
        id: Date.now().toString()
      };
      setMedications([...medications, newMedication]);
      toast.success("Medication added successfully");
    }
    setIsAddDialogOpen(false);
    setEditingMedication(null);
    form.reset({
      name: "",
      dosage: "",
      morning: { enabled: false, time: "08:00" },
      lunch: { enabled: false, time: "13:00" },
      evening: { enabled: false, time: "19:00" },
      night: { enabled: false, time: "22:00" },
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      notes: ""
    });
  };

  // Reset form when dialog closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setEditingMedication(null);
      form.reset({
        name: "",
        dosage: "",
        morning: { enabled: false, time: "08:00" },
        lunch: { enabled: false, time: "13:00" },
        evening: { enabled: false, time: "19:00" },
        night: { enabled: false, time: "22:00" },
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        notes: ""
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {id && branchName && (
          <BranchHeader 
            id={id} 
            branchName={branchName} 
            onNewBooking={() => {}}
          />
        )}
        
        <TabNavigation 
          activeTab="medication" 
          onChange={handleChangeTab}
          hideQuickAdd={true}
        />
        
        <div className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-gray-500" />
              <h1 className="text-2xl font-bold text-gray-800">Medication Management</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setEditingMedication(null);
                  setIsAddDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>
          </div>
          
          <div className="flex mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search medications..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-md shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-600">
                  <TableHead className="text-white">Medication</TableHead>
                  <TableHead className="text-white">Dosage</TableHead>
                  <TableHead className="text-white text-center">Morning</TableHead>
                  <TableHead className="text-white text-center">Lunch</TableHead>
                  <TableHead className="text-white text-center">Evening</TableHead>
                  <TableHead className="text-white text-center">Night</TableHead>
                  <TableHead className="text-white">Start Date</TableHead>
                  <TableHead className="text-white">End Date</TableHead>
                  <TableHead className="text-white">Notes</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedications.length > 0 ? (
                  filteredMedications.map((medication) => (
                    <TableRow key={medication.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{medication.name}</TableCell>
                      <TableCell>{medication.dosage}</TableCell>
                      <TableCell className="text-center">
                        {medication.morning.enabled ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            {medication.morning.time}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {medication.lunch.enabled ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {medication.lunch.time}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {medication.evening.enabled ? (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                            {medication.evening.time}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {medication.night.enabled ? (
                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                            {medication.night.time}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{medication.startDate}</TableCell>
                      <TableCell>{medication.endDate || <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={medication.notes}>
                        {medication.notes || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditMedication(medication.id)}
                          className="h-8 w-8 p-0 mr-1"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteMedication(medication.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 text-gray-500">
                      No medications found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Add/Edit Medication Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMedication ? "Edit Medication" : "Add New Medication"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter medication name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 500mg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <Label className="text-base font-medium mb-3 block">Dosage Schedule</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Morning Dosage */}
                  <Card className="border-2 border-amber-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <FormField
                          control={form.control}
                          name="morning.enabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Morning (AM)
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="morning.time"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <FormControl>
                                <Input 
                                  type="time" 
                                  {...field} 
                                  disabled={!form.watch("morning.enabled")}
                                  className="flex-1" 
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Lunch Dosage */}
                  <Card className="border-2 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <FormField
                          control={form.control}
                          name="lunch.enabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Lunch
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="lunch.time"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <FormControl>
                                <Input 
                                  type="time" 
                                  {...field} 
                                  disabled={!form.watch("lunch.enabled")}
                                  className="flex-1" 
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Evening Dosage */}
                  <Card className="border-2 border-orange-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <FormField
                          control={form.control}
                          name="evening.enabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Evening (PM)
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="evening.time"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-orange-500" />
                              <FormControl>
                                <Input 
                                  type="time" 
                                  {...field} 
                                  disabled={!form.watch("evening.enabled")}
                                  className="flex-1" 
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Night Dosage */}
                  <Card className="border-2 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <FormField
                          control={form.control}
                          name="night.enabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Night
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="night.time"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-purple-500" />
                              <FormControl>
                                <Input 
                                  type="time" 
                                  {...field} 
                                  disabled={!form.watch("night.enabled")}
                                  className="flex-1" 
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional. Leave empty for ongoing medication.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Any special instructions or notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{editingMedication ? "Update" : "Add"} Medication</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Medication;
