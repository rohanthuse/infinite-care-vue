
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateBodyMapSvg, getInjuryColorClass, getInjuryLabel } from "@/lib/bodyMapUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";

interface BodyMapSelectorProps {
  bodyMapPoints: Array<{ id: string; x: number; y: number; type: string; description: string }>;
  setBodyMapPoints: React.Dispatch<
    React.SetStateAction<Array<{ id: string; x: number; y: number; type: string; description: string }>>
  >;
}

export function BodyMapSelector({ bodyMapPoints, setBodyMapPoints }: BodyMapSelectorProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedInjuryType, setSelectedInjuryType] = useState("bruise");
  const [injuryDescription, setInjuryDescription] = useState("");

  const injuryTypes = [
    { value: "bruise", label: "Bruise" },
    { value: "cut", label: "Cut/Laceration" },
    { value: "burn", label: "Burn" },
    { value: "rash", label: "Rash" },
    { value: "swelling", label: "Swelling" },
    { value: "fracture", label: "Fracture" },
    { value: "pressure_sore", label: "Pressure Sore" },
    { value: "other", label: "Other" }
  ];

  // Handle body map click event to add a new injury point
  const handleBodyMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoint = {
      id: crypto.randomUUID(),
      x,
      y,
      type: selectedInjuryType,
      description: injuryDescription || `${getInjuryLabel(selectedInjuryType)} on ${view} body`
    };
    
    setBodyMapPoints([...bodyMapPoints, newPoint]);
    setInjuryDescription("");
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col">
          <div className="mb-4">
            <Tabs defaultValue="front" value={view} onValueChange={(v) => setView(v as 'front' | 'back')}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="front">Front View</TabsTrigger>
                <TabsTrigger value="back">Back View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="injury-type" className="block mb-2 text-sm font-medium">Injury Type</Label>
              <Select value={selectedInjuryType} onValueChange={setSelectedInjuryType}>
                <SelectTrigger id="injury-type">
                  <SelectValue placeholder="Select injury type" />
                </SelectTrigger>
                <SelectContent>
                  {injuryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="injury-description" className="block mb-2 text-sm font-medium">Description</Label>
              <Input 
                id="injury-description"
                placeholder="Optional description"
                value={injuryDescription}
                onChange={(e) => setInjuryDescription(e.target.value)}
              />
            </div>
          </div>

          <div 
            className="bg-gray-50 w-full h-[400px] mb-4 rounded-md cursor-crosshair relative overflow-hidden"
            style={{
              backgroundImage: `url(${generateBodyMapSvg(view)})`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain'
            }}
            onClick={handleBodyMapClick}
          >
            {bodyMapPoints
              .filter(point => point.type && point.x >= 0 && point.y >= 0)
              .map((point) => (
                <div
                  key={point.id}
                  className={`absolute rounded-full border-2 border-white shadow-md ${getInjuryColorClass(point.type)}`}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    width: '16px',
                    height: '16px',
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={point.description || getInjuryLabel(point.type)}
                />
              ))}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {injuryTypes.map((type) => (
              <div 
                key={type.value} 
                className="flex items-center" 
                title={type.label}
              >
                <div 
                  className={`w-3 h-3 rounded-full mr-1 ${getInjuryColorClass(type.value)}`} 
                />
                <span className="text-xs">{type.label}</span>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            className="self-end mb-2"
            onClick={() => setBodyMapPoints([])}
          >
            Clear All Points
          </Button>
          
          {bodyMapPoints.length > 0 && (
            <div className="mt-2 w-full">
              <h4 className="text-sm font-medium mb-2">Added Injury Points</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 bg-gray-50 rounded-md">
                {bodyMapPoints.map((point) => (
                  <div key={point.id} className="p-2 bg-white border rounded-md flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-2 ${getInjuryColorClass(point.type)}`} />
                      <div>
                        <span className="text-sm font-medium">{getInjuryLabel(point.type)}</span>
                        <p className="text-xs text-gray-500">
                          {point.description || `Position: ${point.x.toFixed(1)}%, ${point.y.toFixed(1)}%`}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => {
                        setBodyMapPoints(bodyMapPoints.filter(p => p.id !== point.id));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
