import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, MapPin, Calendar, Trash2 } from "lucide-react";
import { useStaffEmploymentHistory, NewEmploymentHistory } from "@/hooks/useStaffEmploymentHistory";
import { AddEmploymentDialog } from "./AddEmploymentDialog";

interface CarerEmploymentHistoryTabProps {
  carerId: string;
}

export const CarerEmploymentHistoryTab: React.FC<CarerEmploymentHistoryTabProps> = ({ carerId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { 
    employmentHistory, 
    isLoading, 
    addEmployment, 
    deleteEmployment, 
    isAdding, 
    isDeleting 
  } = useStaffEmploymentHistory(carerId);

  const handleAddEmployment = (employmentData: NewEmploymentHistory) => {
    addEmployment(employmentData);
    setIsAddDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    if (diffYears > 0) {
      return `${diffYears}y ${diffMonths}m`;
    }
    return `${diffMonths}m`;
  };

  const calculateTotalExperience = () => {
    if (!employmentHistory.length) return 0;
    
    const totalMonths = employmentHistory.reduce((total, job) => {
      const start = new Date(job.start_date);
      const end = job.end_date ? new Date(job.end_date) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
      return total + months;
    }, 0);
    
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return years + (months / 12);
  };

  const uniqueEmployersCount = () => {
    const uniqueEmployers = new Set(employmentHistory.map(job => job.employer));
    return uniqueEmployers.size;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Employment History
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading employment history...</p>
            </div>
          ) : employmentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No employment history added yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add Position" to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {employmentHistory.map((job, index) => (
                <div key={job.id} className="relative">
                  {/* Timeline line */}
                  {index < employmentHistory.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-16 bg-muted-foreground/20" />
                  )}
                  
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                      job.status === 'current' ? 'bg-green-500' : 'bg-muted-foreground/40'
                    }`} />
                  
                    <div className="flex-1 pb-6">
                      <Card className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{job.position}</h3>
                            <p className="text-primary font-medium">{job.employer}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={job.status === 'current' ? 'default' : 'secondary'}>
                              {job.status === 'current' ? 'Current' : 'Completed'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => deleteEmployment(job.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(job.start_date)} - {job.end_date ? formatDate(job.end_date) : 'Present'}
                          </div>
                          <span className="text-primary font-medium">
                            {calculateDuration(job.start_date, job.end_date)}
                          </span>
                        </div>
                        
                        {job.responsibilities.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Key Responsibilities:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {job.responsibilities.map((responsibility, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                                  {responsibility}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {calculateTotalExperience().toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {uniqueEmployersCount()}
              </div>
              <div className="text-sm text-muted-foreground">Previous Employers</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Healthcare</div>
              <div className="text-sm text-muted-foreground">Primary Sector</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddEmploymentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddEmployment}
        isLoading={isAdding}
      />
    </div>
  );
};