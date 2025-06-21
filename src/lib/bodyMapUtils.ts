
/**
 * Utility functions for body map features
 */

/**
 * Generates a data URL for body map SVG
 * @param type 'front' | 'back' - Which body view to generate
 * @returns string - Data URL for the SVG
 */
export function generateBodyMapSvg(type: 'front' | 'back'): string {
  // Realistic human body outline SVG for front view
  const frontBodySvg = `
  <svg width="300" height="500" viewBox="0 0 300 500" xmlns="http://www.w3.org/2000/svg">
    <style>
      .body-outline { fill: #f8f9fa; stroke: #495057; stroke-width: 2; }
      .body-detail { fill: none; stroke: #6c757d; stroke-width: 1; }
    </style>
    <defs>
      <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Head -->
    <ellipse cx="150" cy="45" rx="35" ry="40" class="body-outline" fill="url(#bodyGradient)" />
    <!-- Face features -->
    <circle cx="140" cy="40" r="3" fill="#495057" />
    <circle cx="160" cy="40" r="3" fill="#495057" />
    <path d="M140 50 Q150 55 160 50" stroke="#495057" stroke-width="2" fill="none" />
    
    <!-- Neck -->
    <rect x="135" y="85" width="30" height="25" rx="15" class="body-outline" fill="url(#bodyGradient)" />
    
    <!-- Torso -->
    <path d="M110 110 Q105 120 105 140 L105 280 Q105 300 120 310 L180 310 Q195 300 195 280 L195 140 Q195 120 190 110 L170 110 Q160 105 150 105 Q140 105 130 110 Z" 
          class="body-outline" fill="url(#bodyGradient)" />
    
    <!-- Chest details -->
    <circle cx="135" cy="160" r="8" class="body-detail" />
    <circle cx="165" cy="160" r="8" class="body-detail" />
    
    <!-- Arms -->
    <!-- Left arm -->
    <ellipse cx="85" cy="150" rx="15" ry="45" transform="rotate(-15 85 150)" class="body-outline" fill="url(#bodyGradient)" />
    <ellipse cx="65" cy="220" rx="12" ry="35" transform="rotate(-10 65 220)" class="body-outline" fill="url(#bodyGradient)" />
    <ellipse cx="50" cy="270" rx="15" ry="20" class="body-outline" fill="url(#bodyGradient)" />
    
    <!-- Right arm -->
    <ellipse cx="215" cy="150" rx="15" ry="45" transform="rotate(15 215 150)" class="body-outline" fill="url(#bodyGradient)" />
    <ellipse cx="235" cy="220" rx="12" ry="35" transform="rotate(10 235 220)" class="body-outline" fill="url(#bodyGradient)" />
    <ellipse cx="250" cy="270" rx="15" ry="20" class="body-outline" fill="url(#bodyGradient)" />
    
    <!-- Pelvis -->
    <ellipse cx="150" cy="330" rx="45" ry="25" class="body-outline" fill="url(#bodyGradient)" />
    
    <!-- Legs -->
    <!-- Left leg -->
    <ellipse cx="125" cy="390" rx="18" ry="55" class="body-outline" fill="url(#bodyGradient)" />
    <ellipse cx="120" cy="460" rx="15" ry="40" class="body-outline" fill="url(#bodyGradient)" />
    
    <!-- Right leg -->
    <ellipse cx="175" cy="390" rx="18" ry="55" class="body-outline" fill="url(#bodyGradient)" />
    <ellipse cx="180" cy="460" rx="15" ry="40" class="body-outline" fill="url(#bodyGradient)" />
    
    <!-- Feet -->
    <ellipse cx="115" cy="485" rx="20" ry="12" class="body-outline" fill="url(#bodyGradient)" />
    <ellipse cx="185" cy="485" rx="20" ry="12" class="body-outline" fill="url(#bodyGradient)" />
    
    <!-- Joint indicators -->
    <circle cx="85" cy="180" r="3" fill="#6c757d" />
    <circle cx="215" cy="180" r="3" fill="#6c757d" />
    <circle cx="125" cy="355" r="3" fill="#6c757d" />
    <circle cx="175" cy="355" r="3" fill="#6c757d" />
    <circle cx="120" cy="425" r="3" fill="#6c757d" />
    <circle cx="180" cy="425" r="3" fill="#6c757d" />
  </svg>
  `;
  
  // Realistic human body outline SVG for back view
  const backBodySvg = `
  <svg width="300" height="500" viewBox="0 0 300 500" xmlns="http://www.w3.org/2000/svg">
    <style>
      .body-outline { fill: #f8f9fa; stroke: #495057; stroke-width: 2; }
      .body-detail { fill: none; stroke: #6c757d; stroke-width: 1; }
    </style>
    <defs>
      <linearGradient id="bodyGradientBack" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Head -->
    <ellipse cx="150" cy="45" rx="35" ry="40" class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Neck -->
    <rect x="135" y="85" width="30" height="25" rx="15" class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Torso -->
    <path d="M110 110 Q105 120 105 140 L105 280 Q105 300 120 310 L180 310 Q195 300 195 280 L195 140 Q195 120 190 110 L170 110 Q160 105 150 105 Q140 105 130 110 Z" 
          class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Spine -->
    <line x1="150" y1="110" x2="150" y2="310" stroke="#6c757d" stroke-width="2" />
    <circle cx="150" cy="130" r="2" fill="#6c757d" />
    <circle cx="150" cy="160" r="2" fill="#6c757d" />
    <circle cx="150" cy="190" r="2" fill="#6c757d" />
    <circle cx="150" cy="220" r="2" fill="#6c757d" />
    <circle cx="150" cy="250" r="2" fill="#6c757d" />
    <circle cx="150" cy="280" r="2" fill="#6c757d" />
    
    <!-- Shoulder blades -->
    <ellipse cx="125" cy="140" rx="20" ry="30" class="body-detail" />
    <ellipse cx="175" cy="140" rx="20" ry="30" class="body-detail" />
    
    <!-- Arms -->
    <!-- Left arm -->
    <ellipse cx="85" cy="150" rx="15" ry="45" transform="rotate(-15 85 150)" class="body-outline" fill="url(#bodyGradientBack)" />
    <ellipse cx="65" cy="220" rx="12" ry="35" transform="rotate(-10 65 220)" class="body-outline" fill="url(#bodyGradientBack)" />
    <ellipse cx="50" cy="270" rx="15" ry="20" class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Right arm -->
    <ellipse cx="215" cy="150" rx="15" ry="45" transform="rotate(15 215 150)" class="body-outline" fill="url(#bodyGradientBack)" />
    <ellipse cx="235" cy="220" rx="12" ry="35" transform="rotate(10 235 220)" class="body-outline" fill="url(#bodyGradientBack)" />
    <ellipse cx="250" cy="270" rx="15" ry="20" class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Pelvis -->
    <ellipse cx="150" cy="330" rx="45" ry="25" class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Legs -->
    <!-- Left leg -->
    <ellipse cx="125" cy="390" rx="18" ry="55" class="body-outline" fill="url(#bodyGradientBack)" />
    <ellipse cx="120" cy="460" rx="15" ry="40" class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Right leg -->
    <ellipse cx="175" cy="390" rx="18" ry="55" class="body-outline" fill="url(#bodyGradientBack)" />
    <ellipse cx="180" cy="460" rx="15" ry="40" class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Feet -->
    <ellipse cx="115" cy="485" rx="20" ry="12" class="body-outline" fill="url(#bodyGradientBack)" />
    <ellipse cx="185" cy="485" rx="20" ry="12" class="body-outline" fill="url(#bodyGradientBack)" />
    
    <!-- Joint indicators -->
    <circle cx="85" cy="180" r="3" fill="#6c757d" />
    <circle cx="215" cy="180" r="3" fill="#6c757d" />
    <circle cx="125" cy="355" r="3" fill="#6c757d" />
    <circle cx="175" cy="355" r="3" fill="#6c757d" />
    <circle cx="120" cy="425" r="3" fill="#6c757d" />
    <circle cx="180" cy="425" r="3" fill="#6c757d" />
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
