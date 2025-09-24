import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, MapPin, Calendar } from "lucide-react";

interface CarerEmploymentHistoryTabProps {
  carerId: string;
}

export const CarerEmploymentHistoryTab: React.FC<CarerEmploymentHistoryTabProps> = ({ carerId }) => {
  const employmentHistory = [
    {
      id: 1,
      position: 'Senior Care Assistant',
      employer: 'Current Healthcare Ltd',
      location: 'London, UK',
      startDate: '2022-03-15',
      endDate: null,
      status: 'current',
      responsibilities: [
        'Providing personal care to elderly clients',
        'Medication administration',
        'Maintaining care records',
        'Emergency response'
      ]
    },
    {
      id: 2,
      position: 'Care Assistant',
      employer: 'Sunrise Care Services',
      location: 'Birmingham, UK',
      startDate: '2020-06-01',
      endDate: '2022-03-14',
      status: 'completed',
      responsibilities: [
        'Daily living assistance',
        'Client transportation',
        'Social activities coordination'
      ]
    },
    {
      id: 3,
      position: 'Healthcare Support Worker',
      employer: 'NHS Trust Hospital',
      location: 'Manchester, UK',
      startDate: '2018-09-01',
      endDate: '2020-05-31',
      status: 'completed',
      responsibilities: [
        'Patient monitoring',
        'Basic medical procedures',
        'Administrative duties'
      ]
    }
  ];

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Employment History
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </CardHeader>
        <CardContent>
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
                        <Badge variant={job.status === 'current' ? 'default' : 'secondary'}>
                          {job.status === 'current' ? 'Current' : 'Completed'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(job.startDate)} - {job.endDate ? formatDate(job.endDate) : 'Present'}
                        </div>
                        <span className="text-primary font-medium">
                          {calculateDuration(job.startDate, job.endDate)}
                        </span>
                      </div>
                      
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
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">5.5</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-muted-foreground">Previous Employers</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Healthcare</div>
              <div className="text-sm text-muted-foreground">Primary Sector</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};