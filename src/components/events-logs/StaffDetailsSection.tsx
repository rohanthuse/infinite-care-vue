
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface StaffDetailsSectionProps {
  staff: Array<{ id: string; name: string }>;
  form: UseFormReturn<any>;
}

export function StaffDetailsSection({ staff, form }: StaffDetailsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Staff Members Present</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {staff.map((staffMember) => (
            <div key={staffMember.id} className="flex items-center space-x-2">
              <Checkbox id={`staff-present-${staffMember.id}`} />
              <Label htmlFor={`staff-present-${staffMember.id}`}>
                {staffMember.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Staff Members Aware</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {staff.map((staffMember) => (
            <div key={staffMember.id} className="flex items-center space-x-2">
              <Checkbox id={`staff-aware-${staffMember.id}`} />
              <Label htmlFor={`staff-aware-${staffMember.id}`}>
                {staffMember.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Other People Present</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Input placeholder="Person's name" className="w-full md:w-1/2" />
            <Select>
              <SelectTrigger className="w-full md:w-1/3">
                <SelectValue placeholder="Relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family Member</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="professional">Healthcare Professional</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Add Person</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
