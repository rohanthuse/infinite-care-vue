import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCarePlanForms, useAvailableForms } from "@/hooks/useCarePlanForms";
import { formatDistance } from "date-fns";
import { 
  Plus, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Trash2
} from "lucide-react";

interface CarePlanFormsTabProps {
  carePlanId: string;
  branchId: string;
  userRole?: string;
}

export const CarePlanFormsTab: React.FC<CarePlanFormsTabProps> = ({
  carePlanId,
  branchId,
  userRole = 'admin'
}) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [completionNotes, setCompletionNotes] = useState<string>("");

  const { 
    assignedForms, 
    isLoading,
    assignForm, 
    updateFormStatus, 
    removeForm,
    isAssigning 
  } = useCarePlanForms(carePlanId);
  
  const { data: availableForms = [] } = useAvailableForms(branchId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAssignForm = () => {
    if (!selectedFormId) return;

    assignForm({
      formId: selectedFormId,
      dueDate: dueDate || undefined,
    });

    setAssignDialogOpen(false);
    setSelectedFormId("");
    setDueDate("");
  };

  const handleStatusUpdate = (carePlanFormId: string, newStatus: string) => {
    updateFormStatus({
      carePlanFormId,
      status: newStatus as any,
      completionNotes: newStatus === 'completed' ? completionNotes : undefined,
    });
    setCompletionNotes("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Care Plan Forms</h3>
          <p className="text-sm text-muted-foreground">
            Forms assigned to this care plan for completion
          </p>
        </div>
        
        {(userRole === 'admin' || userRole === 'staff') && (
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Form
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Form to Care Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-select">Select Form</Label>
                  <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a form to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableForms
                        .filter(form => !assignedForms.some(af => af.form_id === form.id))
                        .map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          <div>
                            <div className="font-medium">{form.title}</div>
                            {form.description && (
                              <div className="text-sm text-muted-foreground">
                                {form.description}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date (Optional)</Label>
                  <Input
                    id="due-date"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignForm} 
                    disabled={!selectedFormId || isAssigning}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Form'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Forms List */}
      {assignedForms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Forms Assigned</h3>
            <p className="text-muted-foreground text-center mb-4">
              No forms have been assigned to this care plan yet.
            </p>
            {(userRole === 'admin' || userRole === 'staff') && (
              <Button onClick={() => setAssignDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign First Form
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignedForms.map((carePlanForm) => (
            <Card key={carePlanForm.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(carePlanForm.status)}
                    <div>
                      <CardTitle className="text-base">
                        {carePlanForm.form?.title || 'Unknown Form'}
                      </CardTitle>
                      {carePlanForm.form?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {carePlanForm.form.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(carePlanForm.status)}>
                      {carePlanForm.status.replace('_', ' ')}
                    </Badge>
                    {(userRole === 'admin') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeForm(carePlanForm.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Form metadata */}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Assigned {formatDistance(new Date(carePlanForm.assigned_at), new Date(), { addSuffix: true })}
                  </div>
                  {carePlanForm.due_date && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Due {formatDistance(new Date(carePlanForm.due_date), new Date(), { addSuffix: true })}
                    </div>
                  )}
                </div>

                {/* Completion details */}
                {carePlanForm.completed_at && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-800">
                      <strong>Completed:</strong> {formatDistance(new Date(carePlanForm.completed_at), new Date(), { addSuffix: true })}
                    </div>
                    {carePlanForm.completion_notes && (
                      <div className="text-sm text-green-700 mt-1">
                        <strong>Notes:</strong> {carePlanForm.completion_notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {carePlanForm.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(carePlanForm.id, 'in_progress')}
                      >
                        Start Form
                      </Button>
                    )}
                    {carePlanForm.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(carePlanForm.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Form
                  </Button>
                </div>

                {/* Completion notes input for completed forms */}
                {carePlanForm.status === 'in_progress' && (
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${carePlanForm.id}`}>
                      Completion Notes (Optional)
                    </Label>
                    <Textarea
                      id={`notes-${carePlanForm.id}`}
                      placeholder="Add any notes about form completion..."
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};