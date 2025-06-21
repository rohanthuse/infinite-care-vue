
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, User, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';

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

interface LoadedImageState {
  isLoaded: boolean;
  imageUrl?: string;
}

export function BodyMapSelector({ selectedPoints, onPointsChange }: BodyMapSelectorProps) {
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<BodyMapPoint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, LoadedImageState>>({});
  const [debugInfo, setDebugInfo] = useState<string>('');

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

  // Multiple image sources with fallbacks
  const getImageSources = (side: 'front' | 'back') => {
    if (side === 'front') {
      return [
        '/lovable-uploads/ae9319f2-7a0b-422d-9739-bb11a44681c9.png',
        '/lovable-uploads/7bee49ea-2274-4e66-a8f7-e5f32fcb207b.png',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=600&fit=crop&auto=format',
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDMwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNTBDMTcwIDUwIDE4MCA3MCAyMDAgMTAwQzIyMCAxNTAgMjIwIDIwMCAyMDAgMzAwQzE4MCA0MDAgMTgwIDUwMCAxNTAgNTUwQzEyMCA1MDAgMTIwIDQwMCAxMDAgMzAwQzgwIDIwMCA4MCAxNTAgMTAwIDEwMEMxMjAgNzAgMTMwIDUwIDE1MCA1MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDMwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMTUwIDUwQzE3MCA1MCAxODAgNzAgMjAwIDEwMEMyMjAgMTUwIDIyMCAyMDAgMjAwIDMwMEMxODAgNDAwIDE4MCA1MDAgMTUwIDU1MEMxMjAgNTAwIDEyMCA0MDAgMTAwIDMwMEM4MCAyMDAgODAgMTUwIDEwMCAxMDBDMTIwIDcwIDEzMCA1MCAxNTAgNTBaIiBmaWxsPSIjRDFENURCIi8+PC9zdmc+'
      ];
    } else {
      return [
        '/lovable-uploads/e823d8ed-e260-4f9e-b0af-edf308ef3e29.png',
        'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&h=600&fit=crop&auto=format',
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDMwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNTBDMTcwIDUwIDE4MCA3MCAyMDAgMTAwQzIyMCAxNTAgMjIwIDIwMCAyMDAgMzAwQzE4MCA0MDAgMTgwIDUwMCAxNTAgNTUwQzEyMCA1MDAgMTIwIDQwMCAxMDAgMzAwQzgwIDIwMCA4MCAxNTAgMTAwIDEwMEMxMjAgNzAgMTMwIDUwIDE1MCA1MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDMwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMTUwIDUwQzE3MCA1MCAxODAgNzAgMjAwIDEwMEMyMjAgMTUwIDIyMCAyMDAgMjAwIDMwMEMxODAgNDAwIDE4MCA1MDAgMTUwIDU1MEMxMjAgNTAwIDEyMCA0MDAgMTAwIDMwMEM4MCAyMDAgODAgMTUwIDEwMCAxMDBDMTIwIDcwIDEzMCA1MCAxNTAgNTBaIiBmaWxsPSIjRDFENURCIi8+PC9zdmc+'
      ];
    }
  };

  // Enhanced image preloading with fallback logic
  const preloadImageWithFallbacks = async (side: 'front' | 'back'): Promise<string | null> => {
    const imageSources = getImageSources(side);
    
    for (let i = 0; i < imageSources.length; i++) {
      const url = imageSources[i];
      console.log(`Attempting to load ${side} view image ${i + 1}/${imageSources.length}:`, url);
      
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            console.log(`Successfully loaded ${side} view image:`, url);
            resolve();
          };
          img.onerror = (error) => {
            console.error(`Failed to load ${side} view image:`, url, error);
            reject(new Error(`Failed to load image: ${url}`));
          };
          img.src = url;
        });
        
        // If we get here, the image loaded successfully
        return url;
      } catch (error) {
        console.log(`Trying next fallback for ${side} view...`);
        setDebugInfo(`Failed source ${i + 1}: ${url.substring(0, 50)}...`);
        continue;
      }
    }
    
    console.error(`All image sources failed for ${side} view`);
    return null;
  };

  // Load images when component mounts or side changes
  useEffect(() => {
    const currentImageKey = currentSide;
    
    if (loadedImages[currentImageKey]?.isLoaded) {
      setImageLoading(false);
      setImageError(false);
      return;
    }

    setImageLoading(true);
    setImageError(false);
    setDebugInfo('Loading body map image...');

    preloadImageWithFallbacks(currentSide)
      .then((successfulUrl) => {
        if (successfulUrl) {
          setLoadedImages(prev => ({ 
            ...prev, 
            [currentImageKey]: {
              isLoaded: true,
              imageUrl: successfulUrl
            }
          }));
          setImageLoading(false);
          setImageError(false);
          setDebugInfo('');
        } else {
          setImageLoading(false);
          setImageError(true);
          setDebugInfo('All image sources failed to load');
        }
      })
      .catch((error) => {
        console.error('Error in image preloading:', error);
        setImageLoading(false);
        setImageError(true);
        setDebugInfo(`Error: ${error.message}`);
      });
  }, [currentSide]);

  // Get the loaded image URL
  const getLoadedImageUrl = () => {
    return loadedImages[currentSide]?.imageUrl || getImageSources(currentSide)[0];
  };

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
        {/* Debug Info */}
        {debugInfo && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Debug: {debugInfo}
          </div>
        )}

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
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-600 text-sm">Loading body map...</p>
                  <p className="text-gray-400 text-xs mt-1">Trying image sources...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {imageError && !imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                <div className="text-center text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-orange-400" />
                  <p className="text-sm font-medium">Body map temporarily unavailable</p>
                  <p className="text-xs text-gray-400 mt-1">Using fallback interface</p>
                  <div className="mt-4 p-4 bg-white rounded border">
                    <User className="h-16 w-16 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Click anywhere to add points</p>
                  </div>
                </div>
              </div>
            )}

            {/* Body Map Image */}
            {!imageLoading && !imageError && (
              <div 
                className="absolute inset-0 w-full h-full bg-no-repeat bg-center bg-contain"
                style={{ 
                  backgroundImage: `url(${getLoadedImageUrl()})`
                }}
              />
            )}

            {/* Injury points */}
            {currentSidePoints.map((point) => (
              <div
                key={point.id}
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-2 -translate-y-2 hover:scale-125 transition-transform z-30"
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
            {isAddingPoint && !imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-50 z-10">
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
