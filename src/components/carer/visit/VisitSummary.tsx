
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle, Clock, User, Calendar } from "lucide-react";
import { format } from "date-fns";

interface VisitSummaryProps {
  client: {
    id: string;
    name: string;
    address: string;
    appointmentType: string;
    scheduledDuration: string;
    scheduledTime: string;
  };
  visitStartTime: Date | null;
  visitDuration: number;
  onSubmit: () => void;
}

export const VisitSummary: React.FC<VisitSummaryProps> = ({ 
  client, 
  visitStartTime, 
  visitDuration,
  onSubmit 
}) => {
  const [summaryNotes, setSummaryNotes] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [careManagerAlert, setCareManagerAlert] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  
  // Format duration as HH:MM:SS
  const formatDuration = () => {
    const hours = Math.floor(visitDuration / 3600);
    const minutes = Math.floor((visitDuration % 3600) / 60);
    const seconds = visitDuration % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <span>Visit Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 border rounded-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Client: <span className="font-medium text-gray-900">{client.name}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-900">{visitStartTime ? format(visitStartTime, "MMMM d, yyyy") : "-"}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Visit Type: <span className="font-medium text-gray-900">{client.appointmentType}</span></p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Start Time: <span className="font-medium text-gray-900">{visitStartTime ? format(visitStartTime, "h:mm a") : "-"}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">End Time: <span className="font-medium text-gray-900">{visitStartTime ? format(new Date(visitStartTime.getTime() + visitDuration * 1000), "h:mm a") : "-"}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Total Duration: <span className="font-medium text-gray-900">{formatDuration()}</span></p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <Label htmlFor="summary" className="font-medium">Visit Summary Notes</Label>
              <Textarea 
                id="summary"
                placeholder="Provide a summary of the visit, noting key points and outcomes..."
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                className="mt-2 min-h-[150px]"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="follow-up" 
                checked={followUpRequired}
                onCheckedChange={(checked) => setFollowUpRequired(checked === true)}
              />
              <Label htmlFor="follow-up" className="font-medium">
                Follow-up required
              </Label>
            </div>
            
            {followUpRequired && (
              <div>
                <Label htmlFor="follow-up-notes" className="text-sm">Follow-up Notes</Label>
                <Textarea 
                  id="follow-up-notes"
                  placeholder="Describe what follow-up is required..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="mt-2"
                />
                
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox 
                    id="alert-manager" 
                    checked={careManagerAlert}
                    onCheckedChange={(checked) => setCareManagerAlert(checked === true)}
                  />
                  <Label htmlFor="alert-manager" className="text-sm">
                    Alert care manager (for urgent follow-up)
                  </Label>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-8">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Visit Completion</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="confirm-completion" 
                  checked={confirmComplete}
                  onCheckedChange={(checked) => setConfirmComplete(checked === true)}
                />
                <Label htmlFor="confirm-completion">
                  I confirm that I have completed all required tasks and the information provided is accurate
                </Label>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={onSubmit}
                  disabled={!confirmComplete || !summaryNotes || (followUpRequired && !followUpNotes)}
                >
                  Complete & Submit Visit Record
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
