import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Book, Calendar, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useCarerTraining } from "@/hooks/useCarerTraining";

interface CarerTrainingTabProps {
  carerId: string;
}

export const CarerTrainingTab: React.FC<CarerTrainingTabProps> = ({ carerId }) => {
  const { trainingRecords = [], stats, isLoading, error } = useCarerTraining();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'not-started':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case 'renewal-required':
        return <Badge className="bg-amber-100 text-amber-800">Renewal Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading training records...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Error Loading Training Data</h3>
            <p className="text-muted-foreground">Unable to load training records. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Training Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.completedCount || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{stats?.expiredCount || 0}</div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats?.pendingCount || 0}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Training Completion</span>
              <span>{stats?.completionPercentage || 0}%</span>
            </div>
            <Progress value={stats?.completionPercentage || 0} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Training Records
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Training
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Book className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No training records found</p>
              </div>
            ) : (
              trainingRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      record.status === 'completed' ? 'bg-green-100' :
                      record.status === 'expired' ? 'bg-red-100' :
                      record.status === 'in-progress' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {record.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : record.status === 'expired' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{record.training_course?.title}</h4>
                      <p className="text-sm text-muted-foreground">{record.training_course?.category}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {record.training_course?.is_mandatory && <span>Mandatory</span>}
                        {record.completion_date && (
                          <>
                            <span>•</span>
                            <span>Completed: {new Date(record.completion_date).toLocaleDateString()}</span>
                          </>
                        )}
                        {record.expiry_date && (
                          <>
                            <span>•</span>
                            <span>Expires: {new Date(record.expiry_date).toLocaleDateString()}</span>
                          </>
                        )}
                        {record.progress_percentage && record.status === 'in-progress' && (
                          <>
                            <span>•</span>
                            <span>Progress: {record.progress_percentage}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                    {record.evidence_files && record.evidence_files.length > 0 && (
                      <Button size="sm" variant="outline">View Certificate</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainingRecords.filter(record => record.status === 'not-started').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming training scheduled</p>
              </div>
            ) : (
              trainingRecords
                .filter(record => record.status === 'not-started')
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">{record.training_course?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned: {new Date(record.assigned_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};