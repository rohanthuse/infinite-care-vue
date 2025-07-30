import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, X } from "lucide-react";

interface EnhancedStaffDetailsSectionProps {
  form: UseFormReturn<any>;
  staffList: Array<{ id: string; first_name: string; last_name: string }>;
}

interface OtherPerson {
  id: string;
  name: string;
  relationship: string;
}

export function EnhancedStaffDetailsSection({ form, staffList }: EnhancedStaffDetailsSectionProps) {
  const [otherPeople, setOtherPeople] = useState<OtherPerson[]>([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRelationship, setNewPersonRelationship] = useState("");

  const staffPresentIds = form.watch('staff_present') || [];
  const staffAwareIds = form.watch('staff_aware') || [];

  const toggleStaffPresent = (staffId: string) => {
    const currentList = [...staffPresentIds];
    const index = currentList.indexOf(staffId);
    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(staffId);
    }
    form.setValue('staff_present', currentList);
  };

  const toggleStaffAware = (staffId: string) => {
    const currentList = [...staffAwareIds];
    const index = currentList.indexOf(staffId);
    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(staffId);
    }
    form.setValue('staff_aware', currentList);
  };

  const addOtherPerson = () => {
    if (newPersonName.trim() && newPersonRelationship) {
      const newPerson: OtherPerson = {
        id: Date.now().toString(),
        name: newPersonName.trim(),
        relationship: newPersonRelationship
      };
      const updatedList = [...otherPeople, newPerson];
      setOtherPeople(updatedList);
      form.setValue('other_people_present', updatedList);
      setNewPersonName("");
      setNewPersonRelationship("");
    }
  };

  const removeOtherPerson = (personId: string) => {
    const updatedList = otherPeople.filter(person => person.id !== personId);
    setOtherPeople(updatedList);
    form.setValue('other_people_present', updatedList);
  };

  return (
    <div className="space-y-6 bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
        Staff & Witness Details
      </h3>
      
      <div className="space-y-5">
        {/* Staff Present */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Staff Members Present</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {staffList.map((staff) => (
              <div key={`present-${staff.id}`} className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-md hover:bg-gray-100 transition-colors">
                <Checkbox
                  id={`staff-present-${staff.id}`}
                  checked={staffPresentIds.includes(staff.id)}
                  onCheckedChange={() => toggleStaffPresent(staff.id)}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor={`staff-present-${staff.id}`} className="font-medium cursor-pointer truncate">
                  {staff.first_name} {staff.last_name}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Staff Aware */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Staff Members Made Aware</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {staffList.map((staff) => (
              <div key={`aware-${staff.id}`} className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-md hover:bg-gray-100 transition-colors">
                <Checkbox
                  id={`staff-aware-${staff.id}`}
                  checked={staffAwareIds.includes(staff.id)}
                  onCheckedChange={() => toggleStaffAware(staff.id)}
                  className="data-[state=checked]:bg-green-600"
                />
                <Label htmlFor={`staff-aware-${staff.id}`} className="font-medium cursor-pointer truncate">
                  {staff.first_name} {staff.last_name}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Other People Present */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Other People Present</h4>
          
          {/* Add New Person */}
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Person's name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="flex-1"
            />
            <Select value={newPersonRelationship} onValueChange={setNewPersonRelationship}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family Member</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="professional">Healthcare Professional</SelectItem>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={addOtherPerson}
              disabled={!newPersonName.trim() || !newPersonRelationship}
              variant="outline"
              size="sm"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Display Added People */}
          {otherPeople.length > 0 && (
            <div className="space-y-2">
              {otherPeople.map((person) => (
                <div key={person.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                  <div>
                    <span className="font-medium">{person.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({person.relationship})</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeOtherPerson(person.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
