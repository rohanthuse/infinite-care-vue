
import React from "react";
import { format } from "date-fns";
import { MessageCircle, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getStatusBadgeClass } from "@/utils/statusHelpers";

interface CarePlanSidebarProps {
  carePlan: {
    id: string;
    patientName: string;
    patientId: string;
    dateCreated: Date;
    lastUpdated: Date;
    status: string;
    assignedTo: string;
    avatar: string;
  };
}

export const CarePlanSidebar: React.FC<CarePlanSidebarProps> = ({ carePlan }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Care Plan Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Status</p>
          <Badge variant="outline" className={getStatusBadgeClass(carePlan.status)}>
            {carePlan.status}
          </Badge>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Assigned To</p>
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-6 w-6">
              <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-xs">
                {carePlan.assignedTo.split(' ').map(n => n[0]).join('')}
              </div>
            </Avatar>
            <span className="text-sm">{carePlan.assignedTo}</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Created On</p>
          <p className="text-sm">{format(carePlan.dateCreated, 'MMM dd, yyyy')}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Last Updated</p>
          <p className="text-sm">{format(carePlan.lastUpdated, 'MMM dd, yyyy')}</p>
        </div>
        
        <Separator />
        
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Quick Actions</p>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span>Add Note</span>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Clock className="h-4 w-4 mr-2" />
              <span>Schedule Follow-up</span>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Activity className="h-4 w-4 mr-2" />
              <span>Record Activity</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
