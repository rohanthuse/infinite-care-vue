
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, ClipboardCheck, AlertCircle } from "lucide-react";

interface VisitCheckInProps {
  client: {
    id: string;
    name: string;
    address: string;
    appointmentType: string;
    scheduledDuration: string;
    scheduledTime: string;
  };
  onCheckInComplete: () => void;
}

export const VisitCheckIn: React.FC<VisitCheckInProps> = ({ client, onCheckInComplete }) => {
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false);
  const [initialAssessment, setInitialAssessment] = useState("");
  const [safeToEnter, setSafeToEnter] = useState(false);
  const [clientPresent, setClientPresent] = useState(false);
  const [confirmObjectives, setConfirmObjectives] = useState(false);
  
  // Simulated objectives
  const visitObjectives = [
    "Personal care assistance",
    "Medication oversight",
    "Meal preparation",
    "Mobility support"
  ];
  
  const handleStartVisit = () => {
    onCheckInComplete();
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visit Check-In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Arrival Confirmation */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium">Arrival Confirmation</h3>
              </div>
              <Input 
                type="time"
                className="w-28"
                defaultValue={new Date().toTimeString().slice(0, 5)}
              />
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <Checkbox 
                id="arrival-confirmed" 
                checked={arrivalConfirmed} 
                onCheckedChange={(value) => setArrivalConfirmed(value === true)}
              />
              <Label htmlFor="arrival-confirmed">
                I confirm I have arrived at {client.address} for the scheduled visit
              </Label>
            </div>
          </div>
          
          {/* Safety Check */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="font-medium">Safety Check</h3>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="safe-to-enter" 
                  checked={safeToEnter} 
                  onCheckedChange={(value) => setSafeToEnter(value === true)}
                />
                <Label htmlFor="safe-to-enter">
                  I confirm it is safe to enter the property
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="client-present" 
                  checked={clientPresent} 
                  onCheckedChange={(value) => setClientPresent(value === true)}
                />
                <Label htmlFor="client-present">
                  The client is present at the property
                </Label>
              </div>
            </div>
          </div>
          
          {/* Initial Assessment */}
          <div>
            <Label htmlFor="initial-assessment" className="font-medium">Initial Assessment</Label>
            <Textarea
              id="initial-assessment"
              placeholder="Describe the client's condition upon arrival..."
              className="mt-2"
              value={initialAssessment}
              onChange={(e) => setInitialAssessment(e.target.value)}
            />
          </div>
          
          {/* Visit Objectives */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex items-center">
              <ClipboardCheck className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium">Visit Objectives</h3>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">The following tasks are scheduled for this visit:</p>
              <ul className="space-y-2">
                {visitObjectives.map((objective, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 flex items-center gap-2">
                <Checkbox 
                  id="confirm-objectives" 
                  checked={confirmObjectives} 
                  onCheckedChange={(value) => setConfirmObjectives(value === true)}
                />
                <Label htmlFor="confirm-objectives">
                  I confirm I understand the objectives of this visit
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleStartVisit}
          disabled={!arrivalConfirmed || !safeToEnter || !clientPresent || !confirmObjectives || !initialAssessment}
        >
          Start Visit
        </Button>
      </div>
    </div>
  );
};
