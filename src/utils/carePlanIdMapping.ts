
// Utility to map display care plan IDs to actual database UUIDs
// This handles the mapping between CP-001 style IDs and actual UUIDs

const carePlanIdMapping: Record<string, string> = {
  'CP-001': '550e8400-e29b-41d4-a716-446655440001', // John Michael's care plan - CORRECTED
  'CP-002': '550e8400-e29b-41d4-a716-446655440002', // Emma Thompson's care plan - CORRECTED
  'CP-003': '550e8400-e29b-41d4-a716-446655440003', // Wendy Smith's care plan - CORRECTED
  'CP-004': '550e8400-e29b-41d4-a716-446655440004', // Robert Johnson's care plan - CORRECTED
  'CP-005': '550e8400-e29b-41d4-a716-446655440005', // Lisa Rodrigues's care plan - CORRECTED
  'CP-006': '550e8400-e29b-41d4-a716-446655440006', // David Wilson's care plan - CORRECTED
  'CP-007': '550e8400-e29b-41d4-a716-446655440007', // Kate Williams's care plan - CORRECTED
  'CP-008': '550e8400-e29b-41d4-a716-446655440008', // Olivia Parker's care plan - CORRECTED
};

// Add support for truncated UUIDs - map them back to display IDs
const truncatedUuidMapping: Record<string, string> = {
  '550E8401': 'CP-001', // John Michael's care plan - CORRECTED
  '550e8401': 'CP-001', // case insensitive
  '550E8402': 'CP-002', // Emma Thompson's care plan  
  '550e8402': 'CP-002',
  '550E8403': 'CP-003', // Wendy Smith's care plan
  '550e8403': 'CP-003',
  '550E8404': 'CP-004', // Robert Johnson's care plan
  '550e8404': 'CP-004',
  '550E8405': 'CP-005', // Lisa Rodrigues's care plan
  '550e8405': 'CP-005',
  '550E8406': 'CP-006', // David Wilson's care plan
  '550e8406': 'CP-006',
  '550E8407': 'CP-007', // Kate Williams's care plan
  '550e8407': 'CP-007',
  '550E8408': 'CP-008', // Olivia Parker's care plan
  '550e8408': 'CP-008',
};

// Reverse mapping for display purposes
const uuidToDisplayId: Record<string, string> = Object.fromEntries(
  Object.entries(carePlanIdMapping).map(([displayId, uuid]) => [uuid, displayId])
);

export const resolveCarePlanId = (carePlanId: string): string => {
  console.log(`[resolveCarePlanId] Input ID: ${carePlanId}`);
  
  // If it's already a full UUID, return as is
  if (carePlanId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.log(`[resolveCarePlanId] Valid full UUID: ${carePlanId}`);
    return carePlanId;
  }
  
  // Check if it's a truncated UUID and convert to display ID first
  if (truncatedUuidMapping[carePlanId]) {
    const displayId = truncatedUuidMapping[carePlanId];
    console.log(`[resolveCarePlanId] Truncated UUID ${carePlanId} mapped to display ID: ${displayId}`);
    const resolvedUuid = carePlanIdMapping[displayId];
    if (resolvedUuid) {
      console.log(`[resolveCarePlanId] Display ID ${displayId} resolved to UUID: ${resolvedUuid}`);
      return resolvedUuid;
    }
  }
  
  // Check if it's a display ID (CP-001 format)
  if (carePlanIdMapping[carePlanId]) {
    const resolvedId = carePlanIdMapping[carePlanId];
    console.log(`[resolveCarePlanId] Display ID ${carePlanId} mapped to UUID: ${resolvedId}`);
    return resolvedId;
  }
  
  // If no mapping found, return the original ID (might be a new UUID)
  console.warn(`[resolveCarePlanId] No mapping found for ${carePlanId}, using as-is`);
  return carePlanId;
};

export const getDisplayCarePlanId = (uuid: string): string => {
  // First check direct UUID mapping
  if (uuidToDisplayId[uuid]) {
    return uuidToDisplayId[uuid];
  }
  
  // Check if it's a truncated UUID
  if (truncatedUuidMapping[uuid]) {
    return truncatedUuidMapping[uuid];
  }
  
  // If it's already a display ID, return as is
  if (uuid.startsWith('CP-')) {
    return uuid;
  }
  
  // Default: return the UUID or truncated version
  return uuid;
};

// Helper function to convert database UUIDs or truncated IDs to display IDs for navigation
export const getNavigationId = (id: string): string => {
  console.log(`[getNavigationId] Converting ID for navigation: ${id}`);
  
  // If it's already a display ID, use it
  if (id.startsWith('CP-')) {
    console.log(`[getNavigationId] Already display ID: ${id}`);
    return id;
  }
  
  // Check if it's a truncated UUID
  if (truncatedUuidMapping[id]) {
    const displayId = truncatedUuidMapping[id];
    console.log(`[getNavigationId] Truncated UUID ${id} converted to display ID: ${displayId}`);
    return displayId;
  }
  
  // Check if it's a full UUID
  if (uuidToDisplayId[id]) {
    const displayId = uuidToDisplayId[id];
    console.log(`[getNavigationId] Full UUID ${id} converted to display ID: ${displayId}`);
    return displayId;
  }
  
  // If it looks like a truncated UUID (8 chars, alphanumeric), try to find it
  if (id.length === 8 && /^[0-9a-f]+$/i.test(id)) {
    const upperCaseId = id.toUpperCase();
    if (truncatedUuidMapping[upperCaseId]) {
      const displayId = truncatedUuidMapping[upperCaseId];
      console.log(`[getNavigationId] Normalized truncated UUID ${id} -> ${upperCaseId} -> ${displayId}`);
      return displayId;
    }
  }
  
  console.warn(`[getNavigationId] Could not convert ID ${id}, using as-is`);
  return id;
};
