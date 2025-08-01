import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, Save, X, Undo2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  width?: number;
  height?: number;
  initialSignature?: string;
  disabled?: boolean;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  width = 500,
  height = 200,
  initialSignature,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [currentStroke, setCurrentStroke] = useState<any[]>([]);
  
  const isTablet = useMediaQuery("(max-width: 1023px)");
  const isMobile = useMediaQuery("(max-width: 640px)");

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
      };
      img.src = initialSignature;
    }
  }, [width, height, initialSignature, isMobile, isTablet]);

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
    const coords = getCoordinates(e);
    
    // Prevent scrolling on touch devices
    if ('touches' in e) {
      e.preventDefault();
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
    setStrokes([]);
    setCurrentStroke([]);
    onSave("");
    toast.success("Signature cleared");
  };

  const undoStroke = () => {
    if (disabled || strokes.length === 0) return;
    
    setStrokes(prev => prev.slice(0, -1));
    setHasContent(strokes.length > 1);
    
    // Redraw without the last stroke
    setTimeout(redrawCanvas, 0);
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
        
      </div>
      
      {/* Single row layout with placeholder and buttons */}
      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border">
        {!hasContent && !disabled && (
          <div className="flex items-center gap-2 text-muted-foreground mr-2">
            <PenLine className="h-4 w-4" />
            <span className="text-sm">Sign here →</span>
          </div>
        )}
        
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
      </div>
    </div>
  );
};
