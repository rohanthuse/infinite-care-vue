
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface BodyMapPoint {
  id: string;
  x: number;
  y: number;
  type: string;
}

interface BodyMapSelectorProps {
  bodyMapPoints: BodyMapPoint[];
  setBodyMapPoints: React.Dispatch<React.SetStateAction<BodyMapPoint[]>>;
}

export function BodyMapSelector({ bodyMapPoints, setBodyMapPoints }: BodyMapSelectorProps) {
  const [selectedType, setSelectedType] = useState("bruise");
  
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate percentage positions (for responsive positioning)
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    setBodyMapPoints(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        x: xPercent,
        y: yPercent,
        type: selectedType
      }
    ]);
  };
  
  const handleRemovePoint = (id: string) => {
    setBodyMapPoints(prev => prev.filter(point => point.id !== id));
  };
  
  const getMarkerColor = (type: string) => {
    switch(type) {
      case 'bruise':
        return 'bg-purple-500';
      case 'cut':
        return 'bg-red-500';
      case 'burn':
        return 'bg-orange-500';
      case 'rash':
        return 'bg-pink-500';
      case 'swelling':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-60">
          <Label htmlFor="injury-type">Injury type</Label>
          <Select 
            value={selectedType} 
            onValueChange={setSelectedType}
          >
            <SelectTrigger id="injury-type" className="mt-1">
              <SelectValue placeholder="Select injury type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bruise">Bruise</SelectItem>
              <SelectItem value="cut">Cut</SelectItem>
              <SelectItem value="burn">Burn</SelectItem>
              <SelectItem value="rash">Rash</SelectItem>
              <SelectItem value="swelling">Swelling</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-500 mt-5">
          Select injury type, then click on body map to mark location
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100 cursor-crosshair" 
          onClick={handleImageClick}
        >
          <div className="aspect-[2/3] flex items-center justify-center">
            <span className="text-gray-400 font-medium">Front View</span>
            {/* Placeholder for body outline front image */}
            {/* In a real implementation, you would have an actual body outline SVG or image here */}
          </div>
          
          {bodyMapPoints.map(point => (
            <div
              key={point.id}
              className={`absolute w-5 h-5 rounded-full -ml-2.5 -mt-2.5 border-2 border-white cursor-pointer ${getMarkerColor(point.type)}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePoint(point.id);
              }}
              title={`${point.type} (click to remove)`}
            />
          ))}
        </div>
        
        <div 
          className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100 cursor-crosshair" 
          onClick={handleImageClick}
        >
          <div className="aspect-[2/3] flex items-center justify-center">
            <span className="text-gray-400 font-medium">Back View</span>
            {/* Placeholder for body outline back image */}
          </div>
          
          {bodyMapPoints.map(point => (
            <div
              key={point.id}
              className={`absolute w-5 h-5 rounded-full -ml-2.5 -mt-2.5 border-2 border-white cursor-pointer ${getMarkerColor(point.type)}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePoint(point.id);
              }}
              title={`${point.type} (click to remove)`}
            />
          ))}
        </div>
      </div>
      
      {bodyMapPoints.length > 0 && (
        <div className="mt-4">
          <Label>Injury points ({bodyMapPoints.length})</Label>
          <div className="mt-2 space-y-2">
            {bodyMapPoints.map(point => (
              <div 
                key={point.id} 
                className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded"
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getMarkerColor(point.type)}`}></div>
                  <span className="text-sm capitalize">{point.type}</span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemovePoint(point.id)}
                >
                  <span className="sr-only">Remove</span>
                  <span className="text-red-500">&times;</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
