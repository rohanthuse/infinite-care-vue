
/**
 * Utility functions for body map features
 */

/**
 * Generates a data URL for body map SVG
 * @param type 'front' | 'back' - Which body view to generate
 * @returns string - Data URL for the SVG
 */
export function generateBodyMapSvg(type: 'front' | 'back'): string {
  // Basic body outline SVG
  const frontBodySvg = `
  <svg width="200" height="400" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
    <style>
      .body-part { fill: #f2f2f2; stroke: #666; stroke-width: 1.5; }
      .body-part:hover { fill: #e6e6e6; }
    </style>
    <!-- Head -->
    <circle cx="100" cy="40" r="30" class="body-part" />
    <!-- Body -->
    <rect x="70" y="70" width="60" height="120" rx="10" class="body-part" />
    <!-- Arms -->
    <rect x="35" y="80" width="35" height="100" rx="10" class="body-part" />
    <rect x="130" y="80" width="35" height="100" rx="10" class="body-part" />
    <!-- Legs -->
    <rect x="75" y="190" width="25" height="150" rx="10" class="body-part" />
    <rect x="100" y="190" width="25" height="150" rx="10" class="body-part" />
    <!-- Feet -->
    <rect x="75" y="340" width="25" height="20" rx="5" class="body-part" />
    <rect x="100" y="340" width="25" height="20" rx="5" class="body-part" />
  </svg>
  `;
  
  const backBodySvg = `
  <svg width="200" height="400" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
    <style>
      .body-part { fill: #f2f2f2; stroke: #666; stroke-width: 1.5; }
      .body-part:hover { fill: #e6e6e6; }
    </style>
    <!-- Head -->
    <circle cx="100" cy="40" r="30" class="body-part" />
    <!-- Body -->
    <rect x="70" y="70" width="60" height="120" rx="10" class="body-part" />
    <!-- Arms -->
    <rect x="35" y="80" width="35" height="100" rx="10" class="body-part" />
    <rect x="130" y="80" width="35" height="100" rx="10" class="body-part" />
    <!-- Legs -->
    <rect x="75" y="190" width="25" height="150" rx="10" class="body-part" />
    <rect x="100" y="190" width="25" height="150" rx="10" class="body-part" />
    <!-- Feet -->
    <rect x="75" y="340" width="25" height="20" rx="5" class="body-part" />
    <rect x="100" y="340" width="25" height="20" rx="5" class="body-part" />
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
