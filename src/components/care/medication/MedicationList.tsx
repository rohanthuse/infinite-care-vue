import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status?: string;
  shape?: string;
  route?: string;
  who_administers?: string;
  level?: string;
  instruction?: string;
  warning?: string;
  side_effect?: string;
}

interface MedicationListProps {
  medications: Medication[];
  onView: (medication: Medication) => void;
  onEdit: (medication: Medication) => void;
  onDelete: (medication: Medication) => void;
}

export function MedicationList({ medications, onView, onEdit, onDelete }: MedicationListProps) {
  const formatFrequency = (frequency: string) => {
    // Handle weekly with day: "weekly_monday" format
    if (frequency.startsWith("weekly_")) {
      const day = frequency.split("_")[1];
      const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
      return `Weekly (${dayLabel})`;
    }
    
    const freqMap: Record<string, string> = {
      once_daily: "Once daily",
      twice_daily: "Twice daily", 
      three_times_daily: "Three times daily",
      four_times_daily: "Four times daily",
      every_other_day: "Every other day",
      weekly: "Weekly",
      monthly: "Monthly",
      as_needed: "As needed"
    };
    return freqMap[frequency] || frequency;
  };

  const getSource = (medication: Medication) => {
    return medication.id?.startsWith("med-") ? "Local" : "Saved";
  };

  if (medications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No medications added yet. Use the calendar above to add medications.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Medications List</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Dosage</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medications.map((medication, index) => (
            <TableRow key={medication.id || index}>
              <TableCell className="font-medium">{medication.name}</TableCell>
              <TableCell>{medication.dosage}</TableCell>
              <TableCell>{formatFrequency(medication.frequency)}</TableCell>
              <TableCell>{medication.start_date}</TableCell>
              <TableCell>{medication.end_date || "—"}</TableCell>
              <TableCell>
                <Badge variant={medication.status === "active" ? "default" : "secondary"}>
                  {medication.status || "active"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getSource(medication) === "Local" ? "outline" : "secondary"}>
                  {getSource(medication)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <TooltipProvider>
                  <div className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(medication)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View details</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(medication)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit medication</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(medication)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete medication</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}