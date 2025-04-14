
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, UserPlus, User } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StaffMember {
  id: string;
  name: string;
}

interface StaffDetailsSectionProps {
  staff: StaffMember[];
  form: UseFormReturn<any>;
}

export function StaffDetailsSection({ staff, form }: StaffDetailsSectionProps) {
  const [staffPresent, setStaffPresent] = useState<string[]>([]);
  const [staffAware, setStaffAware] = useState<string[]>([]);
  const [peoplePresent, setPeoplePresent] = useState<string[]>([]);
  const [newPersonName, setNewPersonName] = useState("");

  const handleAddStaffPresent = (staffId: string) => {
    if (staffId && !staffPresent.includes(staffId)) {
      const newStaffPresent = [...staffPresent, staffId];
      setStaffPresent(newStaffPresent);
      form.setValue("staffPresent", newStaffPresent);
    }
  };

  const handleRemoveStaffPresent = (staffId: string) => {
    const newStaffPresent = staffPresent.filter(id => id !== staffId);
    setStaffPresent(newStaffPresent);
    form.setValue("staffPresent", newStaffPresent);
  };

  const handleAddStaffAware = (staffId: string) => {
    if (staffId && !staffAware.includes(staffId)) {
      const newStaffAware = [...staffAware, staffId];
      setStaffAware(newStaffAware);
      form.setValue("staffAware", newStaffAware);
    }
  };

  const handleRemoveStaffAware = (staffId: string) => {
    const newStaffAware = staffAware.filter(id => id !== staffId);
    setStaffAware(newStaffAware);
    form.setValue("staffAware", newStaffAware);
  };

  const handleAddPersonPresent = () => {
    if (newPersonName.trim()) {
      const newPerson = newPersonName.trim();
      const newPeoplePresent = [...peoplePresent, newPerson];
      setPeoplePresent(newPeoplePresent);
      form.setValue("peoplePresent", newPeoplePresent);
      setNewPersonName("");
    }
  };

  const handleRemovePersonPresent = (person: string) => {
    const newPeoplePresent = peoplePresent.filter(p => p !== person);
    setPeoplePresent(newPeoplePresent);
    form.setValue("peoplePresent", newPeoplePresent);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Staff Present</label>
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {staffPresent.length > 0 ? (
            staffPresent.map(staffId => {
              const staffMember = staff.find(s => s.id === staffId);
              return staffMember ? (
                <Badge key={staffId} variant="secondary" className="px-3 py-1">
                  {staffMember.name}
                  <button 
                    type="button" 
                    className="ml-2 text-gray-500 hover:text-gray-700"
                    onClick={() => handleRemoveStaffPresent(staffId)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })
          ) : (
            <p className="text-sm text-gray-500">No staff members were present during the event</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Select onValueChange={handleAddStaffPresent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add staff member" />
            </SelectTrigger>
            <SelectContent>
              {staff.filter(s => !staffPresent.includes(s.id)).map(staffMember => (
                <SelectItem key={staffMember.id} value={staffMember.id}>
                  {staffMember.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Staff Aware</label>
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {staffAware.length > 0 ? (
            staffAware.map(staffId => {
              const staffMember = staff.find(s => s.id === staffId);
              return staffMember ? (
                <Badge key={staffId} variant="outline" className="px-3 py-1">
                  {staffMember.name}
                  <button 
                    type="button" 
                    className="ml-2 text-gray-500 hover:text-gray-700"
                    onClick={() => handleRemoveStaffAware(staffId)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })
          ) : (
            <p className="text-sm text-gray-500">No staff members are aware of this event</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Select onValueChange={handleAddStaffAware}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add staff member" />
            </SelectTrigger>
            <SelectContent>
              {staff.filter(s => !staffAware.includes(s.id)).map(staffMember => (
                <SelectItem key={staffMember.id} value={staffMember.id}>
                  {staffMember.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Other People Present</label>
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {peoplePresent.length > 0 ? (
            peoplePresent.map((person, index) => (
              <Badge key={index} variant="outline" className="px-3 py-1">
                <User className="h-3 w-3 mr-1" />
                {person}
                <button 
                  type="button" 
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => handleRemovePersonPresent(person)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-sm text-gray-500">No other people were present during the event</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Input
            placeholder="Enter person's name"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            className="flex-1"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  size="sm"
                  onClick={handleAddPersonPresent}
                  disabled={!newPersonName.trim()}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add person</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
