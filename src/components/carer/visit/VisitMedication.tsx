
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Clock, CheckCircle } from "lucide-react";

interface VisitMedicationProps {
  clientId: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  time: string;
  administered: boolean;
  notes: string;
}

export const VisitMedication: React.FC<VisitMedicationProps> = ({ clientId }) => {
  // Mock medications - in a real app these would be fetched based on clientId
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: "1",
      name: "Atorvastatin",
      dosage: "20mg",
      instructions: "Take 1 tablet with water",
      time: "Morning",
      administered: false,
      notes: ""
    },
    {
      id: "2",
      name: "Amlodipine",
      dosage: "5mg",
      instructions: "Take 1 tablet with or after food",
      time: "Morning",
      administered: false,
      notes: ""
    },
    {
      id: "3",
      name: "Metformin",
      dosage: "500mg",
      instructions: "Take 1 tablet after breakfast",
      time: "Morning",
      administered: false,
      notes: ""
    }
  ]);
  
  const handleAdminister = (medId: string, administered: boolean) => {
    setMedications(medications.map(med => 
      med.id === medId ? { ...med, administered, notes: administered ? med.notes : "" } : med
    ));
  };
  
  const handleNotes = (medId: string, notes: string) => {
    setMedications(medications.map(med => 
      med.id === medId ? { ...med, notes } : med
    ));
  };
  
  const completedMeds = medications.filter(med => med.administered).length;
  const totalMeds = medications.length;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span>Medication Administration</span>
            </CardTitle>
            <Badge className={completedMeds === totalMeds ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
              {completedMeds}/{totalMeds} Administered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead className="w-[200px]">Instructions</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((medication) => (
                <TableRow key={medication.id}>
                  <TableCell className="font-medium">{medication.name}</TableCell>
                  <TableCell>{medication.dosage}</TableCell>
                  <TableCell>{medication.instructions}</TableCell>
                  <TableCell>{medication.time}</TableCell>
                  <TableCell>
                    <Badge variant={medication.administered ? "success" : "outline"}>
                      {medication.administered ? "Administered" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant={medication.administered ? "outline" : "default"}
                      onClick={() => handleAdminister(medication.id, !medication.administered)}
                    >
                      {medication.administered ? "Undo" : "Administer"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-6 space-y-4">
            {medications.filter(med => med.administered).map((medication) => (
              <div key={`notes-${medication.id}`} className="p-4 border rounded-md bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">{medication.name} ({medication.dosage}) - Notes</h4>
                </div>
                
                <Textarea
                  placeholder="Add any notes about the medication administration..."
                  value={medication.notes}
                  onChange={(e) => handleNotes(medication.id, e.target.value)}
                  className="mt-2"
                />
                
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Administered at {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
