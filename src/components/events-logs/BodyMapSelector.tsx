
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, User, RotateCcw, Loader2 } from 'lucide-react';

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
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

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

  // Get the appropriate background image URL based on current side
  const getBackgroundImageUrl = () => {
    if (currentSide === 'front') {
      return '/lovable-uploads/7bee49ea-2274-4e66-a8f7-e5f32fcb207b.png';
    } else {
      return '/lovable-uploads/e823d8ed-e260-4f9e-b0af-edf308ef3e29.png';
    }
  };

  // Preload image function
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log('Body map image loaded successfully:', url);
        resolve();
      };
      img.onerror = () => {
        console.error('Failed to load body map image:', url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  };

  // Load images when component mounts or side changes
  useEffect(() => {
    const currentImageUrl = getBackgroundImageUrl();
    
    if (loadedImages[currentImageUrl]) {
      setImageLoading(false);
      setImageError(false);
      return;
    }

    setImageLoading(true);
    setImageError(false);

    preloadImage(currentImageUrl)
      .then(() => {
        setLoadedImages(prev => ({ ...prev, [currentImageUrl]: true }));
        setImageLoading(false);
        setImageError(false);
      })
      .catch(() => {
        setImageLoading(false);
        setImageError(true);
      });
  }, [currentSide]);

  const handleBodyClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPoint || imageLoading || imageError) return;

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
            disabled={imageLoading || imageError}
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

        {/* Body Diagram Container */}
        <div className="relative mx-auto max-w-md">
          <div
            className={`relative w-full h-[600px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden ${
              isAddingPoint && !imageLoading && !imageError ? 'cursor-crosshair border-blue-400 bg-blue-50' : 'cursor-default'
            }`}
            onClick={handleBodyClick}
          >
            {/* Loading State */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-600 text-sm">Loading body map...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {imageError && !imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-500">
                  <User className="h-24 w-24 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Body map image unavailable</p>
                  <p className="text-xs text-gray-400 mt-1">Click functionality disabled</p>
                </div>
              </div>
            )}

            {/* Body Map Image */}
            {!imageLoading && !imageError && (
              <div 
                className="absolute inset-0 w-full h-full bg-no-repeat bg-center"
                style={{ 
                  backgroundImage: `url(${getBackgroundImageUrl()})`,
                  backgroundSize: 'contain'
                }}
              />
            )}

            {/* Injury points */}
            {!imageLoading && !imageError && currentSidePoints.map((point) => (
              <div
                key={point.id}
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-2 -translate-y-2 hover:scale-125 transition-transform z-10"
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

            {/* Add Point Overlay */}
            {isAddingPoint && !imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-50 z-5">
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
