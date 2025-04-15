
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
    <div className="space-y-6 bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Staff Details</h3>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Staff Members Present</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-full">
            {staff.map((staffMember) => (
              <div key={`present-${staffMember.id}`} className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-md hover:bg-gray-100 transition-colors truncate">
                <Checkbox id={`staff-present-${staffMember.id}`} className="data-[state=checked]:bg-blue-600 flex-shrink-0" />
                <Label htmlFor={`staff-present-${staffMember.id}`} className="font-medium cursor-pointer truncate">
                  {staffMember.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-semibold text-gray-700">Staff Members Aware</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-full">
            {staff.map((staffMember) => (
              <div key={`aware-${staffMember.id}`} className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-md hover:bg-gray-100 transition-colors truncate">
                <Checkbox id={`staff-aware-${staffMember.id}`} className="data-[state=checked]:bg-blue-600 flex-shrink-0" />
                <Label htmlFor={`staff-aware-${staffMember.id}`} className="font-medium cursor-pointer truncate">
                  {staffMember.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-semibold text-gray-700">Other People Present</h4>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 flex-wrap">
              <Input placeholder="Person's name" className="w-full md:w-[calc(50%-0.75rem)] bg-gray-50 border-gray-200" />
              <Select>
                <SelectTrigger className="w-full md:w-[calc(50%-0.75rem)] bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family Member</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="professional">Healthcare Professional</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" className="ml-auto md:ml-0 bg-white hover:bg-gray-50">
                <PlusCircle className="h-4 w-4 mr-1" />
                <span>Add Person</span>
              </Button>
            </div>
            
            {/* Display added people here */}
            <div className="mt-2 p-3 bg-gray-50 rounded-md border border-dashed border-gray-200 text-sm text-gray-500 hidden">
              No additional people added
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
