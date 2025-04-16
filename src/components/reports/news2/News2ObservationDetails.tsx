
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  News2Observation,
  getScoreStatusColor,
  getScoreStatusText
} from "@/data/mockNews2Data";
import { format } from "date-fns";
import { Download, Printer, Mail, Share } from "lucide-react";
import { toast } from "sonner";

interface News2ObservationDetailsProps {
  observation: News2Observation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const News2ObservationDetails: React.FC<News2ObservationDetailsProps> = ({
  observation,
  open,
  onOpenChange
}) => {
  const handleExport = () => {
    toast.success("Exporting observation as PDF");
  };
  
  const handlePrint = () => {
    toast.success("Preparing to print observation");
  };
  
  const handleEmail = () => {
    toast.success("Preparing to email observation");
  };
  
  const handleShare = () => {
    toast.success("Share options displayed");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Observation Details</DialogTitle>
          <DialogDescription>
            Recorded on {format(observation.timestamp, 'PPp')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
            <div>
              <h3 className="font-medium">NEWS2 Score</h3>
              <p className="text-sm text-gray-500">Clinical risk assessment</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`text-xl px-3 py-1 ${getScoreStatusColor(observation.score)}`}>
                {observation.score}
              </Badge>
              <span className={`font-medium ${
                observation.score >= 7 ? "text-red-600" :
                observation.score >= 5 ? "text-amber-600" : "text-green-600"
              }`}>
                {getScoreStatusText(observation.score)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Respiratory Rate</span>
              <p className="font-medium">{observation.respiratoryRate} breaths/min</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-gray-500">SpO2</span>
              <p className="font-medium">{observation.oxygenSaturation}%</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Supplemental Oxygen</span>
              <p className="font-medium">{observation.supplementalOxygen ? 'Yes' : 'No'}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Systolic BP</span>
              <p className="font-medium">{observation.systolicBP} mmHg</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Pulse Rate</span>
              <p className="font-medium">{observation.pulseRate} bpm</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Consciousness</span>
              <p className="font-medium">
                {observation.consciousness === 'A' ? 'Alert' : 
                 observation.consciousness === 'V' ? 'Response to Voice' :
                 observation.consciousness === 'P' ? 'Response to Pain' : 'Unresponsive'}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Temperature</span>
              <p className="font-medium">{observation.temperature.toFixed(1)} °C</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Recorded By</span>
              <p className="font-medium">{observation.recordedBy}</p>
            </div>
          </div>
          
          {observation.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm">{observation.notes}</p>
              </div>
            </>
          )}
          
          <div className="pt-2">
            <h4 className="text-sm font-medium mb-2">Clinical Response</h4>
            <div className="text-sm bg-gray-50 p-3 rounded-md border">
              {observation.score >= 7 ? (
                <p className="text-red-600">
                  • Urgent clinical review
                  <br />
                  • Consider transfer to higher level of care
                  <br />
                  • Continuous monitoring recommended
                </p>
              ) : observation.score >= 5 ? (
                <p className="text-amber-600">
                  • Urgent assessment by clinician
                  <br />
                  • Increased monitoring frequency
                </p>
              ) : (
                <p className="text-green-600">
                  • Continue routine monitoring
                  <br />
                  • Minimum 12 hourly observations
                </p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail}>
              <Mail className="h-3.5 w-3.5 mr-1" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share className="h-3.5 w-3.5 mr-1" />
              Share
            </Button>
          </div>
          
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
