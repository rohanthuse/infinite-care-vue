
/**
 * Utility functions for body map features
 */

/**
 * Generates a data URL for body map SVG
 * @param type 'front' | 'back' - Which body view to generate
 * @returns string - Data URL for the SVG
 */
export function generateBodyMapSvg(type: 'front' | 'back'): string {
  // Anatomically accurate body outline SVG
  const frontBodySvg = `
  <svg width="200" height="500" viewBox="0 0 200 500" xmlns="http://www.w3.org/2000/svg">
    <style>
      .body-part { fill: #f9f9f9; stroke: #666; stroke-width: 1; }
      .body-part:hover { fill: #f0f0f0; cursor: pointer; }
      .body-outline { fill: none; stroke: #555; stroke-width: 1.2; }
    </style>
    <!-- Head -->
    <g class="body-part">
      <ellipse cx="100" cy="40" rx="30" ry="35" />
      <!-- Face features -->
      <ellipse cx="90" cy="35" rx="3" ry="4" fill="#555" /> <!-- Left eye -->
      <ellipse cx="110" cy="35" rx="3" ry="4" fill="#555" /> <!-- Right eye -->
      <path d="M95 45 Q100 50 105 45" stroke="#555" stroke-width="1.5" fill="none" /> <!-- Mouth -->
      <path d="M100 35 L100 40" stroke="#555" stroke-width="1" /> <!-- Nose -->
    </g>
    
    <!-- Neck -->
    <path class="body-part" d="M85 65 C85 55, 115 55, 115 65 L115 75 L85 75 Z" />
    
    <!-- Torso -->
    <path class="body-part" d="M85 75 L85 200 C85 215, 115 215, 115 200 L115 75 Z" />
    
    <!-- Shoulders -->
    <path class="body-part" d="M85 85 L60 95 L60 105 L85 100 Z" /> <!-- Left shoulder -->
    <path class="body-part" d="M115 85 L140 95 L140 105 L115 100 Z" /> <!-- Right shoulder -->
    
    <!-- Arms -->
    <path class="body-part" d="M60 105 L50 160 L65 160 L65 105 Z" /> <!-- Left upper arm -->
    <path class="body-part" d="M140 105 L150 160 L135 160 L135 105 Z" /> <!-- Right upper arm -->
    
    <!-- Forearms -->
    <path class="body-part" d="M50 160 L45 210 L65 210 L65 160 Z" /> <!-- Left forearm -->
    <path class="body-part" d="M150 160 L155 210 L135 210 L135 160 Z" /> <!-- Right forearm -->
    
    <!-- Hands -->
    <ellipse class="body-part" cx="55" cy="220" rx="12" ry="15" /> <!-- Left hand -->
    <ellipse class="body-part" cx="145" cy="220" rx="12" ry="15" /> <!-- Right hand -->
    
    <!-- Pelvis -->
    <path class="body-part" d="M85 200 C85 220, 115 220, 115 200 L115 230 L85 230 Z" />
    
    <!-- Legs -->
    <path class="body-part" d="M85 230 L80 350 L95 350 L95 230 Z" /> <!-- Left leg -->
    <path class="body-part" d="M115 230 L120 350 L105 350 L105 230 Z" /> <!-- Right leg -->
    
    <!-- Lower legs -->
    <path class="body-part" d="M80 350 L75 450 L95 450 L95 350 Z" /> <!-- Left lower leg -->
    <path class="body-part" d="M120 350 L125 450 L105 450 L105 350 Z" /> <!-- Right lower leg -->
    
    <!-- Feet -->
    <path class="body-part" d="M75 450 L60 460 L95 460 L95 450 Z" /> <!-- Left foot -->
    <path class="body-part" d="M125 450 L140 460 L105 460 L105 450 Z" /> <!-- Right foot -->
  </svg>
  `;
  
  const backBodySvg = `
  <svg width="200" height="500" viewBox="0 0 200 500" xmlns="http://www.w3.org/2000/svg">
    <style>
      .body-part { fill: #f9f9f9; stroke: #666; stroke-width: 1; }
      .body-part:hover { fill: #f0f0f0; cursor: pointer; }
      .body-outline { fill: none; stroke: #555; stroke-width: 1.2; }
    </style>
    <!-- Head -->
    <ellipse class="body-part" cx="100" cy="40" rx="30" ry="35" />
    
    <!-- Neck -->
    <path class="body-part" d="M85 65 C85 55, 115 55, 115 65 L115 75 L85 75 Z" />
    
    <!-- Torso -->
    <path class="body-part" d="M85 75 L85 200 C85 215, 115 215, 115 200 L115 75 Z" />
    
    <!-- Shoulders -->
    <path class="body-part" d="M85 85 L60 95 L60 105 L85 100 Z" /> <!-- Left shoulder -->
    <path class="body-part" d="M115 85 L140 95 L140 105 L115 100 Z" /> <!-- Right shoulder -->
    
    <!-- Arms -->
    <path class="body-part" d="M60 105 L50 160 L65 160 L65 105 Z" /> <!-- Left upper arm -->
    <path class="body-part" d="M140 105 L150 160 L135 160 L135 105 Z" /> <!-- Right upper arm -->
    
    <!-- Forearms -->
    <path class="body-part" d="M50 160 L45 210 L65 210 L65 160 Z" /> <!-- Left forearm -->
    <path class="body-part" d="M150 160 L155 210 L135 210 L135 160 Z" /> <!-- Right forearm -->
    
    <!-- Hands -->
    <ellipse class="body-part" cx="55" cy="220" rx="12" ry="15" /> <!-- Left hand -->
    <ellipse class="body-part" cx="145" cy="220" rx="12" ry="15" /> <!-- Right hand -->
    
    <!-- Pelvis -->
    <path class="body-part" d="M85 200 C85 220, 115 220, 115 200 L115 230 L85 230 Z" />
    
    <!-- Legs -->
    <path class="body-part" d="M85 230 L80 350 L95 350 L95 230 Z" /> <!-- Left leg -->
    <path class="body-part" d="M115 230 L120 350 L105 350 L105 230 Z" /> <!-- Right leg -->
    
    <!-- Lower legs -->
    <path class="body-part" d="M80 350 L75 450 L95 450 L95 350 Z" /> <!-- Left lower leg -->
    <path class="body-part" d="M120 350 L125 450 L105 450 L105 350 Z" /> <!-- Right lower leg -->
    
    <!-- Feet -->
    <path class="body-part" d="M75 450 L60 460 L95 460 L95 450 Z" /> <!-- Left foot -->
    <path class="body-part" d="M125 450 L140 460 L105 460 L105 450 Z" /> <!-- Right foot -->
    
    <!-- Back features -->
    <path d="M100 75 L100 200" stroke="#888" stroke-width="0.8" fill="none" /> <!-- Spine -->
    <path d="M90 110 L110 110" stroke="#888" stroke-width="0.8" fill="none" /> <!-- Shoulder blades upper -->
    <path d="M88 130 L112 130" stroke="#888" stroke-width="0.8" fill="none" /> <!-- Shoulder blades lower -->
  </svg>
  `;
  
  const svg = type === 'front' ? frontBodySvg : backBodySvg;
  
  // Convert SVG to data URL
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Gets injury type color class
 * @param type string - Injury type
 * @returns string - Tailwind class for the injury color
 */
export function getInjuryColorClass(type: string): string {
  switch(type) {
    case 'bruise': return 'bg-purple-500';
    case 'cut': return 'bg-red-500';
    case 'burn': return 'bg-orange-500';
    case 'rash': return 'bg-pink-500';
    case 'swelling': return 'bg-blue-500';
    case 'fracture': return 'bg-amber-600';
    case 'pressure_sore': return 'bg-emerald-600';
    case 'other': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
}

/**
 * Gets injury type label
 * @param type string - Injury type
 * @returns string - Human-readable label
 */
export function getInjuryLabel(type: string): string {
  switch(type) {
    case 'bruise': return 'Bruise';
    case 'cut': return 'Cut/Laceration';
    case 'burn': return 'Burn';
    case 'rash': return 'Rash';
    case 'swelling': return 'Swelling';
    case 'fracture': return 'Fracture';
    case 'pressure_sore': return 'Pressure Sore';
    case 'other': return 'Other';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
