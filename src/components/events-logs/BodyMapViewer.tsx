
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Info } from 'lucide-react';

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
}

export function BodyMapViewer({ bodyMapPoints }: BodyMapViewerProps) {
  const [selectedPoint, setSelectedPoint] = useState<BodyMapPoint | null>(null);

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

  const renderBodyDiagram = (side: 'front' | 'back', points: BodyMapPoint[]) => (
    <div className="relative mx-auto" style={{ width: '300px', height: '400px' }}>
      {/* Body outline SVG */}
      <svg
        width="300"
        height="400"
        viewBox="0 0 300 400"
        className="absolute inset-0"
      >
        {/* Basic human body outline */}
        <path
          d="M150 20 C140 20 130 30 130 40 L130 60 C120 65 110 80 110 100 L110 200 C110 220 120 240 130 250 L130 380 L170 380 L170 250 C180 240 190 220 190 200 L190 100 C190 80 180 65 170 60 L170 40 C170 30 160 20 150 20 Z"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Head */}
        <circle cx="150" cy="30" r="20" fill="none" stroke="#e5e7eb" strokeWidth="2" />
        
        {/* Arms */}
        <path
          d="M110 100 L80 120 L80 180 L90 180 L110 160"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <path
          d="M190 100 L220 120 L220 180 L210 180 L190 160"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Legs */}
        <path
          d="M130 250 L130 350 L120 380 L140 380 L150 350"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <path
          d="M170 250 L170 350 L180 380 L160 380 L150 350"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
      </svg>

      {/* Render points */}
      {points.map((point) => (
        <button
          key={point.id}
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg hover:scale-125 transition-transform z-10"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
            backgroundColor: point.color,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => setSelectedPoint(point)}
          title={`${point.type} - ${point.severity}`}
        />
      ))}
      
      {/* Side label */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <Badge variant="outline" className="text-xs">
          {side === 'front' ? 'Front View' : 'Back View'}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="front" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="front" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Front View ({frontPoints.length})
          </TabsTrigger>
          <TabsTrigger value="back" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Back View ({backPoints.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="front" className="mt-4">
          <div className="bg-gray-50 rounded-lg p-6">
            {frontPoints.length > 0 ? (
              renderBodyDiagram('front', frontPoints)
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No points marked on front view</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="back" className="mt-4">
          <div className="bg-gray-50 rounded-lg p-6">
            {backPoints.length > 0 ? (
              renderBodyDiagram('back', backPoints)
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
              <Badge className={getSeverityColor(selectedPoint.severity)}>
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
          </div>
          <div>
            <span className="font-medium">Back View:</span>
            <span className="ml-2">{backPoints.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
