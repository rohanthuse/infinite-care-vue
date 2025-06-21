
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, User, RotateCcw } from 'lucide-react';

interface BodyMapPoint {
  id: string;
  x: number;
  y: number;
  side: 'front' | 'back';
  type: string;
  severity: string;
  description: string;
  color: string;
}

interface BodyMapSelectorProps {
  selectedPoints: BodyMapPoint[];
  onPointsChange: (points: BodyMapPoint[]) => void;
}

export function BodyMapSelector({ selectedPoints, onPointsChange }: BodyMapSelectorProps) {
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<BodyMapPoint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const injuryTypes = [
    { value: 'bruise', label: 'Bruise', color: '#8B5CF6' },
    { value: 'cut', label: 'Cut', color: '#EF4444' },
    { value: 'burn', label: 'Burn', color: '#F97316' },
    { value: 'swelling', label: 'Swelling', color: '#06B6D4' },
    { value: 'rash', label: 'Rash', color: '#EC4899' },
    { value: 'pain', label: 'Pain', color: '#FBBF24' },
    { value: 'other', label: 'Other', color: '#6B7280' },
  ];

  const severityLevels = [
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
  ];

  const handleBodyClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPoint) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newPoint: BodyMapPoint = {
      id: `point-${Date.now()}`,
      x,
      y,
      side: currentSide,
      type: 'bruise',
      severity: 'minor',
      description: '',
      color: '#8B5CF6',
    };

    setSelectedPoint(newPoint);
    setIsDialogOpen(true);
    setIsAddingPoint(false);
  };

  const savePoint = (point: BodyMapPoint) => {
    const existingIndex = selectedPoints.findIndex(p => p.id === point.id);
    if (existingIndex >= 0) {
      const updatedPoints = [...selectedPoints];
      updatedPoints[existingIndex] = point;
      onPointsChange(updatedPoints);
    } else {
      onPointsChange([...selectedPoints, point]);
    }
    setIsDialogOpen(false);
    setSelectedPoint(null);
  };

  const removePoint = (pointId: string) => {
    onPointsChange(selectedPoints.filter(p => p.id !== pointId));
  };

  const editPoint = (point: BodyMapPoint) => {
    setSelectedPoint(point);
    setIsDialogOpen(true);
  };

  const currentSidePoints = selectedPoints.filter(p => p.side === currentSide);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Body Map
        </CardTitle>
        <CardDescription>
          Click "Add Point" then click on the body diagram to mark areas of injury or concern
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={currentSide === 'front' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentSide('front')}
            >
              Front View
            </Button>
            <Button
              type="button"
              variant={currentSide === 'back' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentSide('back')}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Back View
            </Button>
          </div>
          
          <Button
            type="button"
            variant={isAddingPoint ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsAddingPoint(!isAddingPoint)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isAddingPoint ? 'Cancel' : 'Add Point'}
          </Button>
          
          {selectedPoints.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPointsChange([])}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Body Diagram */}
        <div className="relative mx-auto max-w-md">
          <div
            className={`relative w-full h-96 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100 ${
              isAddingPoint ? 'cursor-crosshair border-blue-400 bg-blue-50' : 'cursor-default'
            }`}
            onClick={handleBodyClick}
          >
            {/* Simplified body outline */}
            <svg
              viewBox="0 0 200 400"
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            >
              {currentSide === 'front' ? (
                // Front view outline
                <g fill="none" stroke="#6B7280" strokeWidth="2">
                  {/* Head */}
                  <circle cx="100" cy="40" r="25" />
                  {/* Neck */}
                  <line x1="100" y1="65" x2="100" y2="80" />
                  {/* Torso */}
                  <rect x="75" y="80" width="50" height="120" rx="10" />
                  {/* Arms */}
                  <rect x="45" y="90" width="25" height="80" rx="12" />
                  <rect x="130" y="90" width="25" height="80" rx="12" />
                  {/* Legs */}
                  <rect x="85" y="200" width="15" height="120" rx="7" />
                  <rect x="100" y="200" width="15" height="120" rx="7" />
                  {/* Hands */}
                  <circle cx="57" cy="180" r="8" />
                  <circle cx="143" cy="180" r="8" />
                  {/* Feet */}
                  <ellipse cx="92" cy="330" rx="8" ry="12" />
                  <ellipse cx="108" cy="330" rx="8" ry="12" />
                </g>
              ) : (
                // Back view outline
                <g fill="none" stroke="#6B7280" strokeWidth="2">
                  {/* Head */}
                  <circle cx="100" cy="40" r="25" />
                  {/* Neck */}
                  <line x1="100" y1="65" x2="100" y2="80" />
                  {/* Torso */}
                  <rect x="75" y="80" width="50" height="120" rx="10" />
                  {/* Arms */}
                  <rect x="45" y="90" width="25" height="80" rx="12" />
                  <rect x="130" y="90" width="25" height="80" rx="12" />
                  {/* Legs */}
                  <rect x="85" y="200" width="15" height="120" rx="7" />
                  <rect x="100" y="200" width="15" height="120" rx="7" />
                  {/* Hands */}
                  <circle cx="57" cy="180" r="8" />
                  <circle cx="143" cy="180" r="8" />
                  {/* Feet */}
                  <ellipse cx="92" cy="330" rx="8" ry="12" />
                  <ellipse cx="108" cy="330" rx="8" ry="12" />
                  {/* Spine line for back view */}
                  <line x1="100" y1="80" x2="100" y2="200" strokeDasharray="3,3" />
                </g>
              )}
            </svg>

            {/* Injury points */}
            {currentSidePoints.map((point) => (
              <div
                key={point.id}
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-2 -translate-y-2 hover:scale-125 transition-transform"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  backgroundColor: point.color,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  editPoint(point);
                }}
                title={`${point.type} (${point.severity})`}
              />
            ))}

            {isAddingPoint && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-50">
                <div className="text-blue-600 font-medium">Click to add injury point</div>
              </div>
            )}
          </div>
        </div>

        {/* Points Legend */}
        {selectedPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Marked Points:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedPoints.map((point) => (
                <Badge
                  key={point.id}
                  variant="outline"
                  className="flex items-center gap-1"
                  style={{ borderColor: point.color }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: point.color }}
                  />
                  {point.type} ({point.side})
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePoint(point.id);
                    }}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Point Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedPoint?.id.startsWith('point-') ? 'Add' : 'Edit'} Injury Point
              </DialogTitle>
              <DialogDescription>
                Provide details about the injury or area of concern
              </DialogDescription>
            </DialogHeader>
            
            {selectedPoint && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={selectedPoint.type}
                    onValueChange={(value) => {
                      const injuryType = injuryTypes.find(t => t.value === value);
                      setSelectedPoint({
                        ...selectedPoint,
                        type: value,
                        color: injuryType?.color || '#6B7280',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {injuryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Select
                    value={selectedPoint.severity}
                    onValueChange={(value) =>
                      setSelectedPoint({ ...selectedPoint, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Additional details about this injury..."
                    value={selectedPoint.description}
                    onChange={(e) =>
                      setSelectedPoint({ ...selectedPoint, description: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedPoint && savePoint(selectedPoint)}>
                {selectedPoint?.id.startsWith('point-') ? 'Add Point' : 'Update Point'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
