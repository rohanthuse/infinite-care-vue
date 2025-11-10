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
  onAssign: (courseIds: string[], staffIds: string[]) => void;
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
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const handleSubmit = () => {
    if (selectedCourseIds.length === 0 || selectedStaffIds.length === 0) return;
    
    onAssign(selectedCourseIds, selectedStaffIds);
    handleClose();
  };

  const handleClose = () => {
    setSelectedCourseIds([]);
    setSelectedStaffIds([]);
    onOpenChange(false);
  };

  const selectedCourses = trainingCourses.filter(c => selectedCourseIds.includes(c.id));
  
  // Get course options for multi-select
  const courseOptions = trainingCourses.map(course => ({
    label: course.title,
    value: course.id,
    description: `${course.category} • ${course.description || 'No description'}`
  }));
  
  // Get staff options for multi-select
  const staffOptions = staff.map(s => ({
    label: `${s.first_name} ${s.last_name}`,
    value: s.id,
    description: s.specialization || 'Care Assistant'
  }));

  // Check which selected staff already have any of these trainings assigned
  const alreadyAssignedPairs = selectedStaffIds.flatMap(staffId =>
    selectedCourseIds.filter(courseId =>
      existingRecords.some(record =>
        record.staff_id === staffId && record.training_course_id === courseId
      )
    ).map(courseId => ({ staffId, courseId }))
  );

  const uniqueStaffWithExisting = new Set(alreadyAssignedPairs.map(p => p.staffId)).size;

  const canSubmit = selectedCourseIds.length > 0 && selectedStaffIds.length > 0 && !isAssigning;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Training Course</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="course-select">Select Training Courses</Label>
            <MultiSelect
              options={courseOptions}
              selected={selectedCourseIds}
              onSelectionChange={setSelectedCourseIds}
              placeholder="Choose training courses..."
              maxDisplay={2}
              showSelectAll={true}
            />
            {selectedCourseIds.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedCourseIds.length} training course(s) selected
                {selectedCourseIds.length === trainingCourses.length && trainingCourses.length > 0 && (
                  <span className="ml-1 text-blue-600 font-medium">(All Courses)</span>
                )}
              </div>
            )}
            {selectedCourses.length > 0 && selectedCourses.length <= 3 && (
              <div className="space-y-1 mt-2">
                {selectedCourses.map(course => (
                  <div key={course.id} className="flex items-center gap-2 text-sm text-gray-600">
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
                    <span className="truncate">{course.title}</span>
                  </div>
                ))}
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
                showSelectAll={true}
              />
              {selectedStaffIds.length > 0 && (
                <div className="text-sm text-gray-600">
                  {selectedStaffIds.length} staff member(s) selected
                  {selectedStaffIds.length === staff.length && staff.length > 0 && (
                    <span className="ml-1 text-blue-600 font-medium">(All Staff)</span>
                  )}
                </div>
              )}
          </div>

          {alreadyAssignedPairs.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {uniqueStaffWithExisting} staff member(s) already have some of these trainings assigned. 
                {alreadyAssignedPairs.length} existing assignment(s) will be updated.
              </AlertDescription>
            </Alert>
          )}

          {selectedCourseIds.length > 0 && selectedStaffIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
              <div className="text-sm font-medium text-blue-900 mb-1">Assignment Summary:</div>
              <div className="text-sm text-blue-800">
                Assigning <strong>{selectedCourseIds.length}</strong> training course(s) to <strong>{selectedStaffIds.length}</strong> staff member(s)
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Total assignments: <strong>{selectedCourseIds.length * selectedStaffIds.length}</strong>
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