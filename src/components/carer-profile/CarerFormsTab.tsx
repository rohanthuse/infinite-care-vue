import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, Eye } from "lucide-react";

interface CarerFormsTabProps {
  carerId: string;
}

export const CarerFormsTab: React.FC<CarerFormsTabProps> = ({ carerId }) => {
  const assignedForms = [
    {
      id: 1,
      title: 'Health & Safety Assessment',
      description: 'Annual health and safety knowledge assessment',
      assignedDate: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'completed',
      completedDate: '2024-01-20',
      priority: 'high',
      category: 'mandatory'
    },
    {
      id: 2,
      title: 'Personal Development Plan',
      description: 'Set goals and development objectives for the year',
      assignedDate: '2024-01-10',
      dueDate: '2024-02-10',
      status: 'in_progress',
      completedDate: null,
      priority: 'medium',
      category: 'development'
    },
    {
      id: 3,
      title: 'Client Feedback Survey',
      description: 'Quarterly feedback collection from assigned clients',
      assignedDate: '2024-01-05',
      dueDate: '2024-03-05',
      status: 'pending',
      completedDate: null,
      priority: 'low',
      category: 'feedback'
    },
    {
      id: 4,
      title: 'Medication Administration Record',
      description: 'Monthly medication administration compliance form',
      assignedDate: '2024-01-01',
      dueDate: '2024-01-31',
      status: 'overdue',
      completedDate: null,
      priority: 'high',
      category: 'mandatory'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const completedCount = assignedForms.filter(form => form.status === 'completed').length;
  const completionRate = (completedCount / assignedForms.length) * 100;

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Forms Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{assignedForms.length}</div>
              <div className="text-sm text-muted-foreground">Total Assigned</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {assignedForms.filter(f => f.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {assignedForms.filter(f => f.status === 'overdue').length}
              </div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Completion Rate</span>
              <span>{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assigned Forms</CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Request Form
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignedForms.map((form) => {
              const daysRemaining = getDaysRemaining(form.dueDate);
              
              return (
                <Card key={form.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(form.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{form.title}</h4>
                          {getPriorityBadge(form.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{form.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Assigned: {new Date(form.assignedDate).toLocaleDateString()}</span>
                          <span>Due: {new Date(form.dueDate).toLocaleDateString()}</span>
                          {form.completedDate && (
                            <span>Completed: {new Date(form.completedDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        
                        {form.status !== 'completed' && (
                          <div className="mt-2">
                            {daysRemaining > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                {daysRemaining} days remaining
                              </span>
                            ) : (
                              <span className="text-xs text-red-600 font-medium">
                                {Math.abs(daysRemaining)} days overdue
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(form.status)}
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignedForms
              .filter(form => form.status === 'overdue' || (form.status === 'pending' && getDaysRemaining(form.dueDate) <= 7))
              .map((form) => (
                <div key={form.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">{form.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {form.status === 'overdue' 
                          ? `${Math.abs(getDaysRemaining(form.dueDate))} days overdue` 
                          : `Due in ${getDaysRemaining(form.dueDate)} days`
                        }
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive">
                    Complete Now
                  </Button>
                </div>
              ))}
            
            {assignedForms.filter(form => 
              form.status === 'overdue' || (form.status === 'pending' && getDaysRemaining(form.dueDate) <= 7)
            ).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>All forms are up to date!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};