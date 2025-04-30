
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, Save, X } from "lucide-react";

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  width?: number;
  height?: number;
  initialSignature?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  width = 500,
  height = 200,
  initialSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas display size
    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;
    
    // Set actual size in memory (scaled to account for extra pixel density)
    const scale = window.devicePixelRatio;
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    // Normalize coordinate system to use CSS pixels
    ctx.scale(scale, scale);
    
    // Set drawing styles
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";

    // If there's an initial signature, load it
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasContent(true);
      };
      img.src = initialSignature;
    }
  }, [width, height, initialSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsDrawing(true);
    
    // Get coordinates
    let x, y;
    if ('touches' in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Get coordinates
    let x, y;
    if ('touches' in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
      
      // Prevent scrolling on touch devices
      e.preventDefault();
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onSave("");
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="signature-canvas flex flex-col">
      <div className="border rounded-md bg-white relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="touch-none cursor-crosshair"
        ></canvas>
        
        {!hasContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <PenLine className="h-6 w-6 mb-2" />
            <span className="text-sm">Sign here</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 mt-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={clearCanvas}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          <span>Clear</span>
        </Button>
        <Button 
          type="button" 
          size="sm" 
          onClick={saveSignature}
          className="flex items-center gap-1"
          disabled={!hasContent}
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
      </div>
    </div>
  );
};
