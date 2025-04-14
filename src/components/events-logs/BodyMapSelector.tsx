
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { generateBodyMapSvg, getInjuryColorClass, getInjuryLabel } from '@/lib/bodyMapUtils';

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

  const frontSvgUrl = generateBodyMapSvg('front');
  const backSvgUrl = generateBodyMapSvg('back');

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        <div className="w-full md:w-60">
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
              <SelectItem value="cut">Cut/Laceration</SelectItem>
              <SelectItem value="burn">Burn</SelectItem>
              <SelectItem value="rash">Rash</SelectItem>
              <SelectItem value="swelling">Swelling</SelectItem>
              <SelectItem value="fracture">Fracture</SelectItem>
              <SelectItem value="pressure_sore">Pressure Sore</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <span>Select injury type, then click on body map to mark location</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 ml-1 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-xs">
                Click on the body map to add injuries. Click on an existing injury marker to remove it.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors cursor-crosshair" 
          onClick={handleImageClick}
          style={{ 
            backgroundImage: `url(${frontSvgUrl})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '400px'
          }}
        >
          <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs font-medium">Front View</div>
          
          {bodyMapPoints.map(point => (
            <TooltipProvider key={point.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute w-5 h-5 rounded-full -ml-2.5 -mt-2.5 border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform ${getInjuryColorClass(point.type)}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePoint(point.id);
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {getInjuryLabel(point.type)} (Click to remove)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        
        <div 
          className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors cursor-crosshair" 
          onClick={handleImageClick}
          style={{ 
            backgroundImage: `url(${backSvgUrl})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '400px'
          }}
        >
          <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs font-medium">Back View</div>
          
          {bodyMapPoints.map(point => (
            <TooltipProvider key={point.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute w-5 h-5 rounded-full -ml-2.5 -mt-2.5 border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform ${getInjuryColorClass(point.type)}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePoint(point.id);
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {getInjuryLabel(point.type)} (Click to remove)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
      
      {bodyMapPoints.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <Label>Injury points ({bodyMapPoints.length})</Label>
            {bodyMapPoints.length > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setBodyMapPoints([])}
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
            {bodyMapPoints.map(point => (
              <div 
                key={point.id} 
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getInjuryColorClass(point.type)}`}></div>
                  <span className="text-sm capitalize">{getInjuryLabel(point.type)}</span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemovePoint(point.id)}
                  className="h-6 w-6 p-0"
                >
                  <span className="sr-only">Remove</span>
                  <span className="text-red-500">&times;</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Color Legend */}
      <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Injury Type Legend:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1.5"></div>
            <span className="text-xs">Bruise</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
            <span className="text-xs">Cut/Laceration</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-1.5"></div>
            <span className="text-xs">Burn</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-pink-500 mr-1.5"></div>
            <span className="text-xs">Rash</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
            <span className="text-xs">Swelling</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-600 mr-1.5"></div>
            <span className="text-xs">Fracture</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-600 mr-1.5"></div>
            <span className="text-xs">Pressure Sore</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-1.5"></div>
            <span className="text-xs">Other</span>
          </div>
        </div>
      </div>
    </div>
  );
}
