
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BodyMapSelectorProps {
  bodyMapPoints: Array<{ id: string; x: number; y: number; type: string }>;
  setBodyMapPoints: React.Dispatch<
    React.SetStateAction<Array<{ id: string; x: number; y: number; type: string }>>
  >;
}

export function BodyMapSelector({ bodyMapPoints, setBodyMapPoints }: BodyMapSelectorProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="bg-gray-100 w-full h-[300px] mb-4 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Body Map Selection - Click to add injury points</p>
          </div>
          <div className="flex justify-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const mockPoint = {
                  id: crypto.randomUUID(),
                  x: Math.random() * 100,
                  y: Math.random() * 100,
                  type: "bruise"
                };
                setBodyMapPoints([...bodyMapPoints, mockPoint]);
              }}
            >
              Add Bruise
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const mockPoint = {
                  id: crypto.randomUUID(),
                  x: Math.random() * 100,
                  y: Math.random() * 100,
                  type: "cut"
                };
                setBodyMapPoints([...bodyMapPoints, mockPoint]);
              }}
            >
              Add Cut
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setBodyMapPoints([])}
            >
              Clear
            </Button>
          </div>
          
          {bodyMapPoints.length > 0 && (
            <div className="mt-4 w-full">
              <h4 className="text-sm font-medium mb-2">Added Injury Points</h4>
              <div className="space-y-2">
                {bodyMapPoints.map((point) => (
                  <div key={point.id} className="p-2 bg-gray-50 border rounded-md flex justify-between">
                    <span className="text-sm">
                      {point.type} - position: {point.x.toFixed(1)}%, {point.y.toFixed(1)}%
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => {
                        setBodyMapPoints(bodyMapPoints.filter(p => p.id !== point.id));
                      }}
                    >
                      ×
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
