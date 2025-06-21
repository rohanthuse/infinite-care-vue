

import { supabase } from "@/integrations/supabase/client";

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

export interface GeneratedBodyMapImages {
  frontImageUrl?: string;
  backImageUrl?: string;
}

/**
 * Generates static JPG images for body map with marked points using realistic body diagrams
 */
export async function generateBodyMapImages(
  bodyMapPoints: BodyMapPoint[],
  eventId: string
): Promise<GeneratedBodyMapImages> {
  const frontPoints = bodyMapPoints.filter(point => point.side === 'front');
  const backPoints = bodyMapPoints.filter(point => point.side === 'back');
  
  const results: GeneratedBodyMapImages = {};
  
  // Generate front view image if there are front points
  if (frontPoints.length > 0) {
    results.frontImageUrl = await generateSingleBodyMapImage('front', frontPoints, eventId);
  }
  
  // Generate back view image if there are back points
  if (backPoints.length > 0) {
    results.backImageUrl = await generateSingleBodyMapImage('back', backPoints, eventId);
  }
  
  return results;
}

/**
 * Generates a single body map image for the specified side using realistic body diagrams
 */
async function generateSingleBodyMapImage(
  side: 'front' | 'back',
  points: BodyMapPoint[],
  eventId: string
): Promise<string | undefined> {
  try {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Set canvas size to match the marking interface dimensions (600px height)
    canvas.width = 300;
    canvas.height = 600;
    
    // Get the realistic body image URL
    const imageUrl = side === 'front' 
      ? '/lovable-uploads/ae9319f2-7a0b-422d-9739-bb11a44681c9.png'  // Front view
      : '/lovable-uploads/039ad1bb-2eff-43f0-9b7d-fdc323188cc0.png'; // Back view
    
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Allow cross-origin loading
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // Clear canvas with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the realistic body diagram as background
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Draw the marked points on top with coordinate conversion
          points.forEach(point => {
            // Convert percentage coordinates to pixel coordinates
            const pixelX = (point.x / 100) * canvas.width;
            const pixelY = (point.y / 100) * canvas.height;
            
            // Draw point circle with border
            ctx.beginPath();
            ctx.arc(pixelX, pixelY, 10, 0, 2 * Math.PI);
            ctx.fillStyle = point.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw point label (letter/number)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(point.id.slice(-1).toUpperCase(), pixelX, pixelY);
          });
          
          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }
            
            try {
              // Upload to Supabase storage
              const fileName = `${eventId}_${side}_${Date.now()}.jpg`;
              const { data, error } = await supabase.storage
                .from('body-map-images')
                .upload(fileName, blob, {
                  contentType: 'image/jpeg',
                  upsert: true
                });
              
              if (error) throw error;
              
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('body-map-images')
                .getPublicUrl(fileName);
              
              resolve(urlData.publicUrl);
            } catch (uploadError) {
              console.error('Error uploading body map image:', uploadError);
              reject(uploadError);
            }
          }, 'image/jpeg', 0.9);
        } catch (drawError) {
          console.error('Error drawing body map:', drawError);
          reject(drawError);
        }
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load realistic body diagram: ${imageUrl}`));
      };
      
      // Load the realistic body image
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error generating body map image:', error);
    return undefined;
  }
}

/**
 * Deletes body map images from storage
 */
export async function deleteBodyMapImages(frontImageUrl?: string, backImageUrl?: string): Promise<void> {
  const filesToDelete: string[] = [];
  
  if (frontImageUrl) {
    const fileName = frontImageUrl.split('/').pop();
    if (fileName) filesToDelete.push(fileName);
  }
  
  if (backImageUrl) {
    const fileName = backImageUrl.split('/').pop();
    if (fileName) filesToDelete.push(fileName);
  }
  
  if (filesToDelete.length > 0) {
    const { error } = await supabase.storage
      .from('body-map-images')
      .remove(filesToDelete);
    
    if (error) {
      console.error('Error deleting body map images:', error);
    }
  }
}

