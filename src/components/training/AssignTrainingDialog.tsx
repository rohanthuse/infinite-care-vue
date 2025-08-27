import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { TrainingCourse } from "@/hooks/useTrainingCourses";

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  specialization?: string;
}

interface AssignTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (courseId: string, staffIds: string[]) => void;
  isAssigning: boolean;
  trainingCourses: TrainingCourse[];
  staff: StaffMember[];
  existingRecords: Array<{ staff_id: string; training_course_id: string }>;
}

export const AssignTrainingDialog: React.FC<AssignTrainingDialogProps> = ({
  open,
  onOpenChange,
  onAssign,
  isAssigning,
  trainingCourses,
  staff,
  existingRecords
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!selectedCourseId || selectedStaffIds.length === 0) return;
    
    onAssign(selectedCourseId, selectedStaffIds);
    handleClose();
  };

  const handleClose = () => {
    setSelectedCourseId("");
    setSelectedStaffIds([]);
    onOpenChange(false);
  };

  const selectedCourse = trainingCourses.find(c => c.id === selectedCourseId);
  
  // Get staff options for multi-select
  const staffOptions = staff.map(s => ({
    label: `${s.first_name} ${s.last_name}`,
    value: s.id,
    description: s.specialization || 'Care Assistant'
  }));

  // Check which selected staff already have this training assigned
  const alreadyAssigned = selectedStaffIds.filter(staffId => 
    existingRecords.some(record => 
      record.staff_id === staffId && record.training_course_id === selectedCourseId
    )
  );

  const canSubmit = selectedCourseId && selectedStaffIds.length > 0 && !isAssigning;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Training Course</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="course-select">Select Training Course</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a training course..." />
              </SelectTrigger>
              <SelectContent>
                {trainingCourses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center gap-2">
                      <span>{course.title}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          course.category === 'core' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : course.category === 'mandatory' 
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : course.category === 'specialized'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {course.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCourse && (
              <div className="text-sm text-gray-600 mt-1">
                {selectedCourse.description}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Select Staff Members</Label>
            <MultiSelect
              options={staffOptions}
              selected={selectedStaffIds}
              onSelectionChange={setSelectedStaffIds}
              placeholder="Choose staff members..."
              maxDisplay={3}
            />
            {selectedStaffIds.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedStaffIds.length} staff member(s) selected
              </div>
            )}
          </div>

          {alreadyAssigned.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {alreadyAssigned.length} of the selected staff members already have this training assigned. 
                The assignment will update their existing records.
              </AlertDescription>
            </Alert>
          )}

          {selectedCourseId && selectedStaffIds.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-medium text-gray-700 mb-1">Assignment Summary:</div>
              <div className="text-sm text-gray-600">
                Assigning <strong>{selectedCourse?.title}</strong> to <strong>{selectedStaffIds.length}</strong> staff member(s)
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAssigning ? 'Assigning...' : 'Assign Training'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};