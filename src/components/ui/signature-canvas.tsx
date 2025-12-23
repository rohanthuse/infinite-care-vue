import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, Save, X, Undo2, Check } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  width?: number;
  height?: number;
  initialSignature?: string;
  disabled?: boolean;
  autoSave?: boolean;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  width = 500,
  height = 200,
  initialSignature,
  disabled = false,
  autoSave = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [currentStroke, setCurrentStroke] = useState<any[]>([]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isTablet = useMediaQuery("(max-width: 1023px)");
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Auto-save function with debounce
  const performAutoSave = useCallback(() => {
    if (disabled || !autoSave) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
      setIsSaved(true);
    } catch (error) {
      console.error("Error auto-saving signature:", error);
    }
  }, [disabled, autoSave, onSave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas display size - adapt to container width
    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;
    
    // Calculate actual dimensions based on container
    const rect = canvas.getBoundingClientRect();
    const actualWidth = rect.width || width;
    const actualHeight = height;
    
    // Set actual size in memory (scaled to account for extra pixel density)
    const scale = window.devicePixelRatio || 1;
    canvas.width = actualWidth * scale;
    canvas.height = actualHeight * scale;
    
    // Normalize coordinate system to use CSS pixels
    ctx.scale(scale, scale);
    
    // Set drawing styles - larger lines for touch devices
    ctx.lineWidth = isMobile || isTablet ? 3 : 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#fff";
    
    // Clear with white background
    ctx.fillRect(0, 0, actualWidth, actualHeight);

    // If there's an initial signature, load it
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, actualWidth, actualHeight);
        setHasContent(true);
        setIsSaved(true);
      };
      img.src = initialSignature;
    }
  }, [width, height, initialSignature, isMobile, isTablet]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Redraw all strokes
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const actualWidth = rect.width || width;
    const actualHeight = height;
    
    // Clear and set background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, actualWidth, actualHeight);
    
    // Set drawing styles
    ctx.lineWidth = isMobile || isTablet ? 3 : 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    
    // Redraw all strokes
    strokes.forEach(stroke => {
      if (stroke.length > 1) {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        stroke.forEach((point: any, index: number) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }
    });
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsDrawing(true);
    setIsSaved(false); // Reset saved state when new drawing starts
    const coords = getCoordinates(e);
    
    // Prevent scrolling on touch devices
    if ('touches' in e) {
      e.preventDefault();
    }
    
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    setCurrentStroke([coords]);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const coords = getCoordinates(e);
    
    // Prevent scrolling on touch devices
    if ('touches' in e) {
      e.preventDefault();
    }
    
    setCurrentStroke(prev => [...prev, coords]);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasContent(true);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke([]);
      
      // Auto-save after a short delay when user finishes drawing
      if (autoSave && hasContent) {
        // Clear any existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        // Debounce auto-save by 500ms to allow for multiple strokes
        autoSaveTimeoutRef.current = setTimeout(() => {
          performAutoSave();
        }, 500);
      }
    }
  };

  const clearCanvas = () => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const actualWidth = rect.width || width;
    const actualHeight = height;
    
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, actualWidth, actualHeight);
    
    setHasContent(false);
    setIsSaved(false);
    setStrokes([]);
    setCurrentStroke([]);
    
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    onSave("");
    toast.success("Signature cleared");
  };

  const undoStroke = () => {
    if (disabled || strokes.length === 0) return;
    
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    setHasContent(newStrokes.length > 0);
    setIsSaved(false);
    
    // Redraw without the last stroke
    setTimeout(() => {
      redrawCanvas();
      // Auto-save after undo if there's still content
      if (autoSave && newStrokes.length > 0) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          performAutoSave();
        }, 500);
      } else if (newStrokes.length === 0) {
        onSave("");
      }
    }, 0);
    toast.success("Last stroke undone");
  };

  const saveSignature = () => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (!hasContent) {
      toast.error("Please draw a signature first");
      return;
    }
    
    try {
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
      setIsSaved(true);
      toast.success("Signature saved");
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Failed to save signature");
    }
  };

  return (
    <div className="signature-canvas flex flex-col">
      <div className="border rounded-md bg-white relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className={cn(
            "touch-none",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-crosshair"
          )}
        />
        
        {!hasContent && !disabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <PenLine className="h-6 w-6 mb-2" />
            <span className="text-sm">Sign here</span>
          </div>
        )}
        
        {/* Auto-saved indicator */}
        {isSaved && hasContent && autoSave && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
            <Check className="h-3 w-3" />
            <span>Saved</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between gap-2 mt-4 pt-3 border-t border-border">
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size={isMobile ? "default" : "sm"}
            onClick={undoStroke}
            disabled={disabled || strokes.length === 0}
            className="flex items-center gap-2 min-h-[40px] shadow-sm hover:shadow-md transition-shadow font-medium"
          >
            <Undo2 className="h-4 w-4" />
            <span>Undo</span>
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size={isMobile ? "default" : "sm"}
            onClick={clearCanvas}
            disabled={disabled || strokes.length === 0}
            className="flex items-center gap-2 min-h-[40px] shadow-sm hover:shadow-md transition-shadow font-medium"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        </div>
        
        {/* Show save button only if autoSave is disabled, or show saved state */}
        {!autoSave ? (
          <Button 
            type="button" 
            size={isMobile ? "default" : "sm"}
            onClick={saveSignature}
            disabled={disabled || !hasContent}
            className="flex items-center gap-2 min-h-[40px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all font-medium px-6"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
        ) : (
          <div className={cn(
            "flex items-center gap-2 min-h-[40px] px-4 rounded-md font-medium text-sm",
            isSaved && hasContent 
              ? "bg-green-100 text-green-700" 
              : hasContent 
                ? "bg-muted text-muted-foreground" 
                : "bg-muted/50 text-muted-foreground/50"
          )}>
            {isSaved && hasContent ? (
              <>
                <Check className="h-4 w-4" />
                <span>Saved</span>
              </>
            ) : hasContent ? (
              <span>Auto-saving...</span>
            ) : (
              <span>Draw to sign</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
