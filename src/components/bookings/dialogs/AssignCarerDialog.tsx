import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
import { Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

const assignCarerSchema = z.object({
  carerId: z.string().min(1, { message: "Please select a carer" }),
});

interface AssignCarerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    client_name?: string;
    service_name?: string;
    start_time: string;
    end_time: string;
    date?: string;
    clientName?: string;
    notes?: string;
  };
  carers: Array<{ 
    id: string; 
    name?: string; 
    first_name?: string; 
    last_name?: string; 
    initials?: string;
    status?: string;
  }>;
  branchId?: string;
}

export function AssignCarerDialog({
  open,
  onOpenChange,
  booking,
  carers,
  branchId,
}: AssignCarerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const updateBookingMutation = useUpdateBooking(branchId);

  // Filter and sort carers based on search query and availability
  const filteredCarers = useMemo(() => {
    let filtered = carers;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = carers.filter(carer => {
        const carerName = (carer.name || `${carer.first_name} ${carer.last_name}`).toLowerCase();
        return carerName.includes(query);
      });
    }
    
    // Sort by active status first, then by name
    return filtered.sort((a, b) => {
      // Active carers first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      
      // Then by name
      const nameA = a.name || `${a.first_name} ${a.last_name}`;
      const nameB = b.name || `${b.first_name} ${b.last_name}`;
      return nameA.localeCompare(nameB);
    });
  }, [carers, searchQuery]);

  const form = useForm<z.infer<typeof assignCarerSchema>>({
    resolver: zodResolver(assignCarerSchema),
    defaultValues: {
      carerId: "",
    },
  });

  function onSubmit(data: z.infer<typeof assignCarerSchema>) {
    const selectedCarer = carers.find(c => c.id === data.carerId);
    
    updateBookingMutation.mutate({
      bookingId: booking.id,
      updatedData: {
        staff_id: data.carerId,
        status: "assigned",
      },
    }, {
      onSuccess: () => {
        toast.success("Carer assigned successfully!", {
          description: `${selectedCarer?.name || `${selectedCarer?.first_name} ${selectedCarer?.last_name}`} has been assigned to this booking.`,
        });
        form.reset();
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Failed to assign carer", {
          description: error.message || "An unexpected error occurred.",
        });
      },
    });
  }

  const formatBookingTime = () => {
    try {
      if (booking.date) {
        const bookingDate = parseISO(booking.date);
        return format(bookingDate, "PPP");
      }
      return "Date not specified";
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <User className="h-5 w-5" />
            Assign Carer to Booking
          </DialogTitle>
          <DialogDescription>
            Select a carer to assign to this unassigned booking.
          </DialogDescription>
          
          {/* Booking Details */}
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Client:</span>
                <span>{booking.client_name || booking.clientName || "Unknown Client"}</span>
              </div>
              
              {booking.service_name && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Service:</span>
                  <span>{booking.service_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Time:</span>
                <span>{booking.start_time} - {booking.end_time}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 flex items-center justify-center text-amber-600">
                  📅
                </div>
                <span className="font-medium">Date:</span>
                <span>{formatBookingTime()}</span>
              </div>

              {booking.notes && (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-medium">Notes:</span> {booking.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Search Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search Carers</label>
              <Input
                placeholder="Search by carer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Carer Selection */}
            <FormField
              control={form.control}
              name="carerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Carer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a carer to assign..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px] dialog-scrollable">
                      {filteredCarers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {searchQuery ? "No carers found matching your search" : "No carers available"}
                        </div>
                      ) : (
                        filteredCarers.map((carer) => {
                          const carerName = carer.name || `${carer.first_name} ${carer.last_name}`;
                          const isActive = carer.status === 'active';
                          
                          return (
                            <SelectItem key={carer.id} value={carer.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                    isActive 
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                                  }`}>
                                    {carer.initials || carerName.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <span>{carerName}</span>
                                </div>
                                <Badge 
                                  variant={isActive ? "default" : "secondary"} 
                                  className="text-xs"
                                >
                                  {carer.status || 'active'}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateBookingMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {updateBookingMutation.isPending ? "Assigning..." : "Assign Carer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}