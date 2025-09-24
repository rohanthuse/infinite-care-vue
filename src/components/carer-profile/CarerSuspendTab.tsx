import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, User, Shield } from "lucide-react";
import { useCarerProfileById } from "@/hooks/useCarerProfile";

interface CarerSuspendTabProps {
  carerId: string;
}

export const CarerSuspendTab: React.FC<CarerSuspendTabProps> = ({ carerId }) => {
  const { data: carer } = useCarerProfileById(carerId);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendType, setSuspendType] = useState("");
  
  const isSuspended = carer?.status === "Suspended";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Suspension Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="font-medium">Current Status: {carer?.status || 'Active'}</span>
            </div>
            <Badge variant={isSuspended ? 'destructive' : 'default'}>
              {isSuspended ? 'Suspended' : 'Active'}
            </Badge>
          </div>

          {!isSuspended ? (
            <div className="space-y-4 p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="font-medium">Suspend Staff Member</h4>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="suspend-type">Suspension Type</Label>
                  <Select value={suspendType} onValueChange={setSuspendType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select suspension type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temporary">Temporary Suspension</SelectItem>
                      <SelectItem value="pending-investigation">Pending Investigation</SelectItem>
                      <SelectItem value="disciplinary">Disciplinary Action</SelectItem>
                      <SelectItem value="medical">Medical Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="suspend-reason">Reason for Suspension</Label>
                  <Textarea
                    id="suspend-reason"
                    placeholder="Enter detailed reason for suspension..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Suspend Staff Member
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <User className="h-4 w-4" />
                <h4 className="font-medium">Reactivate Staff Member</h4>
              </div>
              
              <p className="text-sm text-green-700">
                This staff member is currently suspended. You can reactivate them to restore full access.
              </p>

              <Button className="w-full bg-green-600 hover:bg-green-700">
                <User className="h-4 w-4 mr-2" />
                Reactivate Staff Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Suspension History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No suspension history found</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};