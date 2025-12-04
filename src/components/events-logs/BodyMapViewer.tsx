
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Info, ImageIcon } from 'lucide-react';
import { generateBodyMapSvg } from '@/lib/bodyMapUtils';

interface BodyMapPoint {
  id: string;
  x: number;
  y: number;
  side: 'front' | 'back';
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  notes?: string;
}

interface BodyMapViewerProps {
  bodyMapPoints: BodyMapPoint[];
  frontImageUrl?: string;
  backImageUrl?: string;
}

export function BodyMapViewer({ bodyMapPoints, frontImageUrl, backImageUrl }: BodyMapViewerProps) {
  const [selectedPoint, setSelectedPoint] = useState<BodyMapPoint | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<{ front: boolean; back: boolean }>({
    front: false,
    back: false
  });

  if (!bodyMapPoints || bodyMapPoints.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No body map points recorded</p>
      </div>
    );
  }

  const frontPoints = bodyMapPoints.filter(point => point.side === 'front');
  const backPoints = bodyMapPoints.filter(point => point.side === 'back');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleImageError = (side: 'front' | 'back') => {
    setImageLoadErrors(prev => ({ ...prev, [side]: true }));
  };

  const renderStaticImage = (side: 'front' | 'back', imageUrl: string, points: BodyMapPoint[]) => (
    <div className="relative mx-auto" style={{ width: '300px', height: '500px' }}>
      <img
        src={imageUrl}
        alt={`${side} view body map`}
        className="absolute inset-0 w-full h-full object-contain"
        onError={() => handleImageError(side)}
      />
      
      {/* Clickable areas for points (invisible overlay) */}
      {points.map((point) => (
        <button
          key={point.id}
          className="absolute w-5 h-5 rounded-full opacity-0 hover:opacity-20 hover:bg-blue-500 transition-opacity z-10"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => setSelectedPoint(point)}
          title={`${point.type} - ${point.severity}`}
        />
      ))}
      
      {/* Side label */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <Badge variant="outline" className="text-xs bg-white">
          <ImageIcon className="h-3 w-3 mr-1" />
          {side === 'front' ? 'Front View (Saved)' : 'Back View (Saved)'}
        </Badge>
      </div>
    </div>
  );

  const renderDynamicDiagram = (side: 'front' | 'back', points: BodyMapPoint[]) => (
    <div className="relative mx-auto" style={{ width: '300px', height: '500px' }}>
      {/* Realistic Body Diagram */}
      <div 
        className="absolute inset-0 bg-contain bg-no-repeat bg-center"
        style={{ 
          backgroundImage: `url(${generateBodyMapSvg(side)})`,
          backgroundSize: 'contain'
        }}
      />

      {/* Render points */}
      {points.map((point) => (
        <button
          key={point.id}
          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg hover:scale-125 transition-transform z-10 flex items-center justify-center text-white text-xs font-bold"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
            backgroundColor: point.color,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => setSelectedPoint(point)}
          title={`${point.type} - ${point.severity}`}
        >
          {point.id.slice(-1).toUpperCase()}
        </button>
      ))}
      
      {/* Side label */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <Badge variant="outline" className="text-xs bg-white">
          {side === 'front' ? 'Front View' : 'Back View'}
        </Badge>
      </div>
    </div>
  );

  const renderBodyView = (side: 'front' | 'back', points: BodyMapPoint[], imageUrl?: string) => {
    const hasError = imageLoadErrors[side];
    
    if (imageUrl && !hasError) {
      return renderStaticImage(side, imageUrl, points);
    } else {
      return renderDynamicDiagram(side, points);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="front" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="front" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Front View ({frontPoints.length})
            {frontImageUrl && !imageLoadErrors.front && (
              <ImageIcon className="h-3 w-3 text-green-600" />
            )}
          </TabsTrigger>
          <TabsTrigger value="back" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Back View ({backPoints.length})
            {backImageUrl && !imageLoadErrors.back && (
              <ImageIcon className="h-3 w-3 text-green-600" />
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="front" className="mt-4">
          <div className="bg-gray-50 rounded-lg p-6 flex justify-center">
            {frontPoints.length > 0 ? (
              renderBodyView('front', frontPoints, frontImageUrl)
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No points marked on front view</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="back" className="mt-4">
          <div className="bg-gray-50 rounded-lg p-6 flex justify-center">
            {backPoints.length > 0 ? (
              renderBodyView('back', backPoints, backImageUrl)
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No points marked on back view</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Point Details */}
      {selectedPoint && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Point Details</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPoint(null)}
              className="text-blue-600 hover:text-blue-700"
            >
              ×
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <span className="text-sm">{selectedPoint.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Severity:</span>
              <Badge variant="custom" className={getSeverityColor(selectedPoint.severity)}>
                {selectedPoint.severity}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Side:</span>
              <Badge variant="outline">{selectedPoint.side}</Badge>
            </div>
            {selectedPoint.notes && (
              <div>
                <span className="text-sm font-medium">Notes:</span>
                <p className="text-sm text-gray-600 mt-1">{selectedPoint.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Points Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Points:</span>
            <span className="ml-2">{bodyMapPoints.length}</span>
          </div>
          <div>
            <span className="font-medium">Critical:</span>
            <span className="ml-2 text-red-600">
              {bodyMapPoints.filter(p => p.severity === 'critical').length}
            </span>
          </div>
          <div>
            <span className="font-medium">Front View:</span>
            <span className="ml-2">{frontPoints.length}</span>
            {frontImageUrl && !imageLoadErrors.front && (
              <ImageIcon className="h-3 w-3 inline ml-1 text-green-600" />
            )}
          </div>
          <div>
            <span className="font-medium">Back View:</span>
            <span className="ml-2">{backPoints.length}</span>
            {backImageUrl && !imageLoadErrors.back && (
              <ImageIcon className="h-3 w-3 inline ml-1 text-green-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
