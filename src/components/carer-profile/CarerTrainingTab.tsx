import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Book, Calendar, Plus, CheckCircle, Clock } from "lucide-react";

interface CarerTrainingTabProps {
  carerId: string;
}

export const CarerTrainingTab: React.FC<CarerTrainingTabProps> = ({ carerId }) => {
  const trainingRecords = [
    {
      id: 1,
      title: 'Safeguarding Adults',
      provider: 'Care Training Academy',
      completedDate: '2023-12-15',
      expiryDate: '2025-12-15',
      status: 'completed',
      certificateUrl: '#',
      category: 'Mandatory'
    },
    {
      id: 2,
      title: 'First Aid Training',
      provider: 'Red Cross',
      completedDate: '2023-06-20',
      expiryDate: '2024-06-20',
      status: 'expiring',
      certificateUrl: '#',
      category: 'Mandatory'
    },
    {
      id: 3,
      title: 'Dementia Care Specialist',
      provider: 'Alzheimer Society',
      completedDate: '2023-08-10',
      expiryDate: null,
      status: 'completed',
      certificateUrl: '#',
      category: 'Specialist'
    },
    {
      id: 4,
      title: 'Manual Handling',
      provider: 'Health & Safety Institute',
      completedDate: null,
      expiryDate: null,
      status: 'pending',
      certificateUrl: null,
      category: 'Mandatory'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'expiring':
        return <Badge className="bg-amber-100 text-amber-800">Expiring</Badge>;
      case 'pending':
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const completedCount = trainingRecords.filter(record => record.status === 'completed').length;
  const trainingProgress = (completedCount / trainingRecords.length) * 100;

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
              <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {trainingRecords.filter(r => r.status === 'expiring').length}
              </div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {trainingRecords.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Training Completion</span>
              <span>{Math.round(trainingProgress)}%</span>
            </div>
            <Progress value={trainingProgress} className="h-3" />
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
            {trainingRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    record.status === 'completed' ? 'bg-green-100' :
                    record.status === 'expiring' ? 'bg-amber-100' : 'bg-red-100'
                  }`}>
                    {record.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium">{record.title}</h4>
                    <p className="text-sm text-muted-foreground">{record.provider}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{record.category}</span>
                      {record.completedDate && (
                        <>
                          <span>•</span>
                          <span>Completed: {new Date(record.completedDate).toLocaleDateString()}</span>
                        </>
                      )}
                      {record.expiryDate && (
                        <>
                          <span>•</span>
                          <span>Expires: {new Date(record.expiryDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(record.status)}
                  {record.certificateUrl && (
                    <Button size="sm" variant="outline">View Certificate</Button>
                  )}
                </div>
              </div>
            ))}
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
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">Advanced Dementia Care</p>
                <p className="text-sm text-muted-foreground">Scheduled for March 25, 2024</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Mental Health First Aid</p>
                <p className="text-sm text-muted-foreground">Scheduled for April 10, 2024</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Enrolled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};