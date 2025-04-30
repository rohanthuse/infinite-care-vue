
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MessageCircle, AlertCircle, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface VisitObservationsProps {
  clientId: string;
}

export const VisitObservations: React.FC<VisitObservationsProps> = ({ clientId }) => {
  const [generalNotes, setGeneralNotes] = useState("");
  const [moodSelection, setMoodSelection] = useState("");
  const [painLevel, setPainLevel] = useState("");
  const [concerns, setConcerns] = useState<{[key: string]: boolean}>({
    mobility: false,
    nutrition: false,
    hydration: false,
    skin: false,
    cognitive: false,
    emotional: false
  });
  const [openConcernDialog, setOpenConcernDialog] = useState(false);
  const [concernType, setConcernType] = useState("");
  const [concernNotes, setConcernNotes] = useState("");
  
  const handleConcernChange = (key: string, checked: boolean) => {
    setConcerns(prev => ({
      ...prev,
      [key]: checked
    }));
  };
  
  const handleAddConcern = () => {
    setOpenConcernDialog(false);
    // In a real app, we would save the concern to the database
    setConcernType("");
    setConcernNotes("");
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
            <span>General Observations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mood" className="font-medium mb-2 block">Client's Mood</Label>
              <RadioGroup id="mood" value={moodSelection} onValueChange={setMoodSelection} className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="happy" id="mood-happy" />
                  <Label htmlFor="mood-happy">Happy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="calm" id="mood-calm" />
                  <Label htmlFor="mood-calm">Calm</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anxious" id="mood-anxious" />
                  <Label htmlFor="mood-anxious">Anxious</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="distressed" id="mood-distressed" />
                  <Label htmlFor="mood-distressed">Distressed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="confused" id="mood-confused" />
                  <Label htmlFor="mood-confused">Confused</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="pain" className="font-medium mb-2 block">Pain Level (if applicable)</Label>
              <Select value={painLevel} onValueChange={setPainLevel}>
                <SelectTrigger id="pain" className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select pain level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - No Pain</SelectItem>
                  <SelectItem value="1">1 - Very Mild</SelectItem>
                  <SelectItem value="2">2 - Discomforting</SelectItem>
                  <SelectItem value="3">3 - Tolerable</SelectItem>
                  <SelectItem value="4">4 - Distressing</SelectItem>
                  <SelectItem value="5">5 - Very Distressing</SelectItem>
                  <SelectItem value="6">6 - Intense</SelectItem>
                  <SelectItem value="7">7 - Very Intense</SelectItem>
                  <SelectItem value="8">8 - Utterly Horrible</SelectItem>
                  <SelectItem value="9">9 - Excruciating</SelectItem>
                  <SelectItem value="10">10 - Unimaginable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="general-notes" className="font-medium mb-2 block">General Notes</Label>
              <Textarea
                id="general-notes"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Record general observations about the client's wellbeing, environment, etc."
                className="min-h-[150px]"
              />
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Add Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
            <span>Areas of Concern</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4 text-gray-600">
            Indicate any areas of concern that require attention or follow-up:
          </p>
          
          <div className="space-y-3">
            {Object.entries(concerns).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox 
                  id={`concern-${key}`} 
                  checked={value} 
                  onCheckedChange={(checked) => handleConcernChange(key, checked === true)}
                />
                <Label htmlFor={`concern-${key}`} className="capitalize">{key}</Label>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Dialog open={openConcernDialog} onOpenChange={setOpenConcernDialog}>
              <DialogTrigger asChild>
                <Button>Document Concern</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Document Area of Concern</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="concern-type">Type of Concern</Label>
                    <Select value={concernType} onValueChange={setConcernType}>
                      <SelectTrigger id="concern-type">
                        <SelectValue placeholder="Select area of concern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobility">Mobility</SelectItem>
                        <SelectItem value="nutrition">Nutrition</SelectItem>
                        <SelectItem value="hydration">Hydration</SelectItem>
                        <SelectItem value="skin">Skin Integrity</SelectItem>
                        <SelectItem value="cognitive">Cognitive Function</SelectItem>
                        <SelectItem value="emotional">Emotional Wellbeing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="concern-details">Details</Label>
                    <Textarea 
                      id="concern-details" 
                      placeholder="Describe the concern in detail..."
                      value={concernNotes}
                      onChange={(e) => setConcernNotes(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="concern-severity">Severity</Label>
                    <RadioGroup id="concern-severity" defaultValue="medium" className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="severity-low" />
                        <Label htmlFor="severity-low">Low</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="severity-medium" />
                        <Label htmlFor="severity-medium">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="severity-high" />
                        <Label htmlFor="severity-high">High</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenConcernDialog(false)}>Cancel</Button>
                  <Button onClick={handleAddConcern}>Add Concern</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
